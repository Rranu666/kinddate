import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { updateProfile } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW } from '../src/lib/constants';

interface SettingRowProps {
  label: string;
  description?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  info?: string;
}

function SettingRow({ label, description, value, onToggle, onPress, destructive, info }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && onToggle === undefined}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      {onToggle !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ true: COLORS.rose, false: COLORS.border }}
          thumbColor={COLORS.white}
        />
      )}
      {info && <Text style={styles.rowInfo}>{info}</Text>}
      {onPress && !info && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const { user, userId, refreshProfile, signOut } = useAuthStore();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchNotifs, setMatchNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [ariaNotifs, setAriaNotifs] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [pauseDiscovery, setPauseDiscovery] = useState(false);

  async function togglePauseDiscovery(val: boolean) {
    setPauseDiscovery(val);
    if (userId) {
      await updateProfile(userId, { discovery_paused: val });
      await refreshProfile();
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => Alert.alert('Contact Support', 'Please email support@kinddate.com to complete account deletion.'),
        },
      ],
    );
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Account */}
      <SectionHeader title="Account" />
      <View style={styles.card}>
        <SettingRow label="Email" info={user?.email ?? '—'} />
        <View style={styles.divider} />
        <SettingRow
          label="Change Password"
          onPress={() => router.push('/(auth)/forgot-password')}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Subscription"
          info={(user?.plan ?? 'Free').charAt(0).toUpperCase() + (user?.plan ?? 'free').slice(1)}
          onPress={() => Alert.alert('Upgrade', 'Subscription management coming soon!')}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Verification"
          info={user?.is_verified ? '✓ Verified' : 'Unverified'}
          onPress={() => router.push('/verify')}
        />
      </View>

      {/* Discovery */}
      <SectionHeader title="Discovery" />
      <View style={styles.card}>
        <SettingRow
          label="Pause Discovery"
          description="Temporarily hide your profile from new matches"
          value={pauseDiscovery}
          onToggle={togglePauseDiscovery}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Show Online Status"
          value={showOnline}
          onToggle={setShowOnline}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Show Distance"
          value={showDistance}
          onToggle={setShowDistance}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Match Preferences"
          onPress={() => router.push('/(auth)/onboarding/preferences')}
        />
      </View>

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <View style={styles.card}>
        <SettingRow
          label="Push Notifications"
          value={pushEnabled}
          onToggle={setPushEnabled}
        />
        <View style={styles.divider} />
        <SettingRow
          label="New Matches"
          value={matchNotifs}
          onToggle={setMatchNotifs}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Messages"
          value={messageNotifs}
          onToggle={setMessageNotifs}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Aria Check-ins"
          value={ariaNotifs}
          onToggle={setAriaNotifs}
        />
      </View>

      {/* Privacy & Safety */}
      <SectionHeader title="Privacy & Safety" />
      <View style={styles.card}>
        <SettingRow
          label="Blocked Users"
          onPress={() => Alert.alert('Blocked Users', 'Blocked users list coming soon.')}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Report a Problem"
          onPress={() => Alert.alert('Report', 'Please email safety@kinddate.com for urgent safety concerns.')}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'Visit kinddate.com/privacy for our full policy.')}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Terms of Service"
          onPress={() => Alert.alert('Terms', 'Visit kinddate.com/terms for our full terms.')}
        />
      </View>

      {/* About */}
      <SectionHeader title="About" />
      <View style={styles.card}>
        <SettingRow label="Version" info="1.0.0" />
        <View style={styles.divider} />
        <SettingRow
          label="Send Feedback"
          onPress={() => Alert.alert('Feedback', 'Email us at hello@kinddate.com — we read every message!')}
        />
      </View>

      {/* Danger zone */}
      <SectionHeader title="Account Actions" />
      <View style={styles.card}>
        <SettingRow label="Sign Out" onPress={handleSignOut} destructive />
        <View style={styles.divider} />
        <SettingRow label="Delete Account" onPress={handleDeleteAccount} destructive />
      </View>

      <View style={{ height: SPACING['5xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.base,
    gap: SPACING.sm,
  },
  backBtn: {},
  backText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  title: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.textPrimary },
  sectionHeader: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  card: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  rowLabelDestructive: { color: COLORS.error },
  rowDesc: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  rowInfo: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  chevron: { color: COLORS.textMuted, fontSize: 20 },
  divider: { height: 1, backgroundColor: COLORS.borderFaint, marginLeft: SPACING.base },
});
