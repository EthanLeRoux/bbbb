import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function ApiStatusCard({ baseUrl, error, health, loading }) {
  const statusLabel = loading ? 'Checking backend...' : health ? 'Backend connected' : 'Backend not connected';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{statusLabel}</Text>
        {loading ? <ActivityIndicator color={colors.accent} /> : null}
      </View>

      <Text style={styles.label}>API base URL</Text>
      <Text style={styles.value}>{baseUrl || 'Set EXPO_PUBLIC_API_BASE_URL in .env'}</Text>

      {health ? (
        <>
          <Text style={styles.label}>Health response</Text>
          <Text style={styles.value}>{health.status || 'ok'}</Text>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: 22,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
