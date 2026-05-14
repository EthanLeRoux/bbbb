import { Text, StyleSheet } from 'react-native';
import { Card, LabelValue, Refresh, ScreenScaffold, StateBlock } from '../components/ScreenScaffold';
import { getOverdueItems } from '../api/reviewSchedule';
import useAsyncData from '../hooks/useAsyncData';
import { colors, fonts, typography } from '../theme';
import { asList, itemTitle } from './shared';

export default function ReviewDueScreen() {
  const { data, error, loading, refresh } = useAsyncData(() => getOverdueItems({ limit: 25 }), []);
  const dueItems = asList(data);

  return (
    <ScreenScaffold
      eyebrow="Review"
      refreshControl={<Refresh loading={loading} onRefresh={refresh} />}
      subtitle="Due and overdue concepts for spaced review."
      title="Review Due"
    >
      {loading || error ? (
        <StateBlock error={error} loading={loading} onAction={refresh} title="Review queue unavailable" />
      ) : dueItems.length === 0 ? (
        <StateBlock message="No review items are due right now." title="All caught up" />
      ) : (
        dueItems.map((item, index) => (
          <Card key={item.id || `${itemTitle(item)}-${index}`}>
            <Text style={styles.title}>{itemTitle(item, 'Review item')}</Text>
            <LabelValue label="Priority" value={item.priority ?? item.score ?? 'Normal'} />
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
