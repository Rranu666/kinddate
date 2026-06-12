import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'kinddate://reset-password',
  });
}

// ─── Profile helpers ──────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  return supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
}

export async function uploadAvatar(userId: string, uri: string) {
  // Strip query params before parsing extension (Android URIs may have ?t=... appended)
  const cleanUri = uri.split('?')[0];
  const ext = cleanUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
  const storedExt = mimeType === 'image/png' ? 'png' : 'jpg';
  const storagePath = `${userId}/avatar.${storedExt}`;

  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Failed to read image: ${response.status}`);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(storagePath, blob, { upsert: true, contentType: mimeType });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ─── Matches helpers ──────────────────────────────────────────────────────────

export async function getMatches(userId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      user1:profiles!matches_user1_id_fkey(id, display_name, avatar_url, age, location_city, occupation, attachment_style),
      user2:profiles!matches_user2_id_fkey(id, display_name, avatar_url, age, location_city, occupation, attachment_style)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((match) => ({
    ...match,
    other_user: match.user1_id === userId ? match.user2 : match.user1,
  }));
}

export async function getPendingMatches(userId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      user1:profiles!matches_user1_id_fkey(id, display_name, avatar_url, age, location_city, occupation, bio, interests, attachment_style),
      user2:profiles!matches_user2_id_fkey(id, display_name, avatar_url, age, location_city, occupation, bio, interests, attachment_style)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((match) => ({
    ...match,
    other_user: match.user1_id === userId ? match.user2 : match.user1,
  }));
}

export async function respondToMatch(matchId: string, accept: boolean) {
  return supabase
    .from('matches')
    .update({ status: accept ? 'accepted' : 'rejected', updated_at: new Date().toISOString() })
    .eq('id', matchId);
}

// ─── Messages helpers ─────────────────────────────────────────────────────────

export async function getMessages(matchId: string, limit = 50, before?: string) {
  let query = supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  return query;
}

export async function sendMessage(matchId: string, content: string, type = 'text') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: session.user.id, content, type })
    .select()
    .single();
}

export function subscribeToMessages(matchId: string, onMessage: (msg: unknown) => void) {
  return supabase
    .channel(`messages:${matchId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `match_id=eq.${matchId}`,
    }, (payload) => onMessage(payload.new))
    .subscribe();
}
