import { View, Text, StyleSheet } from 'react-native';
import ApiStatusCard from '../components/ApiStatusCard';
import { Card, LabelValue, PrimaryButton, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getApiBaseUrl } from '../api/client';
import { getStats, getTests } from '../api/tests';
import useAsyncData from '../hooks/useAsyncData';
import useBackendHealth from '../hooks/useBackendHealth';
import { colors, fonts, spacing, typography } from '../theme';
import { asList, formatDate, itemTitle } from './shared';

export default function DashboardScreen({ navigation }) {
  const health = useBackendHealth();
  const stats = useAsyncData(getStats, []);
  const tests = useAsyncData(() => getTests({ limit: 5 }), []);
  const recentTests = asList(tests.data).slice(0, 5);

  return (
    <ScreenScaffold
      eyebrow="Benkyo.ai"
      refreshControl={<Refresh loading={health.loading || stats.loading || tests.loading} onRefresh={() => {
        health.refresh();
        stats.refresh();
        tests.refresh();
      }} />}
      subtitle="Your study dashboard, tuned for quick checks on mobile."
      title="Dashboard"
      actions={<PrimaryButton label="Generate Test" onPress={() => navigation.navigate('GenerateTest')} />}
    >
      <ApiStatusCard
        baseUrl={getApiBaseUrl()}
        error={health.error}
        health={health.health}
        loading={health.loading}
      />

      {stats.loading || stats.error ? (
        <StateBlock error={stats.error} loading={stats.loading} onAction={stats.refresh} title="Stats unavailable" />
      ) : (
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.data?.domains ?? 0}</Text>
            <Text style={styles.statLabel}>domains</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.data?.notes ?? 0}</Text>
            <Text style={styles.statLabel}>notes</Text>
          </Card>
        </View>
      )}

      <Card onPress={() => navigation.navigate('ReviewDue')}>
        <Text style={styles.cardTitle}>Review Due</Text>
        <Text style={styles.cardText}>Open the review queue and weak areas from recent performance.</Text>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tests</Text>
        {tests.loading || tests.error ? (
          <StateBlock error={tests.error} loading={tests.loading} onAction={tests.refresh} title="Tests unavailable" />
        ) : recentTests.length === 0 ? (
          <StateBlock message="No tests yet. Generate one when you are ready." title="No tests yet" />
        ) : (
          recentTests.map((test) => (
            <Card key={test.id || itemTitle(test)} onPress={() => navigation.navigate('TestDetail', { testId: test.id })}>
              <Text style={styles.cardTitle}>{itemTitle(test, 'Untitled test')}</Text>
              <LabelValue label="Created" value={formatDate(test.createdAt || test.created_at)} />
            </Card>
          ))
        )}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  cardText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 24,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  statNumber: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 28,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
