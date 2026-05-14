import { useState } from 'react';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: SPACE.xs,
  },
  button: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 6,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  buttonDisabled: {
    backgroundColor: COLORS.muted,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  buttonHover: {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 8px ${COLORS.accent}30`,
  },
  buttonText: {
    flex: 1,
  },
  statusText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textAlign: 'center',
  },
  improvementBadge: {
    backgroundColor: `${COLORS.success}20`,
    color: COLORS.success,
    border: `1px solid ${COLORS.success}40`,
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.xs}px`,
    fontSize: SIZE.xs,
    fontWeight: 500,
    marginLeft: SPACE.xs,
  },
  loadingSpinner: {
    width: 12,
    height: 12,
    border: `2px solid ${COLORS.bg}`,
    borderTop: `2px solid ${COLORS.muted}`,
    borderRadius: '50%',
    // Animation will be applied via inline style in the component
  },
  infoText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginTop: SPACE.xs,
  },
};

// Add CSS animation for spinner using a safe approach
const addSpinAnimation = () => {
  if (typeof document !== 'undefined' && !document.getElementById('remark-button-spin-animation')) {
    const style = document.createElement('style');
    style.id = 'remark-button-spin-animation';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
};

// Add animation when component module loads
if (typeof document !== 'undefined') {
  addSpinAnimation();
}

export default function RemarkButton({ 
  attemptId, 
  onRemark, 
  isLoading = false, 
  disabled = false,
  hasBeenRemarked = false,
  scoreImprovement = null,
  remarkCount = 0
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled && !isLoading && onRemark) {
      onRemark(attemptId);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (hasBeenRemarked) return 'Re-mark Again';
    return 'Upgrade with AI';
  };

  const getStatusText = () => {
    if (isLoading) return 'Analyzing your answers with AI...';
    if (hasBeenRemarked && remarkCount > 0) return `Re-marked ${remarkCount} time${remarkCount > 1 ? 's' : ''}`;
    if (disabled) return 'Already has AI scoring';
    return 'Get detailed AI feedback and fair scoring';
  };

  const getInfoText = () => {
    if (hasBeenRemarked && scoreImprovement !== null) {
      if (scoreImprovement > 0) {
        return `Previous re-mark improved score by ${scoreImprovement.toFixed(1)}%`;
      } else if (scoreImprovement < 0) {
        return `Previous re-mark changed score by ${scoreImprovement.toFixed(1)}%`;
      }
    }
    return 'Replace harsh 0% scores with fair AI-powered partial credit';
  };

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.button,
          ...(disabled || isLoading ? styles.buttonDisabled : {}),
          ...(isHovered && !disabled && !isLoading ? styles.buttonHover : {}),
        }}
        onClick={handleClick}
        disabled={disabled || isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isLoading && (
          <div style={{
            ...styles.loadingSpinner,
            // Use a simple CSS animation that works with inline styles
            animation: 'spin 1s linear infinite'
          }} />
        )}
        
        <span style={styles.buttonText}>
          {getButtonText()}
        </span>
        
        {hasBeenRemarked && scoreImprovement > 0 && (
          <div style={styles.improvementBadge}>
            +{scoreImprovement.toFixed(1)}%
          </div>
        )}
      </button>

      <div style={styles.statusText}>
        {getStatusText()}
      </div>

      {!hasBeenRemarked && (
        <div style={styles.infoText}>
          {getInfoText()}
        </div>
      )}
    </div>
  );
}
