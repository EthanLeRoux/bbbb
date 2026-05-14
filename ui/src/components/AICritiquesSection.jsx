import { COLORS, FONTS, SIZE, SPACE } from '../constants';
import ConfidenceIndicator from './ConfidenceIndicator';

const styles = {
  container: {
    marginTop: SPACE.lg,
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.md,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    fontWeight: 600,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACE.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  critiqueCard: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: SPACE.md,
    marginBottom: SPACE.sm,
  },
  questionText: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACE.xs,
    fontStyle: 'italic',
  },
  critiqueText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACE.sm,
    lineHeight: 1.5,
  },
  explanationText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    marginBottom: SPACE.sm,
    lineHeight: 1.4,
    paddingLeft: SPACE.md,
    borderLeft: `3px solid ${COLORS.accent}`,
  },
  improvementText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.accent,
    marginBottom: SPACE.sm,
    lineHeight: 1.4,
  },
  keyPointsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
    marginBottom: SPACE.sm,
  },
  keyPointsSection: {
    marginBottom: SPACE.sm,
  },
  keyPointsTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginBottom: SPACE.xs,
    textTransform: 'uppercase',
  },
  keyPointsList: {
    margin: 0,
    paddingLeft: SPACE.lg,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.text,
  },
  keyPointItem: {
    marginBottom: SPACE.xs,
    lineHeight: 1.4,
  },
  matched: {
    color: COLORS.success,
  },
  missed: {
    color: COLORS.diffHard,
  },
  studyRecommendations: {
    marginTop: SPACE.xl,
    padding: SPACE.lg,
    backgroundColor: `${COLORS.accent}10`,
    border: `2px solid ${COLORS.accent}40`,
    borderRadius: 8,
  },
  studyTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.lg,
    fontWeight: 600,
    color: COLORS.accent,
    marginBottom: SPACE.md,
  },
  studySection: {
    marginBottom: SPACE.md,
  },
  studyList: {
    margin: 0,
    paddingLeft: SPACE.lg,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
  studyListItem: {
    marginBottom: SPACE.xs,
    lineHeight: 1.4,
  },
  strengthsList: {
    color: COLORS.success,
  },
  weaknessesList: {
    color: COLORS.diffHard,
  },
  recommendationsList: {
    color: COLORS.accent,
  },
};

export default function AICritiquesSection({ critiques, perQuestionResults }) {
  if (!critiques && !perQuestionResults) {
    return null;
  }

  const hasPerQuestionCritiques = critiques?.perQuestionCritiques;
  const hasOverallCritiques = critiques?.overallWeaknesses || critiques?.studyRecommendations || critiques?.strengths;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>AI Feedback & Analysis</div>
      </div>

      {/* Per-Question Critiques */}
      {hasPerQuestionCritiques && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Question-by-Question Analysis</div>
          
          {Object.entries(critiques.perQuestionCritiques).map(([questionId, critique]) => {
            const questionResult = perQuestionResults?.[questionId];
            const hasAIData = questionResult?.aiScore !== undefined;
            
            return (
              <div key={questionId} style={styles.critiqueCard}>
                <div style={styles.questionText}>
                  Q{parseInt(questionId.slice(1)) + 1}. {critique.question}
                </div>
                
                {hasAIData && (
                  <div style={{ marginBottom: SPACE.sm }}>
                    <ConfidenceIndicator confidence={critique.confidence} />
                  </div>
                )}
                
                <div style={styles.critiqueText}>
                  <strong>Feedback:</strong> {critique.critique}
                </div>
                
                <div style={styles.explanationText}>
                  <strong>Explanation:</strong> {critique.explanation}
                </div>
                
                <div style={styles.improvementText}>
                  <strong>How to Improve:</strong> {critique.improvement}
                </div>

                {questionResult?.keyPointsMatched && (
                  <div style={styles.keyPointsContainer}>
                    {questionResult.keyPointsMatched.length > 0 && (
                      <div style={styles.keyPointsSection}>
                        <div style={styles.keyPointsTitle}>Key Points You Got Right</div>
                        <ul style={styles.keyPointsList}>
                          {questionResult.keyPointsMatched.map((point, index) => (
                            <li key={index} style={{...styles.keyPointItem, ...styles.matched}}>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {questionResult.keyPointsMissed && questionResult.keyPointsMissed.length > 0 && (
                      <div style={styles.keyPointsSection}>
                        <div style={styles.keyPointsTitle}>Key Points to Focus On</div>
                        <ul style={styles.keyPointsList}>
                          {questionResult.keyPointsMissed.map((point, index) => (
                            <li key={index} style={{...styles.keyPointItem, ...styles.missed}}>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overall Study Recommendations */}
      {hasOverallCritiques && (
        <div style={styles.studyRecommendations}>
          <div style={styles.studyTitle}>Personalized Study Plan</div>
          
          {critiques.overallWeaknesses && critiques.overallWeaknesses.length > 0 && (
            <div style={styles.studySection}>
              <div style={styles.sectionTitle}>Areas to Focus On</div>
              <ul style={{...styles.studyList, ...styles.weaknessesList}}>
                {critiques.overallWeaknesses.map((weakness, index) => (
                  <li key={index} style={styles.studyListItem}>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {critiques.studyRecommendations && critiques.studyRecommendations.length > 0 && (
            <div style={styles.studySection}>
              <div style={styles.sectionTitle}>Study Recommendations</div>
              <ul style={{...styles.studyList, ...styles.recommendationsList}}>
                {critiques.studyRecommendations.map((recommendation, index) => (
                  <li key={index} style={styles.studyListItem}>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {critiques.strengths && critiques.strengths.length > 0 && (
            <div style={styles.studySection}>
              <div style={styles.sectionTitle}>Your Strengths</div>
              <ul style={{...styles.studyList, ...styles.strengthsList}}>
                {critiques.strengths.map((strength, index) => (
                  <li key={index} style={styles.studyListItem}>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
