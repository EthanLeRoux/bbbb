import { Text, StyleSheet } from 'react-native';
import { Card, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getDomains } from '../api/vault';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, typography } from '../theme';
import { asList, itemTitle } from './shared';

export default function VaultScreen() {
  const { data, error, loading, refresh } = useAsyncData(getDomains, []);
  const domains = asList(data);

  return (
    <ScreenScaffold
      eyebrow="Vault"
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle="Browse available study domains from the backend vault."
      title="Vault"
    >
      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Vault unavailable" />
      ) : domains.length === 0 ? (
        <StateBlock message="No vault domains were returned by the backend." title="No domains found" />
      ) : (
        domains.map((domain) => (
          <Card key={itemTitle(domain)}>
            <Text style={styles.title}>{itemTitle(domain)}</Text>
            <Text style={styles.meta}>Study domain</Text>
          </Card>
        ))
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.muted,
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
