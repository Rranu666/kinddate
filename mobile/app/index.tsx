import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/lib/constants';

export default function IndexScreen() {
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    if (!user.onboarding_completed) {
      const step = user.onboarding_step ?? 1;
      if (step <= 1) router.replace('/(auth)/onboarding/phone');
      else if (step <= 2) router.replace('/(auth)/onboarding/discovery');
      else if (step <= 3) router.replace('/(auth)/onboarding/photos');
      else router.replace('/(auth)/onboarding/preferences');
      return;
    }

    router.replace('/(tabs)/discover');
  }, [user, initialized]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cream }}>
      <ActivityIndicator color={COLORS.rose} size="large" />
    </View>
  );
}
