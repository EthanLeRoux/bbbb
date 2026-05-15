import { useLayoutEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getSections } from '../api/vault';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, typography } from '../theme';
import { asList, itemTitle } from './shared';

export default function VaultSectionsScreen({ navigation, route }) {
  const { domain } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: domain });
  }, [navigation, domain]);

  const load = () => getSections(domain);
  const { data, error, loading, refresh } = useAsyncData(load, [domain]);

  // The endpoint returns the domain object which has a sections array
  let sections = [];
  if (Array.isArray(data)) {
    sections = data;
  } else if (Array.isArray(data?.sections)) {
    sections = data.sections;
  } else {
    sections = asList(data);
  }

  return (
    <ScreenScaffold
      eyebrow={domain}
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle="Select a section to browse topics and notes."
      title="Sections"
    >
      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Sections unavailable" />
      ) : sections.length === 0 ? (
        <StateBlock message="No sections found in this domain." title="No sections" />
      ) : (
        sections.map((section) => {
          const name = itemTitle(section);
          return (
            <Card
              key={name}
              onPress={() => navigation.navigate('VaultTopics', { domain, section: name })}
            >
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.meta}>Section  →</Text>
            </Card>
          );
        })
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: typography.caption,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: typography.subtitle,
  },
});
