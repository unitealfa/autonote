import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { gradients, spacing } from '@/styles/theme';

type Props = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
};

export const GradientScreen: React.FC<Props> = ({ children, scrollable = false, style }) => {
  const content = <View style={[styles.content, style, { pointerEvents: 'box-none' }]}>{children}</View>;

  return (
    <LinearGradient colors={gradients.screen} style={styles.container} start={{ x: 0, y: 0 }}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
});
