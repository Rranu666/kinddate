import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Button } from '../src/components/ui/Button';
import { COLORS, FONTS, FONT_SIZES, SPACING, APP_TAGLINE } from '../src/lib/constants';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(30);
  const taglineOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(40);

  useEffect(() => {
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 700 }));
    logoY.value = withDelay(200, withSpring(0, { damping: 20 }));
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    cardOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    cardY.value = withDelay(900, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[COLORS.roseDark, COLORS.rose, '#D4887F']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.55, 1]}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />

      {/* Logo */}
      <View style={styles.heroSection}>
        <Animated.Text style={[styles.logo, logoStyle]}>KindDate</Animated.Text>
        <Animated.Text style={[styles.tagline, taglineStyle]}>{APP_TAGLINE}</Animated.Text>

        <Animated.View style={[styles.pillRow, taglineStyle]}>
          {['AI Matching', 'Verified Profiles', 'Real Connection'].map((pill) => (
            <View key={pill} style={styles.pill}>
              <Text style={styles.pillText}>{pill}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom card */}
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.cardTitle}>Find love the intentional way</Text>
        <Text style={styles.cardSubtitle}>
          3 curated AI matches per week — no swiping, no noise, just meaningful connection.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Create Account"
            onPress={() => router.push('/(auth)/signup')}
            size="lg"
          />
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkText}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleTop: { width: width * 1.2, height: width * 1.2, top: -width * 0.5, left: -width * 0.1 },
  circleBottom: { width: width * 0.9, height: width * 0.9, bottom: -width * 0.1, right: -width * 0.2 },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.base,
  },
  logo: {
    fontFamily: FONTS.serif,
    fontSize: 56,
    color: COLORS.white,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: FONTS.serifItalic,
    fontSize: FONT_SIZES.lg,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pillText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
    gap: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontFamily: FONTS.serif,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: { gap: SPACING.sm, marginTop: SPACING.sm },
  loginLink: { alignItems: 'center', paddingVertical: SPACING.sm },
  loginText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  loginLinkText: {
    fontFamily: FONTS.sansSemiBold,
    color: COLORS.rose,
  },
  legal: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
