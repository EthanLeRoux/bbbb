import { View, Text, StyleSheet } from 'react-native';
import { Card, LabelValue, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getStats } from '../api/tests';
import { getAttemptStats } from '../api/attempts';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, spacing, typography } from '../theme';

export default function StatsScreen() {
  const testStats = useAsyncData(getStats, []);
  const attemptStats = useAsyncData(getAttemptStats, []);
  const loading = testStats.loading || attemptStats.loading;

  return (
    <ScreenScaffold
      eyebrow="Stats"
      refreshControl={<Refresh loading={loading} onRefresh={() => {
        testStats.refresh();
        attemptStats.refresh();
      }} />}
      subtitle="A compact view of learning activity from tests and attempts."
      title="Stats"
    >
      {testStats.loading || testStats.error ? (
        <StateBlock error={testStats.error} loading={testStats.loading} onAction={testStats.refresh} title="Test stats unavailable" />
      ) : (
        <View style={styles.grid}>
          <Card style={styles.tile}>
            <Text style={styles.number}>{testStats.data?.domains ?? 0}</Text>
            <Text style={styles.label}>domains</Text>
          </Card>
          <Card style={styles.tile}>
            <Text style={styles.number}>{testStats.data?.notes ?? 0}</Text>
            <Text style={styles.label}>notes</Text>
          </Card>
        </View>
      )}

      {attemptStats.loading || attemptStats.error ? (
        <StateBlock error={attemptStats.error} loading={attemptStats.loading} onAction={attemptStats.refresh} title="Attempt stats unavailable" />
      ) : (
        <Card>
          <Text style={styles.title}>Attempts</Text>
          <LabelValue label="Completed" value={attemptStats.data?.completed ?? attemptStats.data?.total ?? 0} />
          <LabelValue label="Average score" value={attemptStats.data?.averageScore ?? attemptStats.data?.average ?? 'Unavailable'} />
        </Card>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  number: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 28,
    fontWeight: '800',
  },
  tile: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
});
