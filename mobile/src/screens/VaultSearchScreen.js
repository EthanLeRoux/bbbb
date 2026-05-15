import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView } from 'react-native';
import { Card, StateBlock } from '../components/ScreenScaffold';
import { searchVault } from '../api/vault';
import { colors, fonts, spacing, typography } from '../theme';
import { itemTitle } from './shared';

export default function VaultSearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchVault(q.trim());
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.results)) list = data.results;
      else if (Array.isArray(data?.notes)) list = data.notes;
      setResults(list);
      setSearched(true);
    } catch (e) {
      setError(e.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(timerRef.current);
  }, [query, doSearch]);

  return (
    <View style={s.container}>
      {/* Search input */}
      <View style={s.inputRow}>
        <Text style={s.icon}>⌕</Text>
        <TextInput
          autoFocus
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder="Search vault…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={s.input}
          value={query}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={s.clear}>
            <Text style={s.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={s.results} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.accent} />
            <Text style={s.hint}>Searching…</Text>
          </View>
        ) : error ? (
          <StateBlock error={error} title="Search failed" />
        ) : !searched ? (
          <Text style={s.hint}>Type to search across all vault notes.</Text>
        ) : results.length === 0 ? (
          <Text style={s.hint}>No results for "{query}".</Text>
        ) : (
          <>
            <Text style={s.count}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
            {results.map((note, i) => {
              const id = note.id || note.slug || `result-${i}`;
              const title = itemTitle(note);
              const domain = note.domain;
              const section = note.section;
              const topic = note.topic;
              const snippet = note.snippet || note.excerpt || '';

              return (
                <Card
                  key={id}
                  onPress={() =>
                    navigation.navigate('VaultNote', {
                      domain,
                      section,
                      topic,
                      noteId: id,
                      title,
                    })
                  }
                >
                  <Text style={s.noteTitle}>{title}</Text>
                  <Text style={s.path} numberOfLines={1}>
                    {[domain, section, topic].filter(Boolean).join(' › ')}
                  </Text>
                  {snippet ? (
                    <Text style={s.snippet} numberOfLines={3}>
                      {snippet}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  clear: {
    padding: spacing.xs,
  },
  clearText: {
    color: colors.muted,
    fontSize: 14,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  count: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    paddingTop: spacing.sm,
  },
  icon: {
    color: colors.muted,
    fontSize: 20,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: typography.body,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  noteTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
  path: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  results: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  snippet: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
