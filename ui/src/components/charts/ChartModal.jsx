import { useCallback, useEffect, useRef, useState } from 'react';
import { COLORS, FONTS, SPACE, SIZE } from '../../constants';
import ChartRenderer from './ChartRenderer';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'min(4vw, 24px)',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    boxSizing: 'border-box',
  },
  dialog: {
    width: '95vw',
    height: '90vh',
    maxWidth: 1600,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    boxShadow: '0 32px 96px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACE.md,
    padding: `${SPACE.md}px ${SPACE.lg}px`,
    borderBottom: `1px solid ${COLORS.border}`,
    flexShrink: 0,
    backgroundColor: COLORS.bg,
  },
  headerMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
    lineHeight: 1.2,
  },
  purpose: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.accent,
    backgroundColor: `color-mix(in srgb, ${COLORS.accent} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${COLORS.accent} 30%, transparent)`,
    borderRadius: 4,
    padding: '2px 8px',
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
    flexShrink: 0,
  },
  closeBtn: {
    width: 34,
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    cursor: 'pointer',
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    lineHeight: 1,
    padding: 0,
    transition: 'border-color 120ms ease, background-color 120ms ease',
  },
  hint: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    userSelect: 'none',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: SPACE.lg,
  },
};

export default function ChartModal({ chart, onClose }) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timerRef = useRef(null);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timerRef.current = window.setTimeout(() => {
      closingRef.current = false;
      setClosing(false);
      onClose();
    }, 170);
  }, [onClose]);

  useEffect(() => {
    if (!chart) return undefined;
    closingRef.current = false;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);

    // Trigger resize so chart SVGs recompute
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chart, requestClose]);

  if (!chart) return null;

  return (
    <div
      className={`analytics-modal-overlay${closing ? ' analytics-modal-closing' : ''}`}
      style={styles.overlay}
      onMouseDown={requestClose}
    >
      <div
        className={`analytics-modal${closing ? ' analytics-modal-closing' : ''}`}
        style={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${chart.id}-modal-title`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div style={styles.headerMeta}>
            <h2 id={`${chart.id}-modal-title`} style={styles.title}>{chart.title}</h2>
            <div style={styles.purpose}>{chart.purpose}</div>
            <div style={styles.badge}>
              <span>⛶</span>
              <span>Fullscreen</span>
            </div>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.hint}>ESC to close</span>
            <button
              type="button"
              aria-label="Close fullscreen chart"
              title="Close (Esc)"
              style={styles.closeBtn}
              onClick={requestClose}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={styles.body}>
          <ChartRenderer chart={chart} fullscreen />
        </div>
      </div>
    </div>
  );
}
