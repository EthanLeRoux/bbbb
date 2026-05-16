import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import { getNotes, getTopics } from '../api/vault';
import { colors, spacing, typography } from '../theme';

function Badge({ label }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function VaultTopicsScreen({ navigation, route }) {
  const { domain, section } = route.params;

  const [topics, setTopics] = useState([]);
  const [directNotes, setDirectNotes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: section });
  }, [navigation, section]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [topicsData, notesData] = await Promise.all([
        getTopics(domain, section),
        getNotes(domain, section),
      ]);

      // Topics
      const topicsList = Array.isArray(topicsData)
        ? topicsData
        : Array.isArray(topicsData?.topics)
        ? topicsData.topics
        : [];

      setTopics(topicsList);

      // Direct notes
      const notesList = Array.isArray(notesData?.notes)
        ? notesData.notes
        : Array.isArray(notesData)
        ? notesData
        : [];

      setDirectNotes(notesList);
    } catch (err) {
      setError(err?.message || 'Failed to load section');
      setTopics([]);
      setDirectNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [domain, section]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionPath}>
        {domain} → {section}
      </Text>

      {loading && (
        <Text style={styles.infoText}>Loading section...</Text>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} />
        }
      >
        {/* Topics */}
        {topics.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>Topics</Text>

            {topics.map((topic, index) => {
              const name =
                topic?.name ??
                topic?.title ??
                String(topic);

              return (
                <TouchableOpacity
                  key={topic?.id ?? name ?? index}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('VaultNotes', {
                      domain,
                      section,
                      topic: name,
                    })
                  }
                >
                  <View style={styles.row}>
                    <Text style={styles.cardTitle}>{name}</Text>
                    <Badge label="topic" />
                  </View>

                  <Text style={styles.cardSubtitle}>
                    Browse notes →
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!loading &&
          topics.length === 0 &&
          directNotes.length === 0 && (
            <Text style={styles.infoText}>
              Nothing found in this section yet.
            </Text>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },

  sectionPath: {
    fontSize: typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },

  infoText: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },

  errorText: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },

  scrollContent: {
    paddingBottom: spacing.xl,
  },

  group: {
    marginBottom: spacing.lg,
  },

  groupLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },

  cardTitle: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
  },

  cardSubtitle: {
    fontSize: typography.caption,
    color: colors.muted,
  },

  badge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  badgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});