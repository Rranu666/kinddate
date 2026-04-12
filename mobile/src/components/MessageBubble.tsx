import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '../lib/constants';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showTime?: boolean;
}

export function MessageBubble({ message, isMine, showTime = true }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}>
          {message.content}
        </Text>
      </View>
      {showTime && (
        <Text style={[styles.time, isMine ? styles.timeRight : styles.timeLeft]}>
          {format(new Date(message.created_at), 'h:mm a')}
          {isMine && message.read_at && ' ✓✓'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '75%',
    marginVertical: SPACING.xs / 2,
  },
  mine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  bubbleMine: {
    backgroundColor: COLORS.rose,
    borderBottomRightRadius: RADIUS.xs,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  textMine: { color: COLORS.white },
  textTheirs: { color: COLORS.textPrimary },
  time: {
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    marginHorizontal: SPACING.xs,
  },
  timeRight: { textAlign: 'right' },
  timeLeft: { textAlign: 'left' },
});
