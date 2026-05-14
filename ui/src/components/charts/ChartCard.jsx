import { COLORS, FONTS, SPACE, SIZE } from '../../constants';
import ChartRenderer from './ChartRenderer';

const styles = {
  panel: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
    minHeight: 360,
    overflow: 'hidden',
    transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
  },
  panelCollapsed: {
    minHeight: 0,
  },
  panelWide: {
    gridColumn: '1 / -1',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACE.md,
    marginBottom: SPACE.md,
  },
  titleBlock: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    marginBottom: SPACE.xs,
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
  },
  purpose: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  actions: {
    display: 'flex',
    gap: SPACE.xs,
    flexShrink: 0,
  },
  btn: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    cursor: 'pointer',
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    transition: 'border-color 120ms ease, color 120ms ease',
  },
  iconBtn: {
    width: 32,
    height: 30,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: SIZE.md,
    lineHeight: 1,
    padding: 0,
  },
  clickTarget: {
    cursor: 'zoom-in',
    borderRadius: 6,
    outline: 'none',
  },
};

/**
 * ChartCard
 *
 * Props:
 *   chart        — chart config object { id, title, purpose, component, props, wide? }
 *   collapsed    — boolean
 *   onCollapse   — (id) => void
 *   onExpand     — (id) => void
 */
export default function ChartCard({ chart, collapsed, onCollapse, onExpand }) {
  const { id, title, purpose, wide } = chart;

  return (
    <section
      className="analytics-chart-card"
      style={{
        ...styles.panel,
        ...(wide ? styles.panelWide : {}),
        ...(collapsed ? styles.panelCollapsed : {}),
      }}
    >
      <div style={styles.headerRow}>
        <div style={styles.titleBlock}>
          <h2 style={styles.title}>{title}</h2>
          {!collapsed && <div style={styles.purpose}>{purpose}</div>}
        </div>
        <div style={styles.actions}>
          <button
            type="button"
            style={styles.btn}
            onClick={() => onCollapse(id)}
          >
            {collapsed ? 'Show' : 'Collapse'}
          </button>
          {!collapsed && (
            <button
              type="button"
              aria-label={`Open ${title} fullscreen`}
              title="Open fullscreen (Enter)"
              style={{ ...styles.btn, ...styles.iconBtn }}
              onClick={() => onExpand(id)}
            >
              ⛶
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div
          role="button"
          tabIndex={0}
          title={`Open ${title} fullscreen`}
          style={styles.clickTarget}
          onClick={() => onExpand(id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onExpand(id);
            }
          }}
        >
          <ChartRenderer chart={chart} />
        </div>
      )}
    </section>
  );
}
