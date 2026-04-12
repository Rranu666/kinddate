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
import { signInWithEmail } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../src/lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }

    await refreshProfile();
    router.replace('/(tabs)/discover');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <LinearGradient
        colors={[COLORS.cream, COLORS.roseFaint]}
        style={StyleSheet.absoluteFillObject}
        locations={[0.6, 1]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>KindDate</Text>
          <Text style={styles.tagline}>Love, guided with intention.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>

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

            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secure
              textContentType="password"
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password' as never)}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continue with Apple"
            variant="secondary"
            onPress={() => Alert.alert('Coming soon', 'Apple sign-in is coming soon.')}
            size="lg"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.footerLink}>Create one</Text>
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
    paddingTop: SPACING['5xl'],
    paddingBottom: SPACING['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logo: {
    fontFamily: FONTS.serif,
    fontSize: FONT_SIZES['5xl'],
    color: COLORS.rose,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: FONTS.serifItalic,
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
  title: {
    fontFamily: FONTS.serif,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: -SPACING.sm,
  },
  form: {
    gap: SPACING.base,
    marginTop: SPACING.sm,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
  },
  forgotText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.rose,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
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
