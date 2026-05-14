import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Card, LabelValue, PrimaryButton, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { generateTest } from '../api/tests';
import { colors, fonts, spacing, typography } from '../theme';

export default function GenerateTestScreen({ navigation }) {
  const [error, setError] = useState(null);
  const [generatedTest, setGeneratedTest] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setGeneratedTest(null);

    try {
      const test = await generateTest({ difficulty: 'mixed', questionCount: 10 });
      setGeneratedTest(test);
    } catch (requestError) {
      setError(requestError.message || 'Could not generate a test.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenScaffold
      eyebrow="Tests"
      subtitle="Start with a backend-generated mixed practice test."
      title="Generate Test"
      actions={<PrimaryButton disabled={loading} label={loading ? 'Generating...' : 'Generate'} onPress={handleGenerate} />}
    >
      <Card>
        <Text style={styles.title}>Default test setup</Text>
        <LabelValue label="Difficulty" value="Mixed" />
        <LabelValue label="Questions" value="10" />
      </Card>

      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={handleGenerate} title="Generation unavailable" />
      ) : null}

      {generatedTest ? (
        <Card>
          <Text style={styles.title}>{generatedTest.name || generatedTest.title || 'Generated test'}</Text>
          <Text style={styles.body}>The test was created successfully.</Text>
          <PrimaryButton
            label="Open Test"
            onPress={() => navigation.navigate('TestDetail', { testId: generatedTest.id })}
            variant="ghost"
          />
        </Card>
      ) : (
        <StateBlock
          message="If the backend is offline, this screen will show an error instead of crashing."
          title="Ready to generate"
        />
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
});
