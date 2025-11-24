import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useNotes } from '@/context/NotesContext';
import { colors, radius, spacing } from '@/styles/theme';
import { formatDate, formatMillis } from '@/utils/time';

export default function NotesListScreen() {
  const router = useRouter();
  const { notes, ready, deleteNote } = useNotes();
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const data = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        subtitle: note.summary || note.transcript.slice(0, 80),
      })),
    [notes],
  );

  const confirmDelete = (id: string) => {
    Alert.alert('Supprimer la note ?', 'Cette action est definitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => deleteNote(id),
      },
    ]);
  };

  return (
    <GradientScreen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.eyebrow}>Autonote</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{notes.length} notes</Text>
          </View>
        </View>
        <Text style={styles.title}>Tes enregistrements</Text>
        <Text style={styles.subtitle}>Reecoute, explore la timeline, partage le resume Gemini.</Text>
      </View>

      {!ready ? (
        <View style={styles.loadingList}>
          {[0, 1, 2].map((key) => (
            <Animated.View key={key} style={[styles.loadingCard, { opacity: pulse }]} />
          ))}
        </View>
      ) : data.length === 0 ? (
        <GlassCard style={styles.empty}>
          <Text style={styles.emptyTitle}>Pas encore de note</Text>
          <Text style={styles.muted}>Lance un enregistrement pour voir la magie Gemini.</Text>
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
                  <View>
                    <Text style={styles.itemTitle}>{item.title || 'Note audio'}</Text>
                    <Text style={styles.duration}>{formatMillis(item.duration)}</Text>
                  </View>
                  <Pressable
                    onPress={() => confirmDelete(item.id)}
                    style={styles.deleteButton}
                    hitSlop={10}>
                    <Text style={styles.deleteText}>Suppr.</Text>
                  </Pressable>
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

      <FloatingActionButton label="Nouvel enregistrement" onPress={() => router.push('/record')} />
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.accentAlt,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
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
  loadingList: {
    gap: spacing.sm,
  },
  loadingCard: {
    height: 90,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
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
  deleteButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
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
