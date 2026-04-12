import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { updateProfile, uploadAvatar } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW, INTERESTS } from '../../src/lib/constants';

export default function EditProfileScreen() {
  const { user, userId, refreshProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [occupation, setOccupation] = useState(user?.occupation ?? '');
  const [education, setEducation] = useState(user?.education ?? '');
  const [city, setCity] = useState(user?.location_city ?? '');
  const [state, setState] = useState(user?.location_state ?? '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests ?? []);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest].slice(0, 10),
    );
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter a display name.');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri && userId) {
        avatarUrl = await uploadAvatar(userId, avatarUri);
      }

      if (userId) {
        await updateProfile(userId, {
          display_name: displayName.trim(),
          bio: bio.trim(),
          occupation: occupation.trim(),
          education: education.trim(),
          location_city: city.trim(),
          location_state: state.trim(),
          interests: selectedInterests,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        });
        await refreshProfile();
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
    setSaving(false);
  }

  const currentAvatar = avatarUri ?? user?.avatar_url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.rose} size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Photo */}
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoTouchable} onPress={pickPhoto}>
          {currentAvatar ? (
            <Image source={{ uri: currentAvatar }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>+</Text>
            </View>
          )}
          <View style={styles.photoEdit}>
            <Text style={styles.photoEditText}>Edit</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Fields */}
      <View style={styles.fields}>
        <Input
          label="Display name *"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          autoCapitalize="words"
        />

        <Input
          label="About you"
          value={bio}
          onChangeText={setBio}
          placeholder="A genuine description of who you are..."
          multiline
          numberOfLines={4}
          maxLength={300}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        <Input
          label="Occupation"
          value={occupation}
          onChangeText={setOccupation}
          placeholder="Your job title or field"
          autoCapitalize="words"
        />

        <Input
          label="Education"
          value={education}
          onChangeText={setEducation}
          placeholder="School or degree"
          autoCapitalize="words"
        />

        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <Input
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="City"
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 0.5 }}>
            <Input
              label="State"
              value={state}
              onChangeText={setState}
              placeholder="CA"
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>
        </View>
      </View>

      {/* Interests */}
      <View style={styles.interestsSection}>
        <Text style={styles.interestsTitle}>
          Interests <Text style={styles.interestsCount}>({selectedInterests.length}/10)</Text>
        </Text>
        <View style={styles.interestGrid}>
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
        title="Save Changes"
        onPress={handleSave}
        loading={saving}
        size="lg"
        style={styles.saveBtn}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelText: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
  title: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  saveText: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.rose },
  photoSection: { alignItems: 'center', paddingVertical: SPACING.xl },
  photoTouchable: { position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.roseFaint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.rose,
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: { fontSize: 32, color: COLORS.rose },
  photoEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.rose,
    borderRadius: 14,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  photoEditText: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.xs, color: COLORS.white },
  fields: { paddingHorizontal: SPACING.base, gap: SPACING.base },
  locationRow: { flexDirection: 'row', gap: SPACING.sm },
  interestsSection: { paddingHorizontal: SPACING.base, paddingTop: SPACING.xl, gap: SPACING.md },
  interestsTitle: { fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  interestsCount: { fontFamily: FONTS.sans, color: COLORS.textMuted, fontWeight: 'normal' },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
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
  saveBtn: { marginHorizontal: SPACING.base, marginTop: SPACING.xl },
});
