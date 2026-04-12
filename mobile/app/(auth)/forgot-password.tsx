import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { resetPassword } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../src/lib/constants';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <LinearGradient
        colors={[COLORS.cream, COLORS.goldFaint]}
        style={StyleSheet.absoluteFillObject}
        locations={[0.5, 1]}
      />

      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>{sent ? '📬' : '🔑'}</Text>
        <Text style={styles.title}>{sent ? 'Check your inbox' : 'Reset password'}</Text>
        <Text style={styles.subtitle}>
          {sent
            ? `We sent a reset link to ${email}. Check your email and follow the instructions.`
            : "Enter your email and we'll send you a link to reset your password."}
        </Text>

        {!sent && (
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <Button title="Send Reset Link" onPress={handleReset} loading={loading} size="lg" />
          </View>
        )}

        {sent && (
          <Button
            title="Back to sign in"
            onPress={() => router.replace('/(auth)/login')}
            size="lg"
            style={styles.backBtn}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  back: { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['4xl'], paddingBottom: SPACING.base },
  backText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.base,
  },
  emoji: { fontSize: 52 },
  title: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.textPrimary },
  subtitle: {
    fontFamily: FONTS.sans, fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary, lineHeight: 24,
  },
  form: { gap: SPACING.base, marginTop: SPACING.sm },
  backBtn: { marginTop: SPACING.md },
});
