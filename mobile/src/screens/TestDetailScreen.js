import { Text, StyleSheet } from 'react-native';
import { Card, LabelValue, PrimaryButton, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getTestById } from '../api/tests';
import { startAttempt } from '../api/attempts';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, spacing, typography } from '../theme';
import { itemTitle } from './shared';

export default function TestDetailScreen({ navigation, route }) {
  const testId = route.params?.testId;
  const { data, error, loading, refresh } = useAsyncData(() => {
    if (!testId) throw new Error('No test id was provided.');
    return getTestById(testId);
  }, [testId]);

  async function handleStartAttempt() {
    try {
      const attempt = await startAttempt(testId);
      navigation.navigate('AttemptDetail', { attemptId: attempt?.id, testId });
    } catch {
      navigation.navigate('AttemptDetail', { testId });
    }
  }

  return (
    <ScreenScaffold
      eyebrow="Test"
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle={testId ? `Test ID ${testId}` : 'Missing test id'}
      title="Test Detail"
    >
      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Test unavailable" />
      ) : !data ? (
        <StateBlock message="The backend did not return details for this test." title="No test detail" />
      ) : (
        <Card>
          <Text style={styles.title}>{itemTitle(data, 'Untitled test')}</Text>
          <LabelValue label="Difficulty" value={data.difficulty || 'Mixed'} />
          <LabelValue label="Questions" value={data.questionCount || data.questions?.length || 0} />
          <PrimaryButton label="Start Attempt" onPress={handleStartAttempt} variant="ghost" />
        </Card>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
    marginBottom: spacing.xs,
  },
});
