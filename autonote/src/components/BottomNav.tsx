import React, { useEffect } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/styles/theme';

type IconName = keyof typeof Feather.glyphMap;

const TabButton: React.FC<{
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
}> = ({ label, icon, focused, onPress }) => {
  const scale = useSharedValue(focused ? 1 : 0.94);
  const opacity = useSharedValue(focused ? 1 : 0.75);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.94, { duration: 160 });
    opacity.value = withTiming(focused ? 1 : 0.75, { duration: 160 });
  }, [focused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabPressable}>
      <Animated.View style={[styles.tab, animatedStyle, focused && styles.tabActive]}>
        <Feather name={icon} size={20} color={focused ? colors.text : colors.muted} />
        <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

export const BottomNav: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { bottom } = useSafeAreaInsets();
  const paddingBottom = Math.max(bottom, spacing.sm);

  return (
    <View style={[styles.wrapper, { paddingBottom }]}>
      <LinearGradient
        colors={['rgba(12,20,48,0.9)', 'rgba(12,20,48,0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
      />
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const icon = (route.name === 'record' ? 'mic' : 'book-open') as IconName;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <TabButton
              key={route.key}
              label={String(label)}
              icon={icon}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    opacity: 0.95,
  },
  bar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabPressable: {
    flex: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    color: colors.muted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.text,
  },
});
