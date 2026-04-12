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
import { updateProfile } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/store/authStore';
import { Button } from '../../../src/components/ui/Button';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, INTERESTS } from '../../../src/lib/constants';
import type { GenderType, IntentType } from '../../../src/types';

const GENDERS: { value: GenderType; label: string }[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

const SEEKING: { value: string; label: string }[] = [
  { value: 'man', label: 'Men' },
  { value: 'woman', label: 'Women' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'everyone', label: 'Everyone' },
];

const INTENTS: { value: IntentType; label: string; icon: string; desc: string }[] = [
  { value: 'serious', label: 'Serious relationship', icon: '💍', desc: 'Looking for my life partner' },
  { value: 'casual', label: 'Dating casually', icon: '☕', desc: 'Taking it slow and seeing where it goes' },
  { value: 'friends', label: 'Friends first', icon: '🤝', desc: 'Building a real connection first' },
  { value: 'open', label: 'Open to anything', icon: '✨', desc: "Curious and open-minded" },
];

export default function PreferencesScreen() {
  const [gender, setGender] = useState<GenderType | null>(null);
  const [seeking, setSeeking] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentType | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState('');
  const { userId, refreshProfile } = useAuthStore();

  const STEP = 4;
  const TOTAL = 4;

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest].slice(0, 10),
    );
  }

  async function handleFinish() {
    if (!gender || !seeking || !intent) {
      Alert.alert('Almost there', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    if (userId) {
      await updateProfile(userId, {
        gender,
        seeking_gender: seeking === 'everyone' ? ['man', 'woman', 'non_binary', 'other'] : [seeking],
        intent,
        interests: selectedInterests,
        ...(age ? { age: parseInt(age, 10) } : {}),
        onboarding_completed: true,
        onboarding_step: 4,
      });
      await refreshProfile();
    }
    setLoading(false);
    router.replace('/(tabs)/discover');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />

      {/* Progress */}
      <View style={styles.progress}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[styles.dot, i < STEP ? styles.dotDone : styles.dotInactive]} />
        ))}
      </View>

      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>Your preferences</Text>
      <Text style={styles.subtitle}>Help us find your perfect match</Text>

      {/* Gender */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>I am a</Text>
        <View style={styles.chips}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.chip, gender === g.value && styles.chipSelected]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.chipText, gender === g.value && styles.chipTextSelected]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Seeking */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Looking for</Text>
        <View style={styles.chips}>
          {SEEKING.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.chip, seeking === s.value && styles.chipSelected]}
              onPress={() => setSeeking(s.value)}
            >
              <Text style={[styles.chipText, seeking === s.value && styles.chipTextSelected]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Intent */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What I'm looking for</Text>
        <View style={styles.intentGrid}>
          {INTENTS.map((i) => (
            <TouchableOpacity
              key={i.value}
              style={[styles.intentCard, intent === i.value && styles.intentCardSelected]}
              onPress={() => setIntent(i.value)}
            >
              <Text style={styles.intentIcon}>{i.icon}</Text>
              <Text style={[styles.intentLabel, intent === i.value && styles.intentLabelSelected]}>
                {i.label}
              </Text>
              <Text style={styles.intentDesc}>{i.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Interests <Text style={styles.optional}>(up to 10)</Text>
        </Text>
        <View style={styles.interestsGrid}>
          {INTERESTS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestChip,
                selectedInterests.includes(interest) && styles.interestChipSelected,
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={[
                styles.interestText,
                selectedInterests.includes(interest) && styles.interestTextSelected,
              ]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button
        title="Start discovering →"
        onPress={handleFinish}
        loading={loading}
        size="lg"
        style={styles.finishBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING['5xl'],
    gap: SPACING.xl,
  },
  progress: { flexDirection: 'row', gap: SPACING.sm },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  dotDone: { backgroundColor: COLORS.rose },
  dotInactive: { backgroundColor: COLORS.border },
  emoji: { fontSize: 48 },
  title: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.textPrimary },
  subtitle: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, marginTop: -SPACING.base },
  section: { gap: SPACING.md },
  sectionLabel: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  optional: { fontFamily: FONTS.sans, color: COLORS.textMuted, fontWeight: 'normal' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: { backgroundColor: COLORS.rose, borderColor: COLORS.rose },
  chipText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  chipTextSelected: { color: COLORS.white },
  intentGrid: { gap: SPACING.sm },
  intentCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  intentCardSelected: { borderColor: COLORS.rose, backgroundColor: COLORS.roseFaint },
  intentIcon: { fontSize: 24 },
  intentLabel: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  intentLabelSelected: { color: COLORS.roseDark },
  intentDesc: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  interestChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  interestChipSelected: { backgroundColor: COLORS.roseFaint, borderColor: COLORS.roseLight },
  interestText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  interestTextSelected: { color: COLORS.roseDark, fontFamily: FONTS.sansMedium },
  finishBtn: { marginTop: SPACING.md },
});
