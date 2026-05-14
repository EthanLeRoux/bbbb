import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: SPACE.xs,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 6,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  scoreText: {
    fontWeight: 'bold',
  },
  confidenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  improvementBadge: {
    fontSize: SIZE.xs,
    padding: `${SPACE.xs}px ${SPACE.xs}px`,
    borderRadius: 4,
    marginLeft: SPACE.xs,
    fontWeight: 500,
  },
};

function getScoreColor(score) {
  if (score >= 85) return COLORS.success;
  if (score >= 70) return COLORS.diffEasy;
  if (score >= 55) return COLORS.diffMedium;
  return COLORS.diffHard;
}

function getConfidenceColor(confidence) {
  switch (confidence?.toLowerCase()) {
    case 'high': return COLORS.success;
    case 'medium': return COLORS.diffMedium;
    case 'low': return COLORS.diffHard;
    default: return COLORS.muted;
  }
}

function getScoreGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default function AIScoreBadge({ 
   score, 
   confidence, 
   showConfidence = true, 
   showGrade = false,
   improvement = null,
   style = {}
 }) {
  // Handle undefined/null score
  if (score === undefined || score === null) {
    return (
      <div style={{
        ...styles.container,
        backgroundColor: `${COLORS.muted}20`,
        border: `1px solid ${COLORS.muted}40`,
        color: COLORS.muted,
        ...style
      }}>
        <span style={styles.scoreText}>--</span>
      </div>
    );
  }

  const scoreColor = getScoreColor(score);
  const confidenceColor = getConfidenceColor(confidence);
  const grade = getScoreGrade(score);

  return (
    <div style={{
      ...styles.container,
      backgroundColor: `${scoreColor}20`,
      border: `1px solid ${scoreColor}40`,
      color: scoreColor,
      ...style
    }}>
      <span style={styles.scoreText}>
        {score.toFixed(1)}%
        {showGrade && <span> ({grade})</span>}
      </span>
       
      {showConfidence && confidence && (
        <div 
          style={{
            ...styles.confidenceIndicator,
            backgroundColor: confidenceColor
          }}
          title={`Confidence: ${confidence}`}
        />
      )}
       
      {improvement !== null && improvement !== 0 && (
        <div style={{
          ...styles.improvementBadge,
          backgroundColor: improvement > 0 ? `${COLORS.success}20` : `${COLORS.diffHard}20`,
          color: improvement > 0 ? COLORS.success : COLORS.diffHard,
          border: `1px solid ${improvement > 0 ? COLORS.success : COLORS.diffHard}40`
        }}>
          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
