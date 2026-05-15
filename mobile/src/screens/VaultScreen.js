import { StyleSheet, Text } from 'react-native';
import { Card, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getDomains } from '../api/vault';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, typography } from '../theme';
import { asList, itemTitle } from './shared';
import VaultSearchBar from './VaultSearchBar';

export default function VaultScreen({ navigation }) {
  const { data, error, loading, refresh } = useAsyncData(getDomains, []);
  const domains = asList(data);

  return (
    <ScreenScaffold
      eyebrow="Vault"
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle="Browse study domains backed by your GitHub vault."
      title="Vault"
    >
      <VaultSearchBar onPress={() => navigation.navigate('VaultSearch')} />

      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Vault unavailable" />
      ) : domains.length === 0 ? (
        <StateBlock message="No vault domains were returned by the backend." title="No domains found" />
      ) : (
        domains.map((domain) => {
          const name = itemTitle(domain);
          return (
            <Card
              key={name}
              onPress={() => navigation.navigate('VaultSections', { domain: name })}
            >
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.meta}>Study domain  →</Text>
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
