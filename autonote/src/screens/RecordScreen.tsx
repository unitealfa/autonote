import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { RecordButton } from '@/components/RecordButton';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { colors, radius, spacing } from '@/styles/theme';

const tips = [
  'Tap once to start recording, again to stop.',
  'Speak clearly for best timestamps.',
  'Stay close to the mic to reduce noise.',
];

export default function RecordScreen() {
  const router = useRouter();
  const { start, stop, isRecording, error } = useAudioRecorder();

  const handlePress = async () => {
    if (!isRecording) {
      await start();
    } else {
      const result = await stop();
      if (!result) {
        Alert.alert('Recording error', 'Could not save the audio. Please try again.');
        return;
      }
      router.push({
        pathname: '/processing',
        params: {
          audioUri: result.uri,
          duration: String(result.duration),
          fileName: result.fileName,
        },
      });
    }
  };

  return (
    <GradientScreen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Autonote</Text>
        <Text style={styles.title}>Tap to start recording</Text>
        <Text style={styles.subtitle}>
          Hold a single glowing button to capture your conversation with live timestamps.
        </Text>
      </View>

      <View style={styles.center}>
        <RecordButton isRecording={isRecording} onPress={handlePress} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.bottom}>
        <GlassCard>
          <Text style={styles.cardTitle}>Tips</Text>
          {tips.map((tip) => (
            <Text key={tip} style={styles.cardText}>
              • {tip}
            </Text>
          ))}
        </GlassCard>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.accentAlt,
    letterSpacing: 1,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  bottom: {
    marginTop: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  cardText: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  block: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.lg,
  },
});
