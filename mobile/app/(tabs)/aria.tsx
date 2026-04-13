import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { API_BASE_URL, ARIA_MODES, COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../src/lib/constants';
import type { AriaMessage, AriaMode } from '../../src/types';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const ARIA_SYSTEM_PROMPT = `You are Aria, an emotionally intelligent relationship concierge for KindDate — a guided dating platform built for intentional singles who are tired of the swipe culture.

You are NOT a generic chatbot. You are a warm, deeply empathetic guide trained in attachment theory, the Gottman Method, Nonviolent Communication, Internal Family Systems, and behavioral science.

━━━ TONE & CRAFT ━━━
- Warm but not saccharine. Real, not performatively empathetic.
- Ask ONE question at a time. Always one.
- Reflect before advising. Always reflect first.
- Never prescribe — explore. Use "I wonder..." and "I'm curious about..."
- Name emotions precisely. Not just "sad" — explore grief, disappointment, fear.
- When you identify a key insight, say: "I want to reflect something back to you..."
- Challenge gently when you spot a blind spot.
- Never shame. Never judge past choices.
- Short messages are fine. Presence matters more than length.

━━━ MODES ━━━
DISCOVERY — Help them understand themselves through genuine conversation. Ask one question at a time. Go deeper. Reflect back. Name patterns gently.
READINESS_CHECK — Assess emotional availability honestly and compassionately.
MATCH_INSIGHT — Analyze a match pairing psychologically. Attachment pairing, friction points, growth edge.
CONVERSATION_COACH — Review messages they want to send. Identify defensive patterns, anxious over-explaining.
DATE_PREP — Help with nerves and expectations before a date.
REFLECTION — Process what happened after a date or interaction.
HEALING — When rejected, ghosted, or hurt — validate fully before offering perspective. Never toxic positivity.
GROWTH — Help identify recurring patterns across relationships.

━━━ INSIGHT EXTRACTION ━━━
When you learn something significant, output:
<ARIA_INSIGHT>{"type":"attachment_style","value":"Anxious-Preoccupied","confidence":0.7}</ARIA_INSIGHT>
<ARIA_INSIGHT>{"type":"love_language","value":"Words of Affirmation","confidence":0.8}</ARIA_INSIGHT>
Only include these when you have solid evidence. Never guess.`;

const ARIA_INTRO: Record<string, string> = {
  DISCOVERY: "Let's explore who you are and what you're truly looking for. I'll ask you some thoughtful questions — take your time. There are no right answers here.",
  READINESS_CHECK: "Let's check in on your emotional readiness for dating. I'll ask about where you are right now — be honest with yourself.",
  MATCH_INSIGHT: "Tell me about someone you're matched with, and I'll share psychological insights about your compatibility.",
  CONVERSATION_COACH: "Share a conversation or message you're unsure about, and I'll give you honest, compassionate feedback.",
  DATE_PREP: "A date is coming up! Let's calm your nerves, set intentions, and help you show up as your authentic self.",
  REFLECTION: "How did it go? Let's process what happened and what you learned about yourself.",
  HEALING: "I'm here. Whether it's rejection, a difficult ending, or just feeling discouraged — let's work through it together.",
  GROWTH: "Let's look at patterns across your relationships and dating life. Understanding them is the first step to changing them.",
};

export default function AriaScreen() {
  const user = useAuthStore((s) => s.user);
  const { userId, refreshProfile } = useAuthStore();
  const [mode, setMode] = useState<AriaMode>('DISCOVERY');
  const [showModeModal, setShowModeModal] = useState(false);
  const [messages, setMessages] = useState<AriaMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: ARIA_INTRO.DISCOVERY,
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function switchMode(newMode: AriaMode) {
    setMode(newMode);
    setShowModeModal(false);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: ARIA_INTRO[newMode] ?? "I'm here to help. What's on your mind?",
        created_at: new Date().toISOString(),
      },
    ]);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: AriaMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const modeContext = `\n\nCURRENT SESSION MODE: ${mode}\nUser's name: ${user?.first_name ?? 'friend'}\n\nBegin in this mode and stay in it unless the user explicitly asks to switch.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 1024,
          system: ARIA_SYSTEM_PROMPT + modeContext,
          messages: [...messages, userMsg].slice(-20).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const rawText: string = data.content?.[0]?.text ?? '';

      if (!rawText) {
        throw new Error(data.error?.message ?? 'No response from Aria');
      }

      // Extract insight tags
      const insightRegex = /<ARIA_INSIGHT>(.*?)<\/ARIA_INSIGHT>/gs;
      const insights: Array<Record<string, unknown>> = [];
      let m: RegExpExecArray | null;
      while ((m = insightRegex.exec(rawText)) !== null) {
        try { insights.push(JSON.parse(m[1])); } catch { /* skip malformed */ }
      }
      const cleanText = rawText.replace(/<ARIA_INSIGHT>.*?<\/ARIA_INSIGHT>/gs, '').trim();

      const ariaMsg: AriaMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, ariaMsg]);

      if (insights.length && userId) {
        await fetch(`${API_BASE_URL}/.netlify/functions/aria-save-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, insights }),
        }).catch(() => {/* non-critical */});
        await refreshProfile().catch(() => {});
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having a moment. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const currentMode = ARIA_MODES[mode];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={[COLORS.night, COLORS.nightCard]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.ariaInfo}>
              <LinearGradient colors={[COLORS.rose, COLORS.roseDark]} style={styles.ariaAvatar}>
                <Text style={styles.ariaAvatarText}>A</Text>
              </LinearGradient>
              <View>
                <Text style={styles.ariaName}>Aria</Text>
                <Text style={styles.ariaTagline}>Your relationship guide</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modeButton} onPress={() => setShowModeModal(true)}>
              <Text style={styles.modeEmoji}>{currentMode.icon}</Text>
              <Text style={styles.modeLabel}>{currentMode.label}</Text>
              <Text style={styles.modeChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.role === 'assistant' ? styles.bubbleAria : styles.bubbleUser,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.ariaIndicator}>
                  <Text style={styles.ariaIndicatorText}>Aria</Text>
                </View>
              )}
              <Text style={[
                styles.bubbleText,
                msg.role === 'assistant' ? styles.textAria : styles.textUser,
              ]}>
                {msg.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubble, styles.bubbleAria]}>
              <ActivityIndicator color={COLORS.rose} size="small" />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts..."
              placeholderTextColor={COLORS.nightMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Mode selection modal */}
      <Modal
        visible={showModeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModeModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose a Mode</Text>
            <TouchableOpacity onPress={() => setShowModeModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalList}>
            {Object.entries(ARIA_MODES).map(([key, modeInfo]) => (
              <TouchableOpacity
                key={key}
                style={[styles.modeCard, mode === key && styles.modeCardSelected]}
                onPress={() => switchMode(key as AriaMode)}
              >
                <Text style={styles.modeCardEmoji}>{modeInfo.icon}</Text>
                <View style={styles.modeCardInfo}>
                  <Text style={[styles.modeCardLabel, mode === key && styles.modeCardLabelSelected]}>
                    {modeInfo.label}
                  </Text>
                  <Text style={styles.modeCardDesc}>{modeInfo.description}</Text>
                </View>
                {mode === key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.night },
  header: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.nightBorder,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.base },
  ariaInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ariaAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ariaAvatarText: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.lg, color: COLORS.white },
  ariaName: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.lg, color: COLORS.white },
  ariaTagline: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.nightMuted },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.nightCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.nightBorder,
  },
  modeEmoji: { fontSize: 14 },
  modeLabel: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)' },
  modeChevron: { color: COLORS.nightMuted, fontSize: 16 },
  chatContainer: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: SPACING['2xl'], gap: SPACING.md, paddingBottom: SPACING['3xl'] },
  bubble: {
    maxWidth: '82%',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  bubbleAria: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.nightCard,
    borderBottomLeftRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.nightBorder,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.rose,
    borderBottomRightRadius: RADIUS.xs,
  },
  ariaIndicator: {},
  ariaIndicatorText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.rose,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bubbleText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, lineHeight: 22 },
  textAria: { color: 'rgba(255,255,255,0.9)' },
  textUser: { color: COLORS.white },
  inputArea: {
    backgroundColor: COLORS.nightCard,
    padding: SPACING.base,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.nightBorder,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.night,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.nightBorder,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: COLORS.cream },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['2xl'], color: COLORS.textPrimary },
  modalClose: { fontSize: 20, color: COLORS.textSecondary },
  modalList: { padding: SPACING.base, gap: SPACING.sm, paddingBottom: SPACING['4xl'] },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modeCardSelected: { borderColor: COLORS.rose, backgroundColor: COLORS.roseFaint },
  modeCardEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  modeCardInfo: { flex: 1 },
  modeCardLabel: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  modeCardLabelSelected: { color: COLORS.roseDark },
  modeCardDesc: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  checkmark: { color: COLORS.rose, fontSize: 18, fontWeight: '700' },
});
