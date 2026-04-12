import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '../../lib/constants';

type BadgeVariant = 'rose' | 'sage' | 'gold' | 'muted' | 'success' | 'error';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'rose', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  text: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.3,
  },

  rose: { backgroundColor: COLORS.roseFaint },
  sage: { backgroundColor: COLORS.sageFaint },
  gold: { backgroundColor: COLORS.goldFaint },
  muted: { backgroundColor: COLORS.creamDark },
  success: { backgroundColor: '#DCFCE7' },
  error: { backgroundColor: '#FEE2E2' },

  text_rose: { color: COLORS.roseDark },
  text_sage: { color: COLORS.sageDark },
  text_gold: { color: '#9B7A3A' },
  text_muted: { color: COLORS.textSecondary },
  text_success: { color: '#15803D' },
  text_error: { color: '#DC2626' },
});
