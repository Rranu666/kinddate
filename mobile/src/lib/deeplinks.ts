import * as Linking from 'expo-linking';
import { router } from 'expo-router';

/**
 * KindDate deep link scheme: kinddate://
 * Universal links (iOS): https://kinddate.com/app/...
 *
 * Supported routes:
 *   kinddate://match/:id        → /match/:id
 *   kinddate://chat/:id         → /chat/:id
 *   kinddate://profile          → /(tabs)/profile
 *   kinddate://discover         → /(tabs)/discover
 *   kinddate://reset-password   → /(auth)/forgot-password
 *   kinddate://verify           → /verify
 */

type DeepLinkRoute =
  | { type: 'match'; id: string }
  | { type: 'chat'; id: string }
  | { type: 'tab'; tab: string }
  | { type: 'reset-password' }
  | { type: 'verify' }
  | { type: 'unknown' };

export function parseDeepLink(url: string): DeepLinkRoute {
  const parsed = Linking.parse(url);

  if (!parsed.path) return { type: 'unknown' };

  const path = parsed.path.replace(/^\//, '');
  const segments = path.split('/');

  if (segments[0] === 'match' && segments[1]) {
    return { type: 'match', id: segments[1] };
  }
  if (segments[0] === 'chat' && segments[1]) {
    return { type: 'chat', id: segments[1] };
  }
  if (['profile', 'discover', 'matches', 'messages', 'aria'].includes(segments[0])) {
    return { type: 'tab', tab: segments[0] };
  }
  if (segments[0] === 'reset-password') {
    return { type: 'reset-password' };
  }
  if (segments[0] === 'verify') {
    return { type: 'verify' };
  }

  return { type: 'unknown' };
}

export function handleDeepLink(url: string, isAuthenticated: boolean) {
  const route = parseDeepLink(url);

  switch (route.type) {
    case 'match':
      if (isAuthenticated) router.push(`/match/${route.id}`);
      break;
    case 'chat':
      if (isAuthenticated) router.push(`/chat/${route.id}`);
      break;
    case 'tab':
      if (isAuthenticated) router.push(`/(tabs)/${route.tab}` as never);
      break;
    case 'reset-password':
      router.push('/(auth)/forgot-password');
      break;
    case 'verify':
      if (isAuthenticated) router.push('/verify');
      break;
    default:
      break;
  }
}

export function getInitialURL() {
  return Linking.getInitialURL();
}

export function addDeepLinkListener(
  callback: (url: string) => void,
) {
  return Linking.addEventListener('url', ({ url }) => callback(url));
}
