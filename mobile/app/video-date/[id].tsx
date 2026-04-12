import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../src/lib/constants';
import type { Match } from '../../src/types';

// Note: Full Agora RTC integration requires @agora-io/react-native-sdk
// This screen provides the complete UI shell ready for Agora integration.

type CallState = 'connecting' | 'connected' | 'ended';

export default function VideoDatingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const [callState, setCallState] = useState<CallState>('connecting');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const { data: match } = useQuery<Match>({
    queryKey: ['match', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(id, display_name, avatar_url),
          user2:profiles!matches_user2_id_fkey(id, display_name, avatar_url)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return { ...data, other_user: data.user1_id === userId ? data.user2 : data.user1 } as Match;
    },
    enabled: !!id,
  });

  // Simulate connecting → connected
  useEffect(() => {
    const t = setTimeout(() => setCallState('connected'), 2000);
    return () => clearTimeout(t);
  }, []);

  // Duration timer
  useEffect(() => {
    if (callState !== 'connected') return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function handleEndCall() {
    Alert.alert('End call?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: () => {
          setCallState('ended');
          setTimeout(() => router.back(), 1500);
        },
      },
    ]);
  }

  const otherUser = match?.other_user;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Remote video background (placeholder — Agora RtcSurfaceView goes here) */}
      <LinearGradient colors={[COLORS.night, '#1A0E2E', COLORS.night]} style={styles.remoteVideo} />

      {/* Connecting overlay */}
      {callState === 'connecting' && (
        <View style={styles.connectingOverlay}>
          <Avatar uri={otherUser?.avatar_url} name={otherUser?.display_name} size={100} />
          <Text style={styles.connectingName}>{otherUser?.display_name ?? '...'}</Text>
          <Text style={styles.connectingStatus}>Connecting…</Text>
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
        </View>
      )}

      {callState === 'ended' && (
        <View style={styles.connectingOverlay}>
          <Text style={styles.endedText}>Call ended</Text>
          <Text style={styles.endedDuration}>{formatDuration(duration)}</Text>
        </View>
      )}

      {/* Local video preview (placeholder — Agora RtcSurfaceView goes here) */}
      {callState === 'connected' && (
        <View style={styles.localVideoBox}>
          {cameraOff ? (
            <View style={styles.cameraOffBox}>
              <Avatar uri={undefined} name="You" size={40} />
            </View>
          ) : (
            <LinearGradient colors={['#2D1A40', '#1A0E2E']} style={styles.localVideoPlaceholder}>
              <Text style={styles.youLabel}>You</Text>
            </LinearGradient>
          )}
        </View>
      )}

      {/* Top bar */}
      {callState === 'connected' && (
        <View style={styles.topBar}>
          <View style={styles.callInfo}>
            <View style={styles.liveDot} />
            <Text style={styles.callDuration}>{formatDuration(duration)}</Text>
          </View>
          <Text style={styles.callName}>{otherUser?.display_name}</Text>
        </View>
      )}

      {/* Controls */}
      {callState !== 'ended' && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]}
            onPress={() => setMuted((v) => !v)}
          >
            <Text style={styles.ctrlIcon}>{muted ? '🔇' : '🎙️'}</Text>
            <Text style={styles.ctrlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
            <Text style={styles.endIcon}>📵</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, cameraOff && styles.ctrlBtnActive]}
            onPress={() => setCameraOff((v) => !v)}
          >
            <Text style={styles.ctrlIcon}>{cameraOff ? '📷' : '📸'}</Text>
            <Text style={styles.ctrlLabel}>{cameraOff ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Agora integration note */}
      {callState === 'connected' && (
        <View style={styles.agoraBanner}>
          <Text style={styles.agoraBannerText}>
            Live video powered by Agora — connect EXPO_PUBLIC_AGORA_APP_ID to activate
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.night },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.base,
  },
  connectingName: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.white },
  connectingStatus: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.base, color: 'rgba(255,255,255,0.6)' },
  loadingDots: { flexDirection: 'row', gap: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.rose },
  endedText: { fontFamily: FONTS.serif, fontSize: FONT_SIZES['3xl'], color: COLORS.white },
  endedDuration: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.lg, color: 'rgba(255,255,255,0.6)' },
  localVideoBox: {
    position: 'absolute',
    top: 60,
    right: SPACING.base,
    width: 90,
    height: 130,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  localVideoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  youLabel: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.7)' },
  cameraOffBox: {
    flex: 1,
    backgroundColor: COLORS.nightCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: SPACING['3xl'],
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  callInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.rose },
  callDuration: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: COLORS.white },
  callName: { fontFamily: FONTS.serif, fontSize: FONT_SIZES.xl, color: COLORS.white },
  controls: {
    position: 'absolute',
    bottom: SPACING['4xl'],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING['3xl'],
  },
  ctrlBtn: {
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
  },
  ctrlBtnActive: { backgroundColor: 'rgba(200,113,106,0.35)' },
  ctrlIcon: { fontSize: 22 },
  ctrlLabel: { fontFamily: FONTS.sans, fontSize: FONT_SIZES.xs, color: COLORS.white },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endIcon: { fontSize: 28 },
  agoraBanner: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.base,
    right: SPACING.base,
  },
  agoraBannerText: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
});
