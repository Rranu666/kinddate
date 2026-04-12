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
import { Badge } from '../../src/components/ui/Badge';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW } from '../../src/lib/constants';
import type { Match } from '../../src/types';

function MatchRow({ match }: { match: Match }) {
  const profile = match.other_user;
  if (!profile) return null;

  const score = match.compatibility_score ?? 0;
  const scoreColor = score >= 85 ? 'sage' : score >= 70 ? 'gold' : 'rose';

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/chat/${match.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrapper}>
        <Avatar
          uri={profile.avatar_url}
          name={profile.display_name}
          size={58}
          verified={profile.is_verified}
        />
        {(match.unread_count ?? 0) > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{match.unread_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{profile.display_name}</Text>
          <Text style={styles.time}>
            {match.last_message
              ? formatDistanceToNow(new Date(match.last_message.created_at), { addSuffix: true })
              : formatDistanceToNow(new Date(match.matched_at ?? match.created_at), { addSuffix: true })}
          </Text>
        </View>

        <View style={styles.rowBottom}>
          <Text style={styles.preview} numberOfLines={1}>
            {match.last_message?.content ?? 'You matched! Say hello 👋'}
          </Text>
          <Badge label={`${score}%`} variant={scoreColor as 'sage' | 'gold' | 'rose'} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MatchesScreen() {
  const { data: matches, isLoading, refetch, isRefetching } = useMatches();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Your Matches</Text>
        <Text style={styles.subtitle}>
          {matches?.length ?? 0} connection{matches?.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.rose} size="large" />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MatchRow match={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.rose} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💞</Text>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyText}>
                Accept pending matches from the Discover tab to start conversations.
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
  subtitle: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
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
  avatarWrapper: { position: 'relative' },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.rose,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  unreadCount: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  time: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  preview: { flex: 1, fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  separator: { height: SPACING.sm },
  empty: { alignItems: 'center', paddingVertical: SPACING['5xl'], paddingHorizontal: SPACING['2xl'], gap: SPACING.base },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['2xl'], color: COLORS.textPrimary, textAlign: 'center' },
  emptyText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
});
