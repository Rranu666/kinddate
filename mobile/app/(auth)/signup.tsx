import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { signUpWithEmail, updateProfile } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../src/lib/constants';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  function validate() {
    if (!firstName.trim()) { Alert.alert('Missing field', 'Please enter your first name.'); return false; }
    if (!email.trim()) { Alert.alert('Missing field', 'Please enter your email.'); return false; }
    if (!email.includes('@')) { Alert.alert('Invalid email', 'Please enter a valid email address.'); return false; }
    if (password.length < 8) { Alert.alert('Weak password', 'Password must be at least 8 characters.'); return false; }
    if (password !== confirmPassword) { Alert.alert('Password mismatch', "Passwords don't match."); return false; }
    return true;
  }

  async function handleSignup() {
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await signUpWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Signup failed', error.message);
      return;
    }

    if (data.user) {
      await updateProfile(data.user.id, {
        first_name: firstName.trim(),
        display_name: firstName.trim(),
        email: email.trim().toLowerCase(),
        onboarding_step: 1,
        onboarding_completed: false,
      });
      await refreshProfile();
      router.replace('/(auth)/onboarding/phone');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <LinearGradient
        colors={[COLORS.cream, COLORS.sageFaint]}
        style={StyleSheet.absoluteFillObject}
        locations={[0.5, 1]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join thousands finding meaningful connections
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.form}>
            <Input
              label="First name"
              placeholder="Your first name"
              value={firstName}
              onChangeText={setFirstName}
              textContentType="givenName"
              autoComplete="given-name"
              autoCapitalize="words"
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secure
              textContentType="newPassword"
              autoComplete="new-password"
            />

            <Input
              label="Confirm password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
              textContentType="newPassword"
            />
          </View>

          <Text style={styles.terms}>
            By creating an account, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="lg"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING['4xl'],
  },
  back: {
    marginBottom: SPACING.xl,
  },
  backText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING['2xl'],
    gap: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  form: {
    gap: SPACING.base,
  },
  terms: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.rose,
    fontFamily: FONTS.sansMedium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.rose,
  },
});
