import { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getTopicNotes } from '../api/vault';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, typography } from '../theme';
import { asList, itemTitle } from './shared';

export default function VaultNotesScreen({ navigation, route }) {
  const { domain, section, topic } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: topic });
  }, [navigation, topic]);

  const load = () => getTopicNotes(domain, section, topic);
  const { data, error, loading, refresh } = useAsyncData(load, [domain, section, topic]);

  let notes = [];
  if (Array.isArray(data?.notes)) notes = data.notes;
  else notes = asList(data);

  return (
    <ScreenScaffold
      eyebrow={`${section} › ${topic}`}
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle="Notes in this topic."
      title="Notes"
    >
      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Notes unavailable" />
      ) : notes.length === 0 ? (
        <StateBlock message="No notes found in this topic." title="No notes" />
      ) : (
        notes.map((note) => {
          const id = note.id || note.slug || itemTitle(note);
          const title = itemTitle(note);
          return (
            <Card
              key={id}
              onPress={() =>
                navigation.navigate('VaultNote', { domain, section, topic, noteId: id, title })
              }
            >
              <Text style={styles.title}>{title}</Text>
              <View style={styles.metaRow}>
                {note.topic ? <Text style={styles.meta}>{note.topic}</Text> : null}
                {note.tags?.length > 0 ? (
                  <Text style={styles.tags}>{note.tags.slice(0, 3).join(' · ')}</Text>
                ) : null}
              </View>
            </Card>
          );
        })
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tags: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
});
