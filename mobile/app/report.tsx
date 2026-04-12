import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/ui/Button';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW } from '../src/lib/constants';

const REASONS = [
  { id: 'fake', label: 'Fake profile or impersonation', icon: '🎭' },
  { id: 'inappropriate', label: 'Inappropriate photos or content', icon: '🚫' },
  { id: 'harassment', label: 'Harassment or abusive behavior', icon: '⚠️' },
  { id: 'spam', label: 'Spam or scam', icon: '📧' },
  { id: 'underage', label: 'Appears to be underage', icon: '🔞' },
  { id: 'dangerous', label: 'Dangerous or threatening behavior', icon: '🆘' },
  { id: 'other', label: 'Other', icon: '•••' },
];

export default function ReportScreen() {
  const { userId: reportedId, name } = useLocalSearchParams<{ userId: string; name: string }>();
  const { userId: reporterId } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selected) {
      Alert.alert('Select a reason', 'Please choose why you are reporting this user.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      reason: selected,
      details: details.trim() || null,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'Could not submit report. Please try again.');
      return;
    }
    Alert.alert(
      'Report submitted',
      'Thank you for helping keep KindDate safe. We review all reports within 24 hours.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report {name ?? 'User'}</Text>
      </View>

      <Text style={styles.subtitle}>
        Your report is confidential. We take all reports seriously and investigate every one.
      </Text>

      <View style={styles.reasons}>
        {REASONS.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.reasonRow, selected === r.id && styles.reasonRowSelected]}
            onPress={() => setSelected(r.id)}
          >
            <Text style={styles.reasonIcon}>{r.icon}</Text>
            <Text style={[styles.reasonLabel, selected === r.id && styles.reasonLabelSelected]}>
              {r.label}
            </Text>
            {selected === r.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsLabel}>Additional details (optional)</Text>
        <TextInput
          style={styles.detailsInput}
          placeholder="Describe what happened..."
          placeholderTextColor={COLORS.textMuted}
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          variant="danger"
        />
        <Text style={styles.blockNote}>
          You can also block this user from their profile to prevent further contact.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: {
    paddingBottom: SPACING['5xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.base,
  },
  cancelText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, flex: 1 },
  title: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, flex: 3, textAlign: 'right' },
  subtitle: {
    fontFamily: FONTS.sans, fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary, lineHeight: 24,
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING.base,
  },
  reasons: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  reasonRowSelected: { borderColor: COLORS.error, backgroundColor: '#FEF2F2' },
  reasonIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  reasonLabel: { flex: 1, fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  reasonLabelSelected: { color: COLORS.error, fontFamily: FONTS.sansMedium },
  checkmark: { color: COLORS.error, fontSize: 18, fontWeight: '700' },
  detailsSection: { padding: SPACING.base, gap: SPACING.sm, marginTop: SPACING.sm },
  detailsLabel: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginLeft: SPACING.xs },
  detailsInput: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.base,
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    height: 110,
  },
  actions: { paddingHorizontal: SPACING.base, marginTop: SPACING.sm, gap: SPACING.sm },
  blockNote: {
    fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted, textAlign: 'center', lineHeight: 20,
  },
});
