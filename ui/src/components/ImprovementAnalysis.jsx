import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.lg,
    marginBottom: SPACE.lg,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACE.lg,
  },
  improvementSummary: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: SPACE.xl,
    textAlign: 'center',
  },
  scoreImprovement: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  improvementValue: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xl,
    fontWeight: 700,
    marginBottom: SPACE.xs,
  },
  improvementLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    marginBottom: SPACE.xs,
  },
  improvementLevel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  percentageImprovement: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  detailedAnalysis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACE.lg,
    marginBottom: SPACE.xl,
  },
  analysisItem: {
    backgroundColor: COLORS.bg,
    padding: SPACE.md,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
  },
  analysisTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  qualityComparison: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  qualityOriginal: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  qualityArrow: {
    color: COLORS.muted,
  },
  qualityNew: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
  improvedBadge: {
    backgroundColor: COLORS.success,
    color: COLORS.bg,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
  },
  strengthChange: {
    display: 'flex',
    flexDirection: 'column',
  },
  strengthValue: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
  },
  changeLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  priorityChange: {
    display: 'flex',
    flexDirection: 'column',
  },
  timeGap: {
    display: 'flex',
    flexDirection: 'column',
  },
  recommendation: {
    backgroundColor: `${COLORS.accent}10`,
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 6,
    padding: SPACE.md,
  },
  recommendationTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  recommendationText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontStyle: 'italic',
    color: COLORS.text,
    margin: 0,
  },
  excellent: { color: COLORS.success },
  good: { color: COLORS.diffEasy },
  slight: { color: COLORS.diffMedium },
  none: { color: COLORS.error },
};

function getImprovementLevel(improvement) {
  if (improvement >= 20) return { level: 'excellent', color: styles.excellent };
  if (improvement >= 10) return { level: 'good', color: styles.good };
  if (improvement >= 0) return { level: 'slight', color: styles.slight };
  return { level: 'none', color: styles.none };
}

function getQualityStyle(quality) {
  switch (quality?.toLowerCase()) {
    case 'easy': return styles.qualityEasy;
    case 'good': return styles.qualityGood;
    case 'hard': return styles.qualityHard;
    case 'again': return styles.qualityAgain;
    case 'fail': return styles.qualityFail;
    default: return styles.qualityGood;
  }
}

export default function ImprovementAnalysis({ analysis, originalTest, newTest }) {
  if (!analysis) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Improvement Analysis</h3>
        <div style={{ textAlign: 'center', color: COLORS.muted, fontFamily: FONTS.mono, fontSize: SIZE.sm }}>
          No improvement data available
        </div>
      </div>
    );
  }

  const improvementLevel = getImprovementLevel(analysis.scoreImprovement);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Improvement Analysis</h3>
      
      <div style={styles.improvementSummary}>
        <div style={styles.scoreImprovement}>
          <div style={{ ...styles.improvementValue, ...improvementLevel.color }}>
            +{analysis.scoreImprovement}%
          </div>
          <div style={styles.improvementLabel}>Score Improvement</div>
          <div style={styles.improvementLevel}>{improvementLevel.level}</div>
        </div>
        
        <div style={styles.percentageImprovement}>
          <div style={styles.improvementValue}>
            +{analysis.scoreImprovementPercent}%
          </div>
          <div style={styles.improvementLabel}>Relative Improvement</div>
        </div>
      </div>
      
      <div style={styles.detailedAnalysis}>
        <div style={styles.analysisItem}>
          <h4 style={styles.analysisTitle}>Recall Quality</h4>
          <div style={styles.qualityComparison}>
            <span style={styles.qualityOriginal}>{originalTest.recallQuality}</span>
            <span style={styles.qualityArrow}>{'->'}</span>
            <span style={styles.qualityNew}>{newTest.recallQuality}</span>
            {analysis.recallQualityImproved && (
              <span style={styles.improvedBadge}>Improved</span>
            )}
          </div>
        </div>
        
        <div style={styles.analysisItem}>
          <h4 style={styles.analysisTitle}>Retention Strength</h4>
          <div style={styles.strengthChange}>
            <span style={styles.strengthValue}>+{analysis.retentionStrengthChange.toFixed(2)}</span>
            <span style={styles.changeLabel}>strength gained</span>
          </div>
        </div>
        
        <div style={styles.analysisItem}>
          <h4 style={styles.analysisTitle}>Priority Score</h4>
          <div style={styles.priorityChange}>
            <span style={styles.strengthValue}>
              {analysis.priorityScoreChange > 0 ? '+' : ''}{analysis.priorityScoreChange}
            </span>
            <span style={styles.changeLabel}>priority change</span>
          </div>
        </div>
        
        <div style={styles.analysisItem}>
          <h4 style={styles.analysisTitle}>Time Since Original</h4>
          <div style={styles.timeGap}>
            <span style={styles.strengthValue}>{analysis.timeSinceOriginal}</span>
            <span style={styles.changeLabel}>days between tests</span>
          </div>
        </div>
      </div>
      
      <div style={styles.recommendation}>
        <h4 style={styles.recommendationTitle}>Recommendation</h4>
        <p style={styles.recommendationText}>{analysis.recommendation}</p>
      </div>
    </div>
  );
}
