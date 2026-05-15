import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import { getSections } from '../api/vault';
import { colors, spacing, typography } from '../theme';

export default function VaultSectionsScreen({ navigation, route }) {
  const { domain } = route.params;

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getSections(domain);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.sections)
        ? data.sections
        : [];

      setSections(list);
    } catch (err) {
      setError(err?.message || 'Failed to load sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [domain]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{domain}</Text>

      {loading && <Text style={styles.infoText}>Loading sections...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchSections} />
        }
      >
        {sections.map((section, index) => {
          const name = section?.name ?? String(section);

          return (
            <TouchableOpacity
              key={section?.id ?? index}
              onPress={() =>
                navigation.navigate('VaultTopics', {
                  domain,
                  section: name,
                })
              }
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{name}</Text>
              <Text style={styles.cardSubtitle}>Section →</Text>
            </TouchableOpacity>
          );
        })}
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

  title: {
    fontSize: typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
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

  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },

  cardTitle: {
    fontSize: typography.body,
    color: colors.text,
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: typography.caption,
    color: colors.muted,
  },
});