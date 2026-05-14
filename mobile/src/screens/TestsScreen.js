import { Text, StyleSheet } from 'react-native';
import { Card, LabelValue, PrimaryButton, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getTests } from '../api/tests';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, typography } from '../theme';
import { asList, formatDate, itemTitle } from './shared';

export default function TestsScreen({ navigation }) {
  const { data, error, loading, refresh } = useAsyncData(() => getTests({ limit: 50 }), []);
  const tests = asList(data);

  return (
    <ScreenScaffold
      eyebrow="Library"
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle="All generated tests and routes into attempts."
      title="Tests"
      actions={<PrimaryButton label="Generate" onPress={() => navigation.navigate('GenerateTest')} />}
    >
      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Tests unavailable" />
      ) : tests.length === 0 ? (
        <StateBlock message="No tests yet. Generate a test to populate this list." title="No tests yet" />
      ) : (
        tests.map((test) => (
          <Card key={test.id || itemTitle(test)} onPress={() => navigation.navigate('TestDetail', { testId: test.id })}>
            <Text style={styles.title}>{itemTitle(test, 'Untitled test')}</Text>
            <LabelValue label="Created" value={formatDate(test.createdAt || test.created_at)} />
          </Card>
        ))
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
