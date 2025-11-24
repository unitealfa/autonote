import React, { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/styles/theme';
import { formatMillis } from '@/utils/time';

type Props = {
  position: number;
  duration: number;
  onSeek?: (ms: number) => void;
};

export const AudioProgress: React.FC<Props> = ({ position, duration, onSeek }) => {
  const [width, setWidth] = useState(1);
  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const handlePress = useCallback(
    (event: any) => {
      if (!duration || !onSeek) return;
      const x = event.nativeEvent.locationX;
      const ratio = Math.min(1, Math.max(0, x / width));
      onSeek(ratio * duration);
    },
    [duration, onSeek, width],
  );

  const progress = duration ? Math.min(1, position / duration) : 0;

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} onLayout={handleLayout} style={styles.bar}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </Pressable>
      <View style={styles.times}>
        <Text style={styles.time}>{formatMillis(position)}</Text>
        <Text style={styles.time}>{formatMillis(duration)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  bar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    color: colors.muted,
    fontSize: 12,
  },
});
