import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS, FONT_SIZES, RADIUS } from '../../lib/constants';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  verified?: boolean;
}

export function Avatar({ uri, name, size = 48, style, verified }: AvatarProps) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
    : '?';

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { borderRadius: size / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
        </View>
      )}

      {verified && (
        <View style={[styles.badge, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]}>
          <Text style={{ fontSize: size * 0.16 }}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.roseFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FONTS.sansSemiBold,
    color: COLORS.rose,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
});
