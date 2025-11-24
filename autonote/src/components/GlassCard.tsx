import React from 'react';
import { BlurView } from 'expo-blur';
import { StyleSheet, ViewStyle } from 'react-native';
import { glass, radius, spacing } from '@/styles/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const GlassCard: React.FC<Props> = ({ children, style }) => {
  return (
    <BlurView intensity={55} tint="dark" style={[styles.card, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.borderColor,
    padding: spacing.lg,
    backgroundColor: glass.backgroundColor,
  },
});
