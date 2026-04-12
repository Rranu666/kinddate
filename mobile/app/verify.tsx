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
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/ui/Button';
import { Badge } from '../src/components/ui/Badge';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW } from '../src/lib/constants';

interface VerifyStepProps {
  icon: string;
  title: string;
  description: string;
  status: 'verified' | 'pending' | 'unverified';
  onPress: () => void;
}

function VerifyStep({ icon, title, description, status, onPress }: VerifyStepProps) {
  const badgeVariant = status === 'verified' ? 'sage' : status === 'pending' ? 'gold' : 'muted';
  const badgeLabel = status === 'verified' ? '✓ Verified' : status === 'pending' ? 'Pending' : 'Not verified';
  const isDone = status === 'verified';

  return (
    <TouchableOpacity
      style={[styles.step, isDone && styles.stepDone]}
      onPress={isDone ? undefined : onPress}
      activeOpacity={isDone ? 1 : 0.75}
    >
      <Text style={styles.stepIcon}>{icon}</Text>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{description}</Text>
      </View>
      <Badge label={badgeLabel} variant={badgeVariant} />
    </TouchableOpacity>
  );
}

export default function VerifyScreen() {
  const { user } = useAuthStore();

  const trustScore = user?.trust_score ?? 0;
  const isVerified = user?.is_verified ?? false;

  function handleIDVerify() {
    Alert.alert(
      'Government ID Verification',
      'We use Persona to verify your identity. Your ID is encrypted and never stored on our servers. This takes about 2 minutes.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Start Verification', onPress: () => Alert.alert('Coming Soon', 'ID verification integration coming soon.') },
      ],
    );
  }

  function handleSelfieVerify() {
    Alert.alert(
      'Selfie Verification',
      'Take a quick selfie to confirm you match your profile photo. This builds trust with your matches.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Selfie', onPress: () => Alert.alert('Coming Soon', 'Selfie verification coming soon.') },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Get Verified</Text>
        <Text style={styles.subtitle}>
          Verified profiles get 4x more matches and build deeper trust with connections.
        </Text>
      </View>

      {/* Trust score */}
      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.scoreLabel}>Your Trust Score</Text>
          <Text style={styles.scoreHint}>Complete verifications to increase it</Text>
        </View>
        <View style={[styles.scoreBadge, { borderColor: trustScore >= 80 ? COLORS.sage : trustScore >= 60 ? COLORS.gold : COLORS.rose }]}>
          <Text style={[styles.scoreValue, { color: trustScore >= 80 ? COLORS.sage : trustScore >= 60 ? COLORS.gold : COLORS.rose }]}>
            {trustScore}
          </Text>
        </View>
      </View>

      {/* Steps */}
      <View style={styles.steps}>
        <VerifyStep
          icon="📧"
          title="Email"
          description="Confirm your email address"
          status={user?.email ? 'verified' : 'unverified'}
          onPress={() => Alert.alert('Email', 'Check your inbox for a confirmation email.')}
        />
        <VerifyStep
          icon="📱"
          title="Phone number"
          description="Verify via SMS one-time code"
          status={user?.verification_status === 'verified' ? 'verified' : 'unverified'}
          onPress={() => router.push('/(auth)/onboarding/phone')}
        />
        <VerifyStep
          icon="🪪"
          title="Government ID"
          description="Passport, driver's license, or national ID"
          status={isVerified ? 'verified' : 'unverified'}
          onPress={handleIDVerify}
        />
        <VerifyStep
          icon="🤳"
          title="Selfie check"
          description="Confirm you match your profile photo"
          status="unverified"
          onPress={handleSelfieVerify}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔒 Your data is safe</Text>
        <Text style={styles.infoText}>
          Verification data is encrypted end-to-end and processed by Persona, a trusted identity verification provider. We never store copies of your government ID.
        </Text>
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
  backText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  title: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.textPrimary },
  subtitle: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, lineHeight: 24 },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOW.sm,
  },
  scoreLabel: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  scoreHint: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xl },
  steps: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOW.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  stepDone: { borderColor: COLORS.sage, backgroundColor: COLORS.sageFaint },
  stepIcon: { fontSize: 28, width: 40, textAlign: 'center' },
  stepContent: { flex: 1 },
  stepTitle: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  stepDesc: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  infoBox: {
    margin: SPACING.base,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.sage + '40',
  },
  infoTitle: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.sageDark },
  infoText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.sageDark, lineHeight: 22 },
});
