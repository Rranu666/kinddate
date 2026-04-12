import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { updateProfile, uploadAvatar } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/store/authStore';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOW } from '../../../src/lib/constants';

export default function PhotosScreen() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId, refreshProfile } = useAuthStore();

  const STEP = 3;
  const TOTAL = 4;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleContinue() {
    setLoading(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri && userId) {
        avatarUrl = await uploadAvatar(userId, avatarUri);
      }

      if (userId) {
        await updateProfile(userId, {
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          ...(bio.trim() ? { bio: bio.trim() } : {}),
          onboarding_step: 4,
        });
        await refreshProfile();
      }

      router.push('/(auth)/onboarding/preferences');
    } catch (err) {
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    }
    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />

      {/* Progress */}
      <View style={styles.progress}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[styles.dot, i < STEP ? styles.dotDone : i === STEP - 1 ? styles.dotActive : styles.dotInactive]} />
        ))}
      </View>

      <Text style={styles.emoji}>📸</Text>
      <Text style={styles.title}>Add your best photo</Text>
      <Text style={styles.subtitle}>
        Profiles with photos get 3x more matches. Make a genuine first impression.
      </Text>

      {/* Photo picker */}
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoBox} onPress={pickPhoto} activeOpacity={0.8}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>+</Text>
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoActionBtn} onPress={pickPhoto}>
            <Text style={styles.photoActionText}>📁 From library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto}>
            <Text style={styles.photoActionText}>📷 Take photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Input
          label="A bit about you (optional)"
          placeholder="What makes you uniquely you? Share something genuine..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          maxLength={300}
          style={{ height: 100, textAlignVertical: 'top' }}
        />
        <Text style={styles.charCount}>{bio.length}/300</Text>
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        loading={loading}
        size="lg"
      />

      <Button
        title="Skip for now"
        variant="ghost"
        onPress={() => router.push('/(auth)/onboarding/preferences')}
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
    paddingBottom: SPACING['4xl'],
    gap: SPACING.base,
  },
  progress: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  dotDone: { backgroundColor: COLORS.rose },
  dotActive: { backgroundColor: COLORS.rose },
  dotInactive: { backgroundColor: COLORS.border },
  emoji: { fontSize: 48 },
  title: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.textPrimary },
  subtitle: {
    fontFamily: FONTS.sans, fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary, lineHeight: 24,
  },
  photoSection: { alignItems: 'center', gap: SPACING.base },
  photoBox: {
    width: 180,
    height: 240,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    backgroundColor: COLORS.creamDark,
    ...SHADOW.md,
  },
  photo: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.rose,
    borderStyle: 'dashed',
    borderRadius: RADIUS['2xl'],
    margin: 1,
  },
  placeholderIcon: { fontSize: 40, color: COLORS.rose },
  placeholderText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: COLORS.rose },
  photoActions: { flexDirection: 'row', gap: SPACING.md },
  photoActionBtn: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoActionText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  bioSection: { gap: SPACING.xs },
  charCount: {
    fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted, textAlign: 'right',
  },
});
