import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '../../../src/lib/constants';
import { updateProfile } from '../../../src/lib/supabase';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const ARIA_SYSTEM = `You are Aria, an emotionally intelligent relationship guide for KindDate. You are helping a new user understand themselves through the DISCOVERY mode: explore who they are, what they truly want in love, and build a psychological portrait through warm, curious conversation. Ask ONE thoughtful question at a time. Reflect before advising. When you identify insights output them as: <ARIA_INSIGHT>{"type":"attachment_style","value":"Secure","confidence":0.7}</ARIA_INSIGHT>`;
import { useAuthStore } from '../../../src/store/authStore';
import { Button } from '../../../src/components/ui/Button';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../../src/lib/constants';
import type { AriaMessage } from '../../../src/types';

const ARIA_WELCOME = "Hi! I'm Aria, your personal relationship guide. I'm here to help you understand yourself and what you're truly looking for in love. There are no right or wrong answers — just honest exploration. Ready to begin?";

export default function DiscoveryScreen() {
  const [messages, setMessages] = useState<AriaMessage[]>([
    { id: '0', role: 'assistant', content: ARIA_WELCOME, created_at: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { userId, refreshProfile } = useAuthStore();

  const STEP = 2;
  const TOTAL = 4;
  const MIN_TURNS = 5;

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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 512,
          system: ARIA_SYSTEM,
          messages: [...messages, userMsg].slice(-20).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const raw = await response.json();
      const rawText: string = raw.content?.[0]?.text ?? '';
      const insightRegex = /<ARIA_INSIGHT>([\s\S]*?)<\/ARIA_INSIGHT>/g;
      const insights: Array<Record<string, unknown>> = [];
      let im: RegExpExecArray | null;
      while ((im = insightRegex.exec(rawText)) !== null) {
        try { insights.push(JSON.parse(im[1])); } catch { /* skip */ }
      }
      const cleanText = rawText.replace(/<ARIA_INSIGHT>[\s\S]*?<\/ARIA_INSIGHT>/g, '').trim();

      const ariaMsg: AriaMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText || "I'm here with you. Tell me more.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, ariaMsg]);
      setTurnCount((c) => c + 1);

      if (insights.length && userId) {
        fetch(`${API_BASE_URL}/.netlify/functions/aria-save-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, insights }),
        }).catch(() => {});
        refreshProfile().catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function handleFinish() {
    if (userId) {
      await updateProfile(userId, { onboarding_step: 3 });
    }
    router.push('/(auth)/onboarding/photos');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="light" />

      {/* Dark Aria header */}
      <View style={styles.ariaHeader}>
        <View style={styles.progress}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View key={i} style={[styles.dot, i < STEP ? styles.dotDone : i === STEP - 1 ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
        <View style={styles.ariaInfo}>
          <View style={styles.ariaAvatar}>
            <Text style={styles.ariaAvatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.ariaName}>Aria</Text>
            <Text style={styles.ariaRole}>Your relationship guide</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
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
            <Text
              style={[
                styles.bubbleText,
                msg.role === 'assistant' ? styles.textAria : styles.textUser,
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.bubbleAria, styles.typingBubble]}>
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
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>

        {turnCount >= MIN_TURNS && (
          <Button
            title="Continue to photos →"
            onPress={handleFinish}
            variant="primary"
            size="md"
            style={styles.continueBtn}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.night },
  ariaHeader: {
    backgroundColor: COLORS.nightCard,
    paddingTop: SPACING['4xl'],
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.nightBorder,
  },
  progress: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  dot: { flex: 1, height: 3, borderRadius: 2 },
  dotDone: { backgroundColor: COLORS.rose },
  dotActive: { backgroundColor: COLORS.rose },
  dotInactive: { backgroundColor: COLORS.nightBorder },
  ariaInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ariaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ariaAvatarText: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.md, color: COLORS.white },
  ariaName: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.white },
  ariaRole: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.nightMuted },
  messages: { flex: 1 },
  messagesContent: {
    padding: SPACING['2xl'],
    gap: SPACING.md,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
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
  bubbleText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  textAria: { color: 'rgba(255,255,255,0.9)' },
  textUser: { color: COLORS.white },
  typingBubble: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  inputArea: {
    backgroundColor: COLORS.nightCard,
    padding: SPACING.base,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.nightBorder,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.night,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    maxHeight: 120,
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
  continueBtn: { marginTop: SPACING.xs },
});
