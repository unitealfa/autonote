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
};

export const RecordButton: React.FC<Props> = ({ isRecording, onPress }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 900 }), withTiming(0.97, { duration: 900 })),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Animated.View style={[styles.shadow, animatedStyle]}>
        <LinearGradient colors={gradients.accent} style={styles.outerRing}>
          <View style={[styles.inner, isRecording && styles.innerRecording]}>
            <Text style={styles.label}>{isRecording ? 'Stop' : 'Record'}</Text>
          </View>
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
