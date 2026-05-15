import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import { colors, spacing, typography } from '../theme'; // adjust path

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const VAULT_ENDPOINT = '/api/vault/domains/';

export default function VaultScreen({ navigation }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}${VAULT_ENDPOINT}`);
      const json = await res.json();

      const list = Array.isArray(json) ? json : json?.data ?? [];
      setDomains(list);
    } catch (err) {
      setError(err?.message || 'Failed to fetch');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vault</Text>

      {loading && <Text style={styles.infoText}>Loading...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDomains} />
        }
      >
        {domains.map((domain, index) => {
          const name = domain?.name ?? String(domain);

          return (
            <TouchableOpacity
              key={domain?.id ?? index}
              onPress={() =>
                navigation.navigate('VaultSections', { domain: name })
              }
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{name}</Text>
              <Text style={styles.cardSubtitle}>Study domain →</Text>
              <Text style={styles.cardSubtitle}>Note Count: {domain.noteCount}</Text>
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
    fontSize: typography.title,
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