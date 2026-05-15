import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StateBlock } from '../components/ScreenScaffold';
import MarkdownView from '../components/MarkdownView';
import { getCardWithState } from '../api/vault';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, spacing, typography } from '../theme';
import { formatDate, itemTitle } from './shared';

function MetaChip({ label, value }) {
  if (!value) return null;
  return (
    <View style={s.chip}>
      <Text style={s.chipLabel}>{label}</Text>
      <Text style={s.chipValue}>{value}</Text>
    </View>
  );
}

function TagList({ tags }) {
  if (!tags?.length) return null;
  return (
    <View style={s.tagRow}>
      {tags.map((t) => (
        <View key={t} style={s.tag}>
          <Text style={s.tagText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

export default function VaultNoteScreen({ navigation, route }) {
  const { domain, section, topic, noteId, title } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: title || 'Note' });
  }, [navigation, title]);

  const load = () => getCardWithState(noteId);
  const { data, error, loading, refresh } = useAsyncData(load, [noteId]);

  // data may be the card wrapper or the note itself
  const note = data?.note || data?.card?.note || data;
  const cardState = data?.cardState || data?.card?.cardState;

  if (loading) {
    return (
      <View style={s.center}>
        <StateBlock loading title="Loading note…" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <StateBlock error={error} onAction={refresh} title="Could not load note" />
      </View>
    );
  }

  const content = note?.content || note?.body || note?.markdown || '';
  const noteTitle = itemTitle(note) || title || 'Note';
  const tags = note?.tags || [];
  const createdAt = note?.createdAt || note?.created_at;
  const updatedAt = note?.updatedAt || note?.updated_at;
  const noteTopic = note?.topic || topic;
  const noteSection = note?.section || section;
  const noteDomain = note?.domain || domain;

  // Spaced-repetition state
  const dueDate = cardState?.dueDate || cardState?.due_date;
  const stability = cardState?.stability;
  const difficulty = cardState?.difficulty;

  return (
    <ScrollView
      contentContainerStyle={s.content}
      style={s.container}
    >
      {/* Breadcrumb */}
      <Text style={s.breadcrumb} numberOfLines={1}>
        {[noteDomain, noteSection, noteTopic].filter(Boolean).join(' › ')}
      </Text>

      {/* Title */}
      <Text style={s.title}>{noteTitle}</Text>

      {/* Tags */}
      <TagList tags={tags} />

      {/* Metadata chips */}
      <View style={s.metaRow}>
        <MetaChip label="Created" value={formatDate(createdAt)} />
        <MetaChip label="Updated" value={formatDate(updatedAt)} />
        {dueDate ? <MetaChip label="Due" value={formatDate(dueDate)} /> : null}
        {stability != null ? (
          <MetaChip label="Stability" value={`${Number(stability).toFixed(1)} d`} />
        ) : null}
        {difficulty != null ? (
          <MetaChip label="Difficulty" value={Number(difficulty).toFixed(2)} />
        ) : null}
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Markdown content */}
      {content ? (
        <MarkdownView content={content} />
      ) : (
        <Text style={s.empty}>No content available for this note.</Text>
      )}

      <View style={s.bottomPad} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bottomPad: { height: 40 },
  breadcrumb: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    padding: spacing.lg,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  chipValue: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  divider: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    marginVertical: spacing.xs,
  },
  empty: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.accentMuted,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagText: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 34,
  },
});
