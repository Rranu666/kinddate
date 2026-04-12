import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { updateProfile } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/store/authStore';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../../src/lib/constants';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const { userId, refreshProfile } = useAuthStore();

  const STEP = 1;
  const TOTAL = 4;

  async function handleSendCode() {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid phone', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    // In production: call Twilio via your API endpoint
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep('verify');
    Alert.alert('Code sent', `A 6-digit code was sent to ${phone}.`);
  }

  async function handleVerify() {
    if (!code || code.length !== 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    // In production: verify code via Twilio
    if (userId) {
      await updateProfile(userId, {
        phone: phone,
        is_phone_verified: true,
        onboarding_step: 2,
      });
      await refreshProfile();
    }
    setLoading(false);
    router.push('/(auth)/onboarding/discovery');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* Progress */}
      <View style={styles.progress}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[styles.dot, i < STEP ? styles.dotDone : i === STEP - 1 ? styles.dotActive : styles.dotInactive]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Verify your phone</Text>
        <Text style={styles.subtitle}>
          Your number is never shown publicly. It's only used for security and trust verification.
        </Text>

        {step === 'phone' ? (
          <View style={styles.form}>
            <Input
              label="Phone number"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
            <Button title="Send Code" onPress={handleSendCode} loading={loading} size="lg" />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Verification code"
              placeholder="6-digit code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
            />
            <Button title="Verify" onPress={handleVerify} loading={loading} size="lg" />
            <Button
              title="Resend code"
              variant="ghost"
              onPress={handleSendCode}
              loading={loading}
            />
          </View>
        )}

        <Button
          title="Skip for now"
          variant="ghost"
          onPress={() => router.push('/(auth)/onboarding/discovery')}
          style={styles.skip}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  progress: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.xl,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  dotDone: { backgroundColor: COLORS.rose },
  dotActive: { backgroundColor: COLORS.rose },
  dotInactive: { backgroundColor: COLORS.border },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.xl,
    gap: SPACING.base,
  },
  emoji: { fontSize: 48 },
  title: {
    fontFamily: FONTS.serif,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  form: { gap: SPACING.base, marginTop: SPACING.sm },
  skip: { marginTop: SPACING.sm },
});
