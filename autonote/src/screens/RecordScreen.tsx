import React, { useEffect, useRef } from 'react';
import { Animated, Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { RecordButton } from '@/components/RecordButton';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { colors, radius, spacing } from '@/styles/theme';

const highlights = ['Horodatage auto', 'Resume Gemini', 'Lecture timeline'];

export default function RecordScreen() {
  const router = useRouter();
  const { start, stop, isRecording, error, level } = useAudioRecorder();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const handlePress = async () => {
    if (!isRecording) {
      await start();
    } else {
      const result = await stop();
      if (!result) {
        Alert.alert('Erreur', 'Impossible de sauvegarder. Reessaie.');
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

  const statusLabel = isRecording ? 'Enregistrement...' : 'Pret a capter';

  return (
    <GradientScreen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Capture</Text>
        <Text style={styles.title}>Enregistrer en un tap</Text>
        <Text style={styles.subtitle}>Une note claire, des timestamps precis, resume auto.</Text>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.statusChip, { opacity: pulse }]}>
          <View style={[styles.dot, isRecording && styles.dotLive]} />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </Animated.View>
        <RecordButton isRecording={isRecording} onPress={handlePress} level={level} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.bottom}>
        <GlassCard>
          <View style={styles.chipsRow}>
            {highlights.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.helper}>Appuie, parle, stoppe. On s'occupe du reste.</Text>
        </GlassCard>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.accentAlt,
    letterSpacing: 1,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 26,
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
    gap: spacing.md,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 10,
    backgroundColor: colors.muted,
  },
  dotLive: {
    backgroundColor: colors.accentAlt,
  },
  statusText: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  bottom: {
    marginTop: spacing.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
  },
  helper: {
    color: colors.muted,
  },
});
