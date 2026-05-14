import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: SPACE.xs,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  icon: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tooltip: {
    position: 'relative',
  },
  tooltipText: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontSize: SIZE.xs,
    fontFamily: FONTS.mono,
    whiteSpace: 'nowrap',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease',
    marginBottom: SPACE.xs,
    border: `1px solid ${COLORS.border}`,
    zIndex: 1000,
  },
  tooltipVisible: {
    opacity: 1,
  },
};

function getConfidenceData(confidence) {
  switch (confidence?.toLowerCase()) {
    case 'high':
      return {
        color: COLORS.success,
        bgColor: `${COLORS.success}20`,
        borderColor: `${COLORS.success}40`,
        icon: 'high',
        description: 'High confidence in AI assessment'
      };
    case 'medium':
      return {
        color: COLORS.diffMedium,
        bgColor: `${COLORS.diffMedium}20`,
        borderColor: `${COLORS.diffMedium}40`,
        icon: 'med',
        description: 'Medium confidence in AI assessment'
      };
    case 'low':
      return {
        color: COLORS.diffHard,
        bgColor: `${COLORS.diffHard}20`,
        borderColor: `${COLORS.diffHard}40`,
        icon: 'low',
        description: 'Low confidence in AI assessment'
      };
    default:
      return {
        color: COLORS.muted,
        bgColor: `${COLORS.muted}20`,
        borderColor: `${COLORS.muted}40`,
        icon: '?',
        description: 'Confidence level not available'
      };
  }
}

function getConfidenceIcon(confidence) {
  switch (confidence?.toLowerCase()) {
    case 'high': return '!';
    case 'medium': return '~';
    case 'low': return '?';
    default: return '-';
  }
}

export default function ConfidenceIndicator({ 
  confidence, 
  showText = true, 
  showTooltip = true,
  style = {}
}) {
  const confidenceData = getConfidenceData(confidence);
  const icon = getConfidenceIcon(confidence);

  return (
    <div 
      style={{
        ...styles.container,
        backgroundColor: confidenceData.bgColor,
        border: `1px solid ${confidenceData.borderColor}`,
        color: confidenceData.color,
        ...style
      }}
      className={showTooltip ? styles.tooltip : ''}
      onMouseEnter={(e) => {
        if (showTooltip) {
          const tooltip = e.currentTarget.querySelector('[data-tooltip]');
          if (tooltip) {
            tooltip.classList.add(styles.tooltipVisible);
          }
        }
      }}
      onMouseLeave={(e) => {
        if (showTooltip) {
          const tooltip = e.currentTarget.querySelector('[data-tooltip]');
          if (tooltip) {
            tooltip.classList.remove(styles.tooltipVisible);
          }
        }
      }}
    >
      <div 
        style={{
          ...styles.icon,
          backgroundColor: confidenceData.color
        }}
      >
        {icon}
      </div>
      
      {showText && (
        <span style={styles.text}>
          {confidence || 'unknown'}
        </span>
      )}
      
      {showTooltip && (
        <div 
          data-tooltip
          style={styles.tooltipText}
        >
          {confidenceData.description}
        </div>
      )}
    </div>
  );
}
