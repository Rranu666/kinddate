import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { formatDistanceToNow } from 'date-fns';
import { useMatches } from '../../src/hooks/useMatches';
import { Avatar } from '../../src/components/ui/Avatar';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW } from '../../src/lib/constants';
import type { Match } from '../../src/types';

function ConversationRow({ match }: { match: Match }) {
  const profile = match.other_user;
  if (!profile) return null;

  const hasUnread = (match.unread_count ?? 0) > 0;
  const lastMessage = match.last_message;

  return (
    <TouchableOpacity
      style={[styles.row, hasUnread && styles.rowUnread]}
      onPress={() => router.push(`/chat/${match.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrapper}>
        <Avatar uri={profile.avatar_url} name={profile.display_name} size={52} verified={profile.is_verified} />
        {/* online dot removed — real-time presence not yet implemented */}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameUnread]}>{profile.display_name}</Text>
          {lastMessage && (
            <Text style={styles.time}>
              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false })}
            </Text>
          )}
        </View>
        <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
          {lastMessage?.content ?? 'Start the conversation!'}
        </Text>
      </View>

      {hasUnread && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{match.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const { data: matches, isLoading, refetch, isRefetching } = useMatches();

  const withMessages = (matches ?? []).filter(
    (m) => m.last_message || m.matched_at,
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.rose} size="large" />
        </View>
      ) : (
        <FlatList
          data={withMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow match={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.rose} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                Match with someone to start a meaningful conversation.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.base,
  },
  title: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: SPACING.base, paddingBottom: SPACING['3xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOW.sm,
  },
  rowUnread: { backgroundColor: COLORS.roseFaint },
  avatarWrapper: { position: 'relative' },
  content: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  nameUnread: { fontFamily: FONTS.sansBold, color: COLORS.roseDark },
  time: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  preview: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  previewUnread: { fontFamily: FONTS.sansMedium, color: COLORS.textPrimary },
  unreadBadge: {
    backgroundColor: COLORS.rose,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xs, color: COLORS.white },
  separator: { height: SPACING.sm },
  empty: { alignItems: 'center', paddingVertical: SPACING['5xl'], paddingHorizontal: SPACING['2xl'], gap: SPACING.base },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['2xl'], color: COLORS.textPrimary, textAlign: 'center' },
  emptyText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
});
