import { useState } from 'react';
import { SPACE } from '../../constants';
import ChartCard from './ChartCard';
import ChartModal from './ChartModal';

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
    gap: SPACE.lg,
  },
};

/**
 * ChartGrid
 *
 * Accepts a `charts` config array and renders all ChartCards plus the
 * shared ChartModal. Owns collapsed/expanded state so parent (Statistics)
 * stays clean.
 *
 * charts: Array<{
 *   id: string,
 *   title: string,
 *   purpose: string,
 *   component: React.ComponentType,
 *   props: object,
 *   fullscreenProps?: object,   // merged in only when fullscreen
 *   wide?: boolean,
 * }>
 */
export default function ChartGrid({ charts }) {
  const [collapsed, setCollapsed] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const toggleCollapse = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
    if (expandedId === id) setExpandedId(null);
  };

  const expandedChart = expandedId
    ? (() => {
        const base = charts.find((c) => c.id === expandedId);
        if (!base) return null;
        return {
          ...base,
          props: { ...base.props, ...(base.fullscreenProps || {}) },
        };
      })()
    : null;

  return (
    <>
      <div style={styles.grid}>
        {charts.map((chart) => (
          <ChartCard
            key={chart.id}
            chart={chart}
            collapsed={!!collapsed[chart.id]}
            onCollapse={toggleCollapse}
            onExpand={setExpandedId}
          />
        ))}
      </div>

      <ChartModal chart={expandedChart} onClose={() => setExpandedId(null)} />
    </>
  );
}
