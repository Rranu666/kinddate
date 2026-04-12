import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="phone" />
      <Stack.Screen name="discovery" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}
