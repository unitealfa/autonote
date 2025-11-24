import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/styles/theme';
import { formatMillis } from '@/utils/time';

type Props = {
  text: string;
  startMs: number;
  onPress: (ms: number) => void;
};

export const TimelineSegment: React.FC<Props> = ({ text, startMs, onPress }) => (
  <Pressable style={styles.segment} onPress={() => onPress(startMs)}>
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{formatMillis(startMs)}</Text>
    </View>
    <Text style={styles.text}>{text}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  segment: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.cardStrong,
    marginBottom: spacing.xs,
  },
  badgeText: {
    color: colors.accentAlt,
    fontSize: 12,
    fontWeight: '700',
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
});
