import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/styles/theme';

type Step = {
  label: string;
  active: boolean;
  done: boolean;
};

type Props = {
  steps: Step[];
};

export const ProcessingSteps: React.FC<Props> = ({ steps }) => (
  <View style={styles.container}>
    {steps.map((step) => (
      <View
        key={step.label}
        style={[
          styles.step,
          step.done && styles.stepDone,
          step.active && styles.stepActive,
        ]}>
        <Text style={styles.label}>{step.label}</Text>
        <Text style={styles.status}>{step.done ? 'done' : step.active ? 'running' : 'waiting'}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  step: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepActive: {
    borderColor: colors.accent,
  },
  stepDone: {
    borderColor: colors.success,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
  },
  status: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
