import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { TimelineSegment } from '@/components/TimelineSegment';
import { AudioProgress } from '@/components/AudioProgress';
import { useNotes } from '@/context/NotesContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, radius, spacing } from '@/styles/theme';
import { chunkTimeline } from '@/utils/timeline';
import { formatMillis } from '@/utils/time';

export default function NoteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { getNote, updateNote } = useNotes();
  const note = params.id ? getNote(params.id) : undefined;
  const player = useAudioPlayer(note?.audioUri);
  const playbackError = player.error;

  const [summary, setSummary] = useState(note?.summary ?? '');
  const [keyPointsText, setKeyPointsText] = useState((note?.keyPoints ?? []).join('\n'));
  const [actionsText, setActionsText] = useState((note?.actionItems ?? []).join('\n'));
  const [notesText, setNotesText] = useState(note?.notes ?? '');

  useEffect(() => {
    if (note) {
      setSummary(note.summary);
      setKeyPointsText(note.keyPoints.join('\n'));
      setActionsText(note.actionItems.join('\n'));
      setNotesText(note.notes);
    }
  }, [note?.id]);

  if (!note) {
    return (
      <GradientScreen>
        <Text style={styles.error}>Note not found.</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </GradientScreen>
    );
  }

  const saveSummary = async () => updateNote(note.id, { summary });
  const saveKeyPoints = async () =>
    updateNote(
      note.id,
      { keyPoints: keyPointsText.split('\n').map((line) => line.trim()).filter(Boolean) },
    );
  const saveActions = async () =>
    updateNote(
      note.id,
      { actionItems: actionsText.split('\n').map((line) => line.trim()).filter(Boolean) },
    );
  const saveNotes = async () => updateNote(note.id, { notes: notesText });

  const segments = useMemo(() => chunkTimeline(note.timeline), [note.timeline]);

  return (
    <GradientScreen scrollable>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Recorded</Text>
        <Text style={styles.title}>{note.title || 'Recording'}</Text>
        <Text style={styles.subtitle}>
          Duration {formatMillis(note.duration)} — {new Date(note.date).toLocaleString()}
        </Text>
      </View>

      <GlassCard style={styles.card}>
        <View style={styles.playerRow}>
          <Pressable
            style={[styles.playButton, playbackError && styles.playButtonDisabled]}
            onPress={player.toggle}
            disabled={!!playbackError}>
            <Text style={styles.playLabel}>
              {playbackError ? 'Unavailable' : player.isPlaying ? 'Pause' : 'Play'}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <AudioProgress position={player.position} duration={player.duration} onSeek={player.seekTo} />
          </View>
        </View>
        {playbackError ? (
          <Text style={styles.error}>{playbackError}</Text>
        ) : (
          <Text style={styles.muted}>Tap the bar or any timeline block to jump to that moment.</Text>
        )}
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <TextInput
          multiline
          value={summary}
          onChangeText={setSummary}
          onBlur={saveSummary}
          placeholder="Edit the summary..."
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Key points</Text>
        <TextInput
          multiline
          value={keyPointsText}
          onChangeText={setKeyPointsText}
          onBlur={saveKeyPoints}
          placeholder="One bullet per line"
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
        <Text style={styles.sectionTitle}>Action items</Text>
        <TextInput
          multiline
          value={actionsText}
          onChangeText={setActionsText}
          onBlur={saveActions}
          placeholder="One action per line"
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          multiline
          value={notesText}
          onChangeText={setNotesText}
          onBlur={saveNotes}
          placeholder="Add your own notes or decisions..."
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <ScrollView style={styles.timeline} nestedScrollEnabled>
          {segments.map((segment, idx) => (
            <TimelineSegment
              key={`${segment.start}-${idx}`}
              text={segment.text}
              startMs={segment.start * 1000}
              onPress={(ms) => {
                if (!playbackError) {
                  player.seekTo(ms);
                }
              }}
            />
          ))}
        </ScrollView>
      </GlassCard>

      <View style={styles.keywordRow}>
        {note.timedKeywords.map((keyword) => (
          <View key={keyword.keyword} style={styles.keyword}>
            <Text style={styles.keywordLabel}>{keyword.keyword}</Text>
            <Text style={styles.keywordTime}>{formatMillis(keyword.time * 1000)}</Text>
          </View>
        ))}
      </View>
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
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
  },
  link: {
    color: colors.accent,
    marginTop: spacing.sm,
  },
  card: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  playButtonDisabled: {
    backgroundColor: colors.border,
  },
  playLabel: {
    color: '#0b1021',
    fontWeight: '700',
  },
  muted: {
    color: colors.muted,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  textArea: {
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeline: {
    maxHeight: 320,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  keyword: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  keywordLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  keywordTime: {
    color: colors.muted,
    fontSize: 12,
  },
});
