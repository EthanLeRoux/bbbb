import { Text, StyleSheet } from 'react-native';
import { Card, LabelValue, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getAttemptById } from '../api/attempts';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, typography } from '../theme';
import { formatDate, itemTitle } from './shared';

export default function AttemptDetailScreen({ route }) {
  const attemptId = route.params?.attemptId;
  const testId = route.params?.testId;
  const { data, error, loading, refresh } = useAsyncData(() => {
    if (!attemptId) return Promise.resolve(null);
    return getAttemptById(attemptId);
  }, [attemptId]);

  return (
    <ScreenScaffold
      eyebrow="Attempt"
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle={attemptId ? `Attempt ID ${attemptId}` : 'Attempt details will appear after the backend creates an attempt.'}
      title="Attempt Detail"
    >
      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Attempt unavailable" />
      ) : data ? (
        <Card>
          <Text style={styles.title}>{itemTitle(data, 'Attempt')}</Text>
          <LabelValue label="Score" value={data.score ?? data.percentage ?? 'Not scored'} />
          <LabelValue label="Created" value={formatDate(data.createdAt || data.created_at)} />
        </Card>
      ) : (
        <StateBlock
          message={testId ? `Test ${testId} is ready, but no attempt record is available yet.` : 'No attempt record was provided.'}
          title="No attempt detail"
        />
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
});
