import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useMessages, useSendMessage } from '../../src/hooks/useMessages';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { MessageBubble } from '../../src/components/MessageBubble';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../src/lib/constants';
import type { Match, Message } from '../../src/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: match } = useQuery<Match>({
    queryKey: ['match', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(id, display_name, avatar_url, is_verified),
          user2:profiles!matches_user2_id_fkey(id, display_name, avatar_url, is_verified)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return {
        ...data,
        other_user: data.user1_id === userId ? data.user2 : data.user1,
      } as Match;
    },
    enabled: !!id,
  });

  const { data: messagesData, isLoading, fetchNextPage, hasNextPage } = useMessages(id ?? '');
  const sendMutation = useSendMessage(id ?? '');

  const allMessages: Message[] = messagesData
    ? messagesData.pages.flatMap((page) => page).reverse()
    : [];

  const otherUser = match?.other_user;

  async function handleSend() {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput('');
    await sendMutation.mutateAsync(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMine = item.sender_id === userId;
    const prevMsg = allMessages[index - 1];
    const showTime = !prevMsg || new Date(item.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

    return (
      <MessageBubble
        key={item.id}
        message={item}
        isMine={isMine}
        showTime={showTime}
      />
    );
  }, [userId, allMessages]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => match && router.push(`/match/${match.id}`)}
        >
          <Avatar
            uri={otherUser?.avatar_url}
            name={otherUser?.display_name}
            size={40}
            verified={otherUser?.is_verified}
          />
          <View>
            <Text style={styles.headerName}>{otherUser?.display_name ?? '...'}</Text>
            <Text style={styles.headerSub}>
              {match?.compatibility_score ? `${match.compatibility_score}% match` : 'Connected'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerAction} onPress={() => match?.id && router.push(`/video-date/${match.id}`)}>
          <Text style={styles.headerActionIcon}>📹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction} onPress={() => router.push(`/match/${match?.id}`)}>
          <Text style={styles.headerActionIcon}>ℹ</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.rose} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.2}
            ListHeaderComponent={
              match?.matched_at ? (
                <View style={styles.matchedAt}>
                  <Text style={styles.matchedAtText}>
                    You matched on {new Date(match.matched_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  {match.compatibility_score && (
                    <Text style={styles.matchedAtScore}>{match.compatibility_score}% compatible</Text>
                  )}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyEmoji}>👋</Text>
                <Text style={styles.emptyText}>Say hello to {otherUser?.display_name}!</Text>
                <Text style={styles.emptySubText}>You're a great match. Break the ice!</Text>
              </View>
            }
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          />
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.textInput}
            placeholder={`Message ${otherUser?.display_name ?? ''}...`}
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: SPACING.xs },
  backIcon: { fontSize: 22, color: COLORS.textPrimary },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  headerName: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  headerSub: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.rose },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: { fontSize: 16, color: COLORS.textSecondary },
  chatArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    gap: SPACING.xs,
  },
  matchedAt: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  matchedAtText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  matchedAtScore: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: COLORS.rose },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['5xl'],
    gap: SPACING.sm,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  emptySubText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
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
});
