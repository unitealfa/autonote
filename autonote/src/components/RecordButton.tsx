import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '@/styles/theme';

type Props = {
  isRecording: boolean;
  onPress: () => void;
  level?: number;
};

export const RecordButton: React.FC<Props> = ({ isRecording, onPress, level = 0 }) => {
  const pulse = useSharedValue(1);
  const reactive = useSharedValue(1);
  const shapeX = useSharedValue(1);
  const shapeY = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 900 }), withTiming(0.97, { duration: 900 })),
      -1,
      true,
    );
  }, [pulse]);

  useEffect(() => {
    if (!isRecording) {
      reactive.value = withTiming(1, { duration: 200 });
      return;
    }
  }, [isRecording, reactive]);

  useEffect(() => {
    if (!isRecording) return;
    const clamped = Math.min(1, Math.max(0, level));
    const target = 0.95 + clamped * 0.35;
    reactive.value = withTiming(target, { duration: 120 });
    const x = 1 + clamped * 0.35; // stretch horizontally
    const y = 1 - clamped * 0.2; // squash vertically
    shapeX.value = withTiming(x, { duration: 100 });
    shapeY.value = withTiming(Math.max(0.75, y), { duration: 100 });
  }, [isRecording, level, reactive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isRecording ? reactive.value : pulse.value }],
  }));

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: shapeX.value },
      { scaleY: shapeY.value },
    ],
  }));

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Animated.View style={[styles.shadow, animatedStyle]}>
        <LinearGradient colors={gradients.accent} style={styles.outerRing}>
          <Animated.View style={[styles.inner, isRecording && styles.innerRecording, blobStyle]}>
            <Text style={styles.label}>{isRecording ? 'Stop' : 'Record'}</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
  },
  shadow: Platform.select({
    web: {
      boxShadow: '0 12px 20px rgba(77, 225, 255, 0.25)',
    },
    default: {
      shadowColor: colors.accentAlt,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
    },
  }),
  outerRing: {
    padding: 8,
    borderRadius: 999,
  },
  inner: {
    height: 160,
    width: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRecording: {
    backgroundColor: 'rgba(244,63,94,0.2)',
    borderColor: colors.danger,
  },
  label: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
