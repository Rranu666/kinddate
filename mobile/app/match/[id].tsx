import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useRespondToMatch } from '../../src/hooks/useMatches';
import { useAuthStore } from '../../src/store/authStore';
import { CompatibilityBar } from '../../src/components/CompatibilityBar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import {
  COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW, ATTACHMENT_STYLES,
} from '../../src/lib/constants';
import type { Match } from '../../src/types';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const respondMutation = useRespondToMatch();

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ['match', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
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

  async function handleAccept() {
    if (!match) return;
    await respondMutation.mutateAsync({ matchId: match.id, accept: true });
    router.replace(`/chat/${match.id}`);
  }

  async function handleReject() {
    if (!match) return;
    Alert.alert('Pass on this match?', 'You won\'t see this person again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pass',
        style: 'destructive',
        onPress: async () => {
          await respondMutation.mutateAsync({ matchId: match.id, accept: false });
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.rose} size="large" />
      </View>
    );
  }

  if (!match?.other_user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Match not found</Text>
      </View>
    );
  }

  const profile = match.other_user;
  const breakdown = match.score_breakdown;
  const score = match.compatibility_score ?? 0;
  const scoreColor = score >= 85 ? COLORS.sage : score >= 70 ? COLORS.gold : COLORS.rose;
  const attachmentStyle = profile.attachment_style ? ATTACHMENT_STYLES[profile.attachment_style] : null;
  const isPending = match.status === 'pending';
  const isAccepted = match.status === 'accepted';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Sticky photo header */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: profile.avatar_url ?? undefined }}
            style={styles.photo}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFillObject}
            locations={[0, 0.2, 0.7, 1]}
          />

          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Score */}
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreValue}>{score}%</Text>
            <Text style={styles.scoreLabel}>match</Text>
          </View>

          {/* Name overlay */}
          <View style={styles.nameOverlay}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.display_name}</Text>
              {profile.age && <Text style={styles.age}>{profile.age}</Text>}
              {profile.is_verified && <Text style={styles.verifiedIcon}>✓</Text>}
            </View>
            {profile.occupation && <Text style={styles.occupation}>{profile.occupation}</Text>}
            {profile.location_city && <Text style={styles.location}>📍 {profile.location_city}</Text>}
          </View>
        </View>

        <View style={styles.content}>
          {/* AI Explanation */}
          {match.ai_explanation && (
            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiIcon}>🔮</Text>
                <Text style={styles.aiTitle}>Why You Match</Text>
              </View>
              <Text style={styles.aiText}>{match.ai_explanation}</Text>
            </View>
          )}

          {/* Compatibility Breakdown */}
          {breakdown && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compatibility Breakdown</Text>
              <View style={styles.card}>
                <CompatibilityBar label="Personality" value={breakdown.personality} color={COLORS.rose} />
                <CompatibilityBar label="Relationship Intent" value={breakdown.intent} color={COLORS.sage} />
                <CompatibilityBar label="Communication" value={breakdown.communication} color={COLORS.gold} />
                <CompatibilityBar label="Shared Values" value={breakdown.values} color={COLORS.rose} />
                <CompatibilityBar label="Lifestyle" value={breakdown.behavioral} color={COLORS.sage} />
                <CompatibilityBar label="Attraction" value={breakdown.attraction} color={COLORS.gold} />
              </View>
            </View>
          )}

          {/* About */}
          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <View style={styles.card}>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailGrid}>
              {profile.education && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🎓</Text>
                  <Text style={styles.detailText}>{profile.education}</Text>
                </View>
              )}
              {profile.height_inches && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📏</Text>
                  <Text style={styles.detailText}>
                    {Math.floor(profile.height_inches / 12)}'{profile.height_inches % 12}"
                  </Text>
                </View>
              )}
              {attachmentStyle && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💙</Text>
                  <Text style={styles.detailText}>{attachmentStyle.label}</Text>
                </View>
              )}
              {profile.intent && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🎯</Text>
                  <Text style={styles.detailText}>{profile.intent}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestGrid}>
                {profile.interests.map((interest) => (
                  <Badge key={interest} label={interest} variant="rose" />
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          {isPending && (
            <View style={styles.actionSection}>
              <Button title="Connect →" onPress={handleAccept} loading={respondMutation.isPending} size="lg" />
              <Button title="Pass" variant="ghost" onPress={handleReject} />
            </View>
          )}

          {isAccepted && (
            <View style={styles.actionSection}>
              <Button
                title="Send a message"
                onPress={() => router.push(`/chat/${match.id}`)}
                size="lg"
              />
              <Button
                title="Start video date 📹"
                variant="outline"
                onPress={() => router.push(`/video-date/${match.id}`)}
              />
              <Button
                title="Report profile"
                variant="ghost"
                onPress={() =>
                  router.push({
                    pathname: '/report',
                    params: { userId: profile.id, name: profile.display_name },
                  })
                }
                textStyle={{ color: COLORS.textMuted }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: FONTS.sans, color: COLORS.textSecondary },
  photoContainer: {
    height: 420,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    top: SPACING['4xl'],
    left: SPACING.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: COLORS.white, fontSize: 20 },
  scoreBadge: {
    position: 'absolute',
    top: SPACING['4xl'],
    right: SPACING.base,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  scoreValue: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xl, color: COLORS.white },
  scoreLabel: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.8)' },
  nameOverlay: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.base,
    right: SPACING.base,
    gap: SPACING.xs,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  name: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.white },
  age: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xl, color: 'rgba(255,255,255,0.85)' },
  verifiedIcon: { color: COLORS.sage, fontSize: 18 },
  occupation: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: 'rgba(255,255,255,0.8)' },
  location: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.7)' },
  content: { padding: SPACING.base, gap: SPACING.base, paddingBottom: SPACING['5xl'] },
  aiSection: {
    backgroundColor: COLORS.night,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aiIcon: { fontSize: 22 },
  aiTitle: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.white },
  aiText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: 'rgba(255,255,255,0.8)', lineHeight: 24 },
  section: { gap: SPACING.md },
  sectionTitle: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    gap: SPACING.base,
    ...SHADOW.sm,
  },
  bio: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textPrimary, lineHeight: 24 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailIcon: { fontSize: 16 },
  detailText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionSection: {
    gap: SPACING.sm,
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
