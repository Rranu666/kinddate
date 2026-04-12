import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { usePendingMatches, useRespondToMatch } from '../../src/hooks/useMatches';
import { useAuthStore } from '../../src/store/authStore';
import { MatchCard } from '../../src/components/MatchCard';
import { Button } from '../../src/components/ui/Button';
import { COLORS, FONTS, FONT_SIZES, SPACING, MATCH_WEEKLY_LIMIT } from '../../src/lib/constants';
import type { Match } from '../../src/types';

export default function DiscoverScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: pendingMatches, isLoading, refetch, isRefetching } = usePendingMatches();
  const respondMutation = useRespondToMatch();
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleMatches = pendingMatches ?? [];
  const currentMatch: Match | undefined = visibleMatches[currentIndex];
  const nextMatch: Match | undefined = visibleMatches[currentIndex + 1];

  function handleAccept() {
    if (!currentMatch) return;
    respondMutation.mutate({ matchId: currentMatch.id, accept: true });
    setCurrentIndex((i) => i + 1);
  }

  function handleReject() {
    if (!currentMatch) return;
    respondMutation.mutate({ matchId: currentMatch.id, accept: false });
    setCurrentIndex((i) => i + 1);
  }

  function handlePress() {
    if (!currentMatch) return;
    router.push(`/match/${currentMatch.id}`);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.first_name ?? user?.display_name} 👋
          </Text>
          <Text style={styles.subtitle}>Your curated matches this week</Text>
        </View>
        <View style={styles.weeklyBadge}>
          <Text style={styles.weeklyText}>
            {visibleMatches.length}/{MATCH_WEEKLY_LIMIT}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.rose} size="large" />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      ) : visibleMatches.length === 0 || currentIndex >= visibleMatches.length ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.rose} />}
        >
          <Text style={styles.emptyEmoji}>🌹</Text>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyText}>
            New matches arrive each week — thoughtfully curated just for you.{'\n\n'}
            In the meantime, chat with your existing matches or talk to Aria for guidance.
          </Text>
          <Button
            title="Chat with Aria"
            onPress={() => router.push('/(tabs)/aria')}
            variant="outline"
            fullWidth={false}
            style={styles.emptyBtn}
          />
          <Button
            title="View Matches"
            onPress={() => router.push('/(tabs)/matches')}
            variant="ghost"
            fullWidth={false}
          />
        </ScrollView>
      ) : (
        <View style={styles.cardStack}>
          {/* Background card (next match) */}
          {nextMatch && (
            <View style={styles.backgroundCard}>
              <MatchCard
                match={nextMatch}
                onAccept={() => {}}
                onReject={() => {}}
                onPress={() => {}}
                isTop={false}
              />
            </View>
          )}

          {/* Foreground card (current match) */}
          <MatchCard
            match={currentMatch}
            onAccept={handleAccept}
            onReject={handleReject}
            onPress={handlePress}
            isTop
          />

          {/* Match count indicator */}
          <View style={styles.indexIndicator}>
            {visibleMatches.map((_, i) => (
              <View
                key={i}
                style={[styles.indexDot, i === currentIndex && styles.indexDotActive]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.base,
  },
  greeting: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['2xl'], color: COLORS.textPrimary },
  subtitle: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  weeklyBadge: {
    backgroundColor: COLORS.roseFaint,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.roseLight,
  },
  weeklyText: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.sm, color: COLORS.rose },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.base },
  loadingText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
    gap: SPACING.base,
    paddingVertical: SPACING['5xl'],
  },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.textPrimary, textAlign: 'center' },
  emptyText: {
    fontFamily: FONTS.sans, fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24,
  },
  emptyBtn: { marginTop: SPACING.md },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.base,
  },
  backgroundCard: {
    position: 'absolute',
    top: SPACING.xl,
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  indexIndicator: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  indexDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  indexDotActive: { backgroundColor: COLORS.rose, width: 16 },
});
