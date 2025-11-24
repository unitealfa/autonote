import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useNotes } from '@/context/NotesContext';
import { colors, radius, spacing } from '@/styles/theme';
import { formatDate, formatMillis } from '@/utils/time';

export default function NotesListScreen() {
  const router = useRouter();
  const { notes, ready } = useNotes();

  const data = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        subtitle: note.summary || note.transcript.slice(0, 80),
      })),
    [notes],
  );

  return (
    <GradientScreen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Library</Text>
        <Text style={styles.title}>Past recordings</Text>
        <Text style={styles.subtitle}>Tap a note to open the timeline, summary, and audio player.</Text>
      </View>

      {!ready ? (
        <Text style={styles.muted}>Loading your notes…</Text>
      ) : data.length === 0 ? (
        <GlassCard style={styles.empty}>
          <Text style={styles.emptyTitle}>No recordings yet</Text>
          <Text style={styles.muted}>Start a new recording to see it appear here.</Text>
        </GlassCard>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })}
              style={styles.item}>
              <GlassCard>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{item.title || 'Recording'}</Text>
                  <Text style={styles.duration}>{formatMillis(item.duration)}</Text>
                </View>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Text style={styles.itemText} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </GlassCard>
            </Pressable>
          )}
        />
      )}

      <FloatingActionButton label="New Recording" onPress={() => router.push('/record')} />
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
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 20,
  },
  muted: {
    color: colors.muted,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 120,
  },
  item: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  duration: {
    color: colors.accentAlt,
    fontWeight: '700',
  },
  date: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 8,
  },
  itemText: {
    color: colors.text,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
});
