import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/styles/theme';

type Props = {
  label: string;
  onPress: () => void;
};

export const FloatingActionButton: React.FC<Props> = ({ label, onPress }) => (
  <Pressable style={styles.button} onPress={onPress}>
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 16px rgba(124, 123, 255, 0.35)' }
      : {
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
        }),
  },
  label: {
    color: '#0b1021',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
