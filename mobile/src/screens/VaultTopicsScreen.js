import { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getNotes, getTopics } from '../api/vault';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, spacing, typography } from '../theme';
import { asList, itemTitle } from './shared';

function Badge({ label }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function VaultTopicsScreen({ navigation, route }) {
  const { domain, section } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: section });
  }, [navigation, section]);

  const loadTopics = () => getTopics(domain, section);
  const loadNotes = () => getNotes(domain, section);

  const topics$ = useAsyncData(loadTopics, [domain, section]);
  const notes$ = useAsyncData(loadNotes, [domain, section]);

  const topics = asList(topics$.data);
  // Direct notes (not under a topic) live at the section level
  let directNotes = [];
  if (Array.isArray(notes$.data?.notes)) {
    directNotes = notes$.data.notes;
  } else if (Array.isArray(notes$.data)) {
    directNotes = notes$.data;
  }

  const loading = topics$.loading || notes$.loading;
  const error = topics$.error || notes$.error;

  return (
    <ScreenScaffold
      eyebrow={`${domain} › ${section}`}
      refreshControl={
        <Refresh
          loading={loading}
          onRefresh={() => { topics$.refresh(); notes$.refresh(); }}
        />
      }
      subtitle="Topics and notes in this section."
      title="Browse"
    >
      {loading && topics.length === 0 && directNotes.length === 0 ? (
        <StateBlock loading title="Loading section…" />
      ) : error && topics.length === 0 && directNotes.length === 0 ? (
        <StateBlock
          error={error}
          onAction={() => { topics$.refresh(); notes$.refresh(); }}
          title="Section unavailable"
        />
      ) : (
        <>
          {topics.length > 0 && (
            <View style={styles.group}>
              <Text style={styles.groupLabel}>Topics</Text>
              {topics.map((topic) => {
                const name = itemTitle(topic);
                return (
                  <Card
                    key={name}
                    onPress={() =>
                      navigation.navigate('VaultNotes', { domain, section, topic: name })
                    }
                  >
                    <View style={styles.row}>
                      <Text style={styles.title}>{name}</Text>
                      <Badge label="topic" />
                    </View>
                    <Text style={styles.meta}>Browse notes  →</Text>
                  </Card>
                );
              })}
            </View>
          )}

          {directNotes.length > 0 && (
            <View style={styles.group}>
              <Text style={styles.groupLabel}>Notes</Text>
              {directNotes.map((note) => {
                const id = note.id || note.slug || itemTitle(note);
                const title = itemTitle(note);
                return (
                  <Card
                    key={id}
                    onPress={() =>
                      navigation.navigate('VaultNote', { domain, section, noteId: id, title })
                    }
                  >
                    <View style={styles.row}>
                      <Text style={styles.title}>{title}</Text>
                      <Badge label="note" />
                    </View>
                    {note.topic ? <Text style={styles.meta}>Topic: {note.topic}</Text> : null}
                  </Card>
                );
              })}
            </View>
          )}

          {topics.length === 0 && directNotes.length === 0 && (
            <StateBlock message="Nothing found in this section yet." title="Empty section" />
          )}
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  group: { gap: 8 },
  groupLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
});
