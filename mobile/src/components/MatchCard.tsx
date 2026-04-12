import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SHADOW, SPACING } from '../lib/constants';
import type { Match } from '../types';
import { Badge } from './ui/Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING['2xl'] * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

interface MatchCardProps {
  match: Match;
  onAccept: () => void;
  onReject: () => void;
  onPress: () => void;
  isTop?: boolean;
}

export function MatchCard({ match, onAccept, onReject, onPress, isTop = true }: MatchCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5, { velocity: 800 });
        if (direction > 0) runOnJS(onAccept)();
        else runOnJS(onReject)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-25, 0, 25]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], 'clamp'),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, 0], [1, 0], 'clamp'),
  }));

  const profile = match.other_user;
  if (!profile) return null;

  const score = match.compatibility_score ?? 0;
  const scoreColor = score >= 85 ? COLORS.sage : score >= 70 ? COLORS.gold : COLORS.rose;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, isTop ? cardStyle : undefined]}>
        <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.touchable}>
          {/* Photo */}
          <Image
            source={{ uri: profile.avatar_url ?? undefined }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />

          {/* LIKE / NOPE overlays */}
          <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
            <Text style={styles.nopeText}>NOPE</Text>
          </Animated.View>

          {/* Score badge */}
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>{score}%</Text>
          </View>

          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.gradient}
            locations={[0.3, 1]}
          >
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile.display_name}</Text>
                {profile.age && <Text style={styles.age}>{profile.age}</Text>}
                {profile.is_verified && <Text style={styles.verified}>✓</Text>}
              </View>

              {profile.occupation && (
                <Text style={styles.occupation}>{profile.occupation}</Text>
              )}

              {profile.location_city && (
                <Text style={styles.location}>📍 {profile.location_city}</Text>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <View style={styles.interests}>
                  {profile.interests.slice(0, 3).map((interest) => (
                    <Badge key={interest} label={interest} variant="muted" style={styles.interestBadge} />
                  ))}
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
            <Text style={styles.rejectIcon}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
            <Text style={styles.acceptIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  touchable: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOW.lg,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.creamDark,
  },
  overlay: {
    position: 'absolute',
    top: SPACING['2xl'],
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderWidth: 3,
    borderRadius: RADIUS.md,
    zIndex: 10,
  },
  likeOverlay: {
    left: SPACING['2xl'],
    borderColor: COLORS.sage,
    transform: [{ rotate: '-15deg' }],
  },
  nopeOverlay: {
    right: SPACING['2xl'],
    borderColor: COLORS.error,
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.sage,
    letterSpacing: 2,
  },
  nopeText: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.error,
    letterSpacing: 2,
  },
  scoreBadge: {
    position: 'absolute',
    top: SPACING.base,
    right: SPACING.base,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  scoreText: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.55,
    justifyContent: 'flex-end',
    padding: SPACING.base,
  },
  info: {
    gap: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  name: {
    fontFamily: FONTS.serif,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
  },
  age: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.lg,
    color: 'rgba(255,255,255,0.85)',
  },
  verified: {
    fontSize: 16,
    color: COLORS.sage,
  },
  occupation: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  location: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  interestBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING['2xl'],
    paddingVertical: SPACING.base,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.md,
  },
  rejectBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  acceptBtn: {
    backgroundColor: COLORS.rose,
    width: 72,
    height: 72,
    borderRadius: 36,
    ...SHADOW.rose,
  },
  rejectIcon: {
    fontSize: 22,
    color: COLORS.error,
    fontWeight: '700',
  },
  acceptIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
});
