import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW, ATTACHMENT_STYLES } from '../../src/lib/constants';

interface SectionRowProps {
  label: string;
  value: string;
  onPress?: () => void;
}

function SectionRow({ label, value, onPress }: SectionRowProps) {
  return (
    <TouchableOpacity style={styles.sectionRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.sectionRowLabel}>{label}</Text>
      <View style={styles.sectionRowRight}>
        <Text style={styles.sectionRowValue} numberOfLines={1}>{value}</Text>
        {onPress && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const attachmentStyle = user?.attachment_style
    ? ATTACHMENT_STYLES[user.attachment_style]
    : null;

  const trustScore = user?.trust_score ?? 0;
  const trustColor = trustScore >= 80 ? COLORS.sage : trustScore >= 60 ? COLORS.gold : COLORS.rose;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />

      {/* Hero */}
      <LinearGradient
        colors={[COLORS.roseDark, COLORS.rose, COLORS.roseLight]}
        style={styles.hero}
        locations={[0, 0.5, 1]}
      >
        <View style={styles.heroContent}>
          <Avatar
            uri={user?.avatar_url}
            name={user?.display_name}
            size={90}
            verified={user?.is_verified}
            style={styles.avatar}
          />
          <Text style={styles.heroName}>{user?.display_name}</Text>
          {user?.occupation && (
            <Text style={styles.heroOccupation}>{user.occupation}</Text>
          )}
          {user?.location_city && (
            <Text style={styles.heroLocation}>📍 {user.location_city}</Text>
          )}

          <View style={styles.heroBadges}>
            {user?.plan && user.plan !== 'free' && (
              <Badge label={user.plan.toUpperCase()} variant="gold" />
            )}
            {user?.is_verified && <Badge label="Verified" variant="sage" />}
          </View>
        </View>
      </LinearGradient>

      {/* Trust score */}
      <View style={styles.trustCard}>
        <View style={styles.trustLeft}>
          <Text style={styles.trustLabel}>Trust Score</Text>
          <Text style={styles.trustSub}>Based on verification & behavior</Text>
        </View>
        <View style={[styles.trustBadge, { borderColor: trustColor }]}>
          <Text style={[styles.trustScore, { color: trustColor }]}>{trustScore}</Text>
        </View>
      </View>

      {/* AI Insights */}
      {user?.ai_profile_data && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aria's Insights</Text>
          <View style={styles.card}>
            {attachmentStyle && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Attachment Style</Text>
                <Badge label={attachmentStyle.label} variant="rose" />
              </View>
            )}
            {user.ai_profile_data.love_languages && user.ai_profile_data.love_languages.length > 0 && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Love Languages</Text>
                <Text style={styles.insightValue}>{user.ai_profile_data.love_languages.join(', ')}</Text>
              </View>
            )}
            {user.readiness_score !== undefined && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Readiness Score</Text>
                <Text style={[styles.insightValue, { color: COLORS.sage }]}>{user.readiness_score}/10</Text>
              </View>
            )}
            {user.ai_profile_data.communication_style && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Communication</Text>
                <Text style={styles.insightValue}>{user.ai_profile_data.communication_style}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Profile details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/profile/edit')}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <SectionRow
            label="Age"
            value={user?.age ? `${user.age} years old` : 'Not set'}
            onPress={() => router.push('/profile/edit')}
          />
          <View style={styles.divider} />
          <SectionRow
            label="Gender"
            value={user?.gender ? user.gender.replace('_', ' ') : 'Not set'}
            onPress={() => router.push('/profile/edit')}
          />
          <View style={styles.divider} />
          <SectionRow
            label="Intent"
            value={user?.intent ?? 'Not set'}
            onPress={() => router.push('/profile/edit')}
          />
          <View style={styles.divider} />
          <SectionRow
            label="Location"
            value={user?.location_city ? `${user.location_city}${user.location_state ? `, ${user.location_state}` : ''}` : 'Not set'}
            onPress={() => router.push('/profile/edit')}
          />
        </View>
      </View>

      {/* Interests */}
      {user?.interests && user.interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestGrid}>
            {user.interests.map((interest) => (
              <Badge key={interest} label={interest} variant="muted" />
            ))}
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <SectionRow
            label="Subscription"
            value={(user?.plan ?? 'free').charAt(0).toUpperCase() + (user?.plan ?? 'free').slice(1)}
            onPress={() => Alert.alert('Subscription', 'Upgrade plans coming soon!')}
          />
          <View style={styles.divider} />
          <SectionRow
            label="Notifications"
            value="Manage"
            onPress={() => Alert.alert('Notifications', 'Notification settings coming soon.')}
          />
          <View style={styles.divider} />
          <SectionRow
            label="Privacy"
            value="Manage"
            onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon.')}
          />
          <View style={styles.divider} />
          <SectionRow
            label="Safety"
            value="Block & Report"
            onPress={() => Alert.alert('Safety', 'Safety tools coming soon.')}
          />
        </View>
      </View>

      {/* Sign out */}
      <View style={[styles.section, { paddingBottom: SPACING['4xl'] }]}>
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  hero: {
    paddingTop: SPACING['5xl'],
    paddingBottom: SPACING['3xl'],
  },
  heroContent: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING['2xl'],
  },
  avatar: { marginBottom: SPACING.sm },
  heroName: {
    fontFamily: FONTS.serif,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.white,
  },
  heroOccupation: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: 'rgba(255,255,255,0.85)',
  },
  heroLocation: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  heroBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginTop: -SPACING.xl,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base,
    ...SHADOW.md,
    zIndex: 10,
  },
  trustLeft: { gap: 2 },
  trustLabel: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  trustSub: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  trustBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustScore: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xl },
  section: { paddingHorizontal: SPACING.base, paddingTop: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  editLink: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: COLORS.rose },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  sectionRowLabel: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  sectionRowRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, maxWidth: '55%' },
  sectionRowValue: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: COLORS.textPrimary, textAlign: 'right' },
  chevron: { color: COLORS.textMuted, fontSize: 20 },
  divider: { height: 1, backgroundColor: COLORS.borderFaint, marginLeft: SPACING.base },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  insightLabel: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  insightValue: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});
