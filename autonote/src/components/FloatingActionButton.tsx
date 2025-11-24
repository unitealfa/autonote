import React from 'react';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing } from '@/styles/theme';

type Props = {
  label: string;
  onPress: () => void;
};

export const FloatingActionButton: React.FC<Props> = ({ label, onPress }) => {
  const { bottom } = useSafeAreaInsets();
  const offsetBottom = spacing.xl + Math.max(bottom, spacing.md) + 40;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, { bottom: offsetBottom }, pressed && styles.pressed]}>
      <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="mic" size={16} color="#0b1021" />
          </View>
          <Text style={styles.label}>{label}</Text>
          <Feather name="arrow-up-right" size={16} color="#0b1021" />
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignSelf: 'center',
    right: spacing.lg,
    left: spacing.lg,
    borderRadius: radius.xl,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 22px rgba(124, 123, 255, 0.35)' }
      : {
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.45,
          shadowRadius: 18,
        }),
  },
  gradient: {
    borderRadius: radius.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  label: {
    color: '#0b1021',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  iconCircle: {
    height: 30,
    width: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(11,16,33,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
