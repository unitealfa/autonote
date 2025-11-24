import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { ProcessingSteps } from '@/components/ProcessingSteps';
import { colors, spacing, radius } from '@/styles/theme';
import { uploadToSpeechmatics, pollSpeechmaticsTranscript } from '@/api/speechmatics';
import { summarizeWithGemini } from '@/api/gemini';
import { useNotes } from '@/context/NotesContext';
import { Note } from '@/types/note';
import { estimateKeywordTimes } from '@/utils/timeline';

const clipText = (value: string, max = 800) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ audioUri?: string; duration?: string; fileName?: string }>();
  const { addNote } = useNotes();

  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechmaticsRaw, setSpeechmaticsRaw] = useState('');
  const [timelinePreview, setTimelinePreview] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  const steps = useMemo(
    () => [
      { label: 'Uploading audio...', active: activeIndex === 0, done: activeIndex > 0 },
      { label: 'Transcribing...', active: activeIndex === 1, done: activeIndex > 1 },
      { label: 'Generating summary...', active: activeIndex === 2, done: activeIndex > 2 },
      { label: 'Saving note...', active: activeIndex === 3, done: activeIndex > 3 },
    ],
    [activeIndex],
  );

  useEffect(() => {
    if (!params.audioUri) {
      router.replace('/record');
      return;
    }

    const process = async () => {
      try {
        setError(null);
        setFailed(false);
        setActiveIndex(0);

        if (Platform.OS === 'web' && params.audioUri?.startsWith('blob:')) {
          throw new Error(
            "L'envoi vers Speechmatics n'est pas supporté pour les enregistrements web. Utilise un device natif ou sauvegarde hors ligne.",
          );
        }

        const jobId = await uploadToSpeechmatics(params.audioUri!);

        setActiveIndex(1);
        const { transcriptText, timeline, transcriptJson } = await pollSpeechmaticsTranscript(
          jobId,
          (status) => setActiveIndex(status === 'done' ? 2 : 1),
        );

        setTranscript(transcriptText || '(Transcript vide renvoyé)');
        setSpeechmaticsRaw(JSON.stringify(transcriptJson, null, 2));
        setTimelinePreview(
          timeline
            .slice(0, 12)
            .map((t) => `${t.word} (${t.start.toFixed(2)}-${t.end.toFixed(2)})`)
            .join(' | '),
        );

        setActiveIndex(2);
        let summaryText = 'Transcript vide reçu de Speechmatics.';
        let points: string[] = [];
        let acts: string[] = [];
        if (transcriptText && transcriptText.length > 0) {
          try {
            const g = await summarizeWithGemini(transcriptText, timeline);
            summaryText = g.summary;
            points = g.keyPoints ?? [];
            acts = g.actionItems ?? [];
          } catch (e) {
            console.warn('Gemini summary failed', e);
            summaryText = 'Résumé indisponible (erreur Gemini).';
          }
        }
        setSummary(summaryText);
        setKeyPoints(points);
        setActions(acts);

        setActiveIndex(3);
        const note: Note = {
          id: `note-${Date.now()}`,
          title: params.fileName || 'New recording',
          audioUri: params.audioUri!,
          duration: Number(params.duration ?? 0),
          date: new Date().toISOString(),
          transcript: transcriptText,
          summary: summaryText,
          keyPoints: points,
          actionItems: acts,
          notes: '',
          timeline,
          timedKeywords: estimateKeywordTimes(points ?? [], timeline),
        };
        await addNote(note);

        setActiveIndex(4);
        router.replace({ pathname: '/note/[id]', params: { id: note.id } });
      } catch (err) {
        console.error(err);
        const msg = (err as Error).message || 'Network request failed';
        setError(msg);
        setFailed(true);
        Alert.alert('Processing failed', msg);
      }
    };

    process();
  }, [addNote, params.audioUri, params.duration, params.fileName, router]);

  return (
    <GradientScreen scrollable>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Processing</Text>
        <Text style={styles.title}>Transcription + Résumé</Text>
        <Text style={styles.subtitle}>
          Audio envoyé à Speechmatics puis résumé en français par Gemini. Aperçu ci-dessous.
        </Text>
      </View>
      <GlassCard style={styles.card}>
        <ProcessingSteps steps={steps} />
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
          {error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              <Text style={styles.muted}>Vérifie la connexion ou la clé API.</Text>
              {failed ? (
                <Pressable style={styles.offlineButton} onPress={() => router.replace('/record')}>
                  <Text style={styles.offlineLabel}>Retour</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.muted}>Cela peut prendre quelques secondes…</Text>
          )}
        </View>
        {!!transcript && (
          <View style={styles.previewBlock}>
            <Text style={styles.previewTitle}>Transcript</Text>
            <Text style={styles.previewText}>{clipText(transcript, 1200)}</Text>
          </View>
        )}
        {!!timelinePreview && (
          <View style={styles.previewBlock}>
            <Text style={styles.previewTitle}>Timeline (aperçu)</Text>
            <Text style={styles.previewText}>{timelinePreview}</Text>
          </View>
        )}
        {!!speechmaticsRaw && (
          <View style={styles.previewBlock}>
            <Text style={styles.previewTitle}>Réponse Speechmatics (JSON)</Text>
            <Text style={styles.previewCode}>{clipText(speechmaticsRaw, 1000)}</Text>
          </View>
        )}
        {!!summary && (
          <View style={styles.previewBlock}>
            <Text style={styles.previewTitle}>Résumé (Gemini)</Text>
            <Text style={styles.previewText}>{clipText(summary, 1200)}</Text>
            {!!keyPoints.length && (
              <>
                <Text style={styles.previewTitle}>Points clés</Text>
                {keyPoints.map((kp) => (
                  <Text key={kp} style={styles.previewText}>• {kp}</Text>
                ))}
              </>
            )}
            {!!actions.length && (
              <>
                <Text style={styles.previewTitle}>Actions</Text>
                {actions.map((act) => (
                  <Text key={act} style={styles.previewText}>• {act}</Text>
                ))}
              </>
            )}
          </View>
        )}
      </GlassCard>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.accentAlt,
    letterSpacing: 1,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 20,
  },
  card: {
    gap: spacing.lg,
  },
  loader: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  offlineButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.cardStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  previewBlock: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  previewTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  previewText: {
    color: colors.text,
    lineHeight: 18,
  },
  previewCode: {
    color: colors.muted,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    lineHeight: 16,
  },
  backButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  backLabel: {
    color: '#0b1021',
    fontWeight: '700',
  },
});
