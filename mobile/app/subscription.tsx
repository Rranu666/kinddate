import React, { useState } from 'react';
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
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/ui/Button';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW, PLAN_FEATURES } from '../src/lib/constants';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: COLORS.textSecondary,
    features: PLAN_FEATURES.free,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$9.99',
    period: 'per month',
    color: COLORS.rose,
    features: PLAN_FEATURES.plus,
    badge: 'Most Popular',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: 'per month',
    color: COLORS.gold,
    features: PLAN_FEATURES.premium,
    badge: 'Best Value',
  },
];

export default function SubscriptionScreen() {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string>(user?.plan ?? 'free');

  function handleSubscribe() {
    if (selected === 'free') {
      router.back();
      return;
    }
    Alert.alert(
      `Upgrade to ${selected.charAt(0).toUpperCase() + selected.slice(1)}`,
      `You'll be charged ${PLANS.find((p) => p.id === selected)?.price}/month. Stripe checkout coming soon.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Coming Soon', 'In-app purchase integration is in progress.') },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[COLORS.roseDark, COLORS.rose]}
        style={styles.hero}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Unlock KindDate</Text>
        <Text style={styles.heroSubtitle}>
          More matches, deeper insights, and your own AI relationship concierge.
        </Text>
      </LinearGradient>

      <View style={styles.plans}>
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          const isCurrent = user?.plan === plan.id;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected,
                plan.id === 'plus' && styles.planCardFeatured,
              ]}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.8}
            >
              {plan.badge && (
                <View style={[styles.planBadge, { backgroundColor: plan.id === 'plus' ? COLORS.rose : COLORS.gold }]}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  {isCurrent && <Text style={styles.currentLabel}>Current plan</Text>}
                </View>
                <View style={styles.planPricing}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>/{plan.period}</Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {isSelected && (
                <View style={[styles.selectedDot, { backgroundColor: plan.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          title={selected === 'free' ? 'Continue with Free' : `Upgrade to ${selected.charAt(0).toUpperCase() + selected.slice(1)}`}
          onPress={handleSubscribe}
          size="lg"
        />
        <Text style={styles.cancelNote}>
          Cancel anytime. No hidden fees. Billed monthly.
        </Text>
      </View>

      <View style={{ height: SPACING['5xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  hero: {
    paddingTop: SPACING['5xl'],
    paddingBottom: SPACING['3xl'],
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.sm,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  closeText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  heroTitle: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['4xl'], color: COLORS.white },
  heroSubtitle: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: 'rgba(255,255,255,0.85)', lineHeight: 24 },
  plans: { padding: SPACING.base, gap: SPACING.md, marginTop: SPACING.base },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOW.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: { borderColor: COLORS.rose },
  planCardFeatured: { borderColor: COLORS.roseLight },
  planBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS['2xl'],
  },
  planBadgeText: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xs, color: COLORS.white },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planName: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xl },
  currentLabel: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  planPricing: { alignItems: 'flex-end' },
  planPrice: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES['2xl'] },
  planPeriod: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  planFeatures: { gap: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featureCheck: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.sm, width: 16 },
  featureText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  selectedDot: {
    position: 'absolute',
    top: SPACING.base,
    left: SPACING.base,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelNote: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
