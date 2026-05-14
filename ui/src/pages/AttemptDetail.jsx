import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttemptById, submitAttempt, remarkAttempt } from '../api/attempts';
import { getTestById } from '../api/tests';
import { submitTest as submitSpacedRepetitionTest } from '../api/spacedRepetition';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import AIScoreBadge from '../components/AIScoreBadge';
import ConfidenceIndicator from '../components/ConfidenceIndicator';
import AICritiquesSection from '../components/AICritiquesSection';
import RemarkButton from '../components/RemarkButton';
import NoteBreakdown from '../components/NoteBreakdown';
import { COLORS, FONTS, SPACE, SIZE, LABELS } from '../constants';

const styles = {
  container: {
    padding: `${SPACE.lg}px`,
  },
  breadcrumb: {
    display: 'block',
    marginBottom: SPACE.lg,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    textDecoration: 'none',
  },
  header: {
    marginBottom: SPACE.xl,
    paddingBottom: SPACE.md,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
    marginBottom: SPACE.sm,
  },
  domain: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.lg,
    color: COLORS.text,
  },
  score: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xl,
    color: COLORS.accent,
    fontWeight: 500,
  },
  date: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  questionCard: {
    marginBottom: SPACE.lg,
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  questionText: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  textarea: {
    width: '100%',
    minHeight: 80,
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: SPACE.sm,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    outline: 'none',
    resize: 'vertical',
    marginBottom: SPACE.sm,
  },
  timer: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  answerSection: {
    marginTop: SPACE.md,
    paddingTop: SPACE.md,
    borderTop: `1px solid ${COLORS.border}`,
  },
  answerLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  answerText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACE.sm,
    padding: SPACE.sm,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
  },
  modelAnswer: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginBottom: SPACE.sm,
    padding: SPACE.sm,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
  },
  timeTaken: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  correctIndicator: {
    display: 'inline-block',
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
    marginBottom: SPACE.sm,
  },
  correct: {
    backgroundColor: COLORS.success,
    color: COLORS.bg,
  },
  incorrect: {
    backgroundColor: COLORS.error,
    color: COLORS.bg,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 8,
    padding: `${SPACE.md}px ${SPACE.lg}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    padding: SPACE.md,
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    cursor: 'pointer',
    marginTop: SPACE.sm,
  },
  critiqueSection: {
    marginTop: SPACE.md,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
  },
  critiqueHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.sm,
  },
  confidenceBadge: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
  },
  confidenceHigh: {
    backgroundColor: COLORS.success,
    color: COLORS.bg,
  },
  confidenceMedium: {
    backgroundColor: COLORS.diffMedium,
    color: COLORS.bg,
  },
  confidenceLow: {
    backgroundColor: COLORS.muted,
    color: COLORS.bg,
  },
  critiqueTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  critiqueText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACE.sm,
    lineHeight: 1.5,
  },
  studyRecommendations: {
    marginTop: SPACE.xl,
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `2px solid ${COLORS.accent}`,
    borderRadius: 8,
  },
  studyTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.lg,
    fontWeight: 500,
    color: COLORS.accent,
    marginBottom: SPACE.md,
  },
  studySection: {
    marginBottom: SPACE.md,
  },
  studySectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.sm,
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
  testInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
    marginBottom: SPACE.md,
  },
  testInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  testInfoLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    minWidth: 80,
  },
  testInfoValue: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
};

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getConfidenceStyle(confidence) {
  switch (confidence?.toLowerCase()) {
    case 'high':
      return { ...styles.confidenceBadge, ...styles.confidenceHigh };
    case 'medium':
      return { ...styles.confidenceBadge, ...styles.confidenceMedium };
    case 'low':
      return { ...styles.confidenceBadge, ...styles.confidenceLow };
    default:
      return { ...styles.confidenceBadge, ...styles.confidenceMedium };
  }
}

function renderCritique(critique, questionIndex) {
  if (!critique) return null;
  
  return (
    <div key={`critique-${questionIndex}`} style={styles.critiqueSection}>
      <div style={styles.critiqueHeader}>
        <div style={styles.critiqueTitle}>AI Feedback</div>
        <div style={getConfidenceStyle(critique.confidence)}>
          {critique.confidence || 'medium'} confidence
        </div>
      </div>
      
      <div style={styles.critiqueTitle}>Feedback:</div>
      <div style={styles.critiqueText}>{critique.critique}</div>
      
      <div style={styles.critiqueTitle}>Explanation:</div>
      <div style={styles.critiqueText}>{critique.explanation}</div>
      
      <div style={styles.critiqueTitle}>How to Improve:</div>
      <div style={styles.critiqueText}>{critique.improvement}</div>
    </div>
  );
}

function renderStudyRecommendations(critiques) {
  if (!critiques) return null;
  
  const { overallWeaknesses, studyRecommendations, strengths } = critiques;
  
  if (!overallWeaknesses?.length && !studyRecommendations?.length && !strengths?.length) {
    return null;
  }
  
  return (
    <div style={styles.studyRecommendations}>
      <div style={styles.studyTitle}>Personalized Study Plan</div>
      
      {overallWeaknesses?.length > 0 && (
        <div style={styles.studySection}>
          <div style={styles.studySectionTitle}>Areas to Focus On:</div>
          <ul style={styles.studyList}>
            {overallWeaknesses.map((weakness, index) => (
              <li key={`weakness-${index}`} style={styles.studyListItem}>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {studyRecommendations?.length > 0 && (
        <div style={styles.studySection}>
          <div style={styles.studySectionTitle}>Study Recommendations:</div>
          <ul style={styles.studyList}>
            {studyRecommendations.map((rec, index) => (
              <li key={`rec-${index}`} style={styles.studyListItem}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {strengths?.length > 0 && (
        <div style={styles.studySection}>
          <div style={styles.studySectionTitle}>Your Strengths:</div>
          <ul style={styles.studyList}>
            {strengths.map((strength, index) => (
              <li key={`strength-${index}`} style={styles.studyListItem}>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AttemptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [answers, setAnswers] = useState({});
  const [timings, setTimings] = useState({});
  const [activeQ, setActiveQ] = useState(null);

  const { data: attempt, isLoading, error, refetch } = useQuery({
    queryKey: ['attempts', id],
    queryFn: () => getAttemptById(id),
    onSuccess: (data) => {
      console.log('Attempt query updated with data:', data);
      console.log('New score:', data?.score);
      console.log('New perQuestionResults:', data?.perQuestionResults);
      console.log('Has AI scoring:', data?.perQuestionResults?.q0?.aiScore !== undefined);
    },
  });

  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['tests', attempt?.testId],
    queryFn: () => getTestById(attempt?.testId),
    enabled: !!attempt?.testId,
  });

  // Fetch note-level SR stats after a completed attempt so we can show the breakdown.
  // We query /api/review-due and index by noteId for fast lookup.
  const { data: reviewDueData } = useQuery({
    queryKey: ['review-due-notes-for-attempt', attempt?.testId],
    queryFn: () => import('../api/client').then(m => m.get('/api/review-due')),
    enabled: !!(attempt?.status === 'completed' && attempt?.testId),
    retry: (count, err) => {
      if (/404|500|Not Found|Internal Server/.test(err?.message ?? '')) return false;
      return count < 2;
    },
  });

  // Build noteId → stats map from the flat review-due response
  const noteStatsMap = (() => {
    const items = Array.isArray(reviewDueData)
      ? reviewDueData
      : (reviewDueData?.items ?? reviewDueData?.due ?? []);
    const map = {};
    items.forEach((item) => {
      if (item.entityType === 'note' && item.noteId) {
        map[item.noteId] = item;
      }
    });
    return map;
  })();
  
  // Debug test query
  console.log('TestId from attempt:', attempt?.testId);
  console.log('Test query enabled:', !!attempt?.testId);
  console.log('Test loading:', testLoading);
  console.log('Test data:', test);
  console.log('Test data keys:', test ? Object.keys(test) : 'no test');
  console.log('Test questions:', test?.shortAnswerQuestions);
  console.log('Test questions length:', test?.shortAnswerQuestions?.length);
  if (test?.shortAnswerQuestions?.length > 0) {
    console.log('First question structure:', test.shortAnswerQuestions[0]);
    console.log('First question keys:', Object.keys(test.shortAnswerQuestions[0]));
  }

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      // Submit attempt first
      const attemptResult = await submitAttempt(payload);
      
      // If attempt submission is successful and has AI scoring, submit to both spaced repetition systems
      if (attemptResult && attemptResult.scorePercent !== undefined) {
        const basePayload = {
          scorePercent: attemptResult.scorePercent,
          totalQuestions: attemptResult.totalQuestions || Object.keys(payload.answers).length,
          correctAnswers: attemptResult.correctAnswers || 0,
          avgTimePerQuestion: Math.round(Object.values(payload.timings || {}).reduce((a, b) => a + b, 0) / Object.keys(payload.answers || {}).length) || 0
        };

        // Try to submit to original spaced repetition system
        try {
          const spacedRepetitionPayload = {
            domainId: attempt?.testDomain || 'general',
            sectionId: attempt?.testSection || 'general',
            materialId: payload.testId,
            ...basePayload
          };
          
          console.log('Submitting to spaced repetition:', spacedRepetitionPayload);
          await submitSpacedRepetitionTest(spacedRepetitionPayload);
          console.log('Spaced repetition submission successful');
        } catch (srError) {
          console.log('Spaced repetition submission error:', srError);
          if (srError?.message?.includes('404') || srError?.message?.includes('Not Found') ||
              srError?.message?.includes('500') || srError?.message?.includes('Internal Server Error')) {
            console.log('Spaced repetition API not available yet - skipping submission');
          } else {
            console.error('Failed to submit to spaced repetition:', srError);
          }
        }

        // Generated tests are already submitted through UnifiedTestService.
        // The vault-learning endpoint is reserved for a single Obsidian card id,
        // so do not send generated test ids there.
      }
      
      return attemptResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attempts', id]);
      // Also invalidate both spaced repetition query systems
      queryClient.invalidateQueries(['spaced-repetition-stats']);
      queryClient.invalidateQueries(['spaced-repetition-schedule']);
      queryClient.invalidateQueries(['vault-review-schedule']);
      queryClient.invalidateQueries(['vault-stats']);
    },
  });

  const remarkMutation = useMutation({
    mutationFn: remarkAttempt,
    onSuccess: (data) => {
      console.log('Remark API Response:', data);
      console.log('Response data structure:', JSON.stringify(data, null, 2));
      console.log('Score from response:', data?.score);
      console.log('Original score:', data?.originalScore);
      console.log('Score change:', data?.scoreChange);
      console.log('Per question results:', data?.perQuestionResults);
      
      queryClient.invalidateQueries(['attempts', id]);
      console.log('Invalidated queries for attempts:', id);
    },
    onError: (error) => {
      console.error('Failed to re-mark attempt:', error);
      console.error('Error details:', error.message);
    },
  });

  // Timer effect for active question
  useEffect(() => {
    if (activeQ === null) return;
    
    const intervalId = setInterval(() => {
      setTimings(prev => ({
        ...prev,
        [`q${activeQ}`]: (prev[`q${activeQ}`] ?? 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeQ]);

  const isCompleted = attempt && attempt.status === 'completed';
  
  // Debug logging
  console.log('Full attempt data:', attempt);
  console.log('Test data:', attempt?.test);
  console.log('Questions:', attempt?.test?.questions);

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [`q${questionIndex}`]: value,
    }));
  };

  const handleQuestionFocus = (index) => {
    setActiveQ(index);
  };

  const handleQuestionBlur = () => {
    setActiveQ(null);
  };

  const handleSubmit = () => {
    const payload = {
      attemptId: id,
      testId: attempt.testId,
      answers,
      timings,
    };
    submitMutation.mutate(payload);
  };

  const handleRemark = (attemptId) => {
    remarkMutation.mutate(attemptId);
  };

  // Helper functions to detect AI scoring
  const hasAIScoring = attempt?.perQuestionResults?.q0?.aiScore !== undefined;
  const needsRemarking = !hasAIScoring && isCompleted;
  const hasBeenRemarked = (attempt?.remarkCount || 0) > 0;
  const scoreImprovement = attempt?.isResubmission && attempt?.originalScore != null
    ? (attempt.scorePercent - attempt.originalScore)
    : null;

  if (error) {
    return (
      <div style={styles.container}>
        <Link to="/attempts" style={styles.breadcrumb}>
          {LABELS.attempts.backLink}
        </Link>
        <div style={styles.errorContainer}>
          <div>{LABELS.error.generic}</div>
          <button style={styles.retryButton} onClick={() => refetch()}>
            {LABELS.error.retry}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <Link to="/attempts" style={styles.breadcrumb}>
          {LABELS.attempts.backLink}
        </Link>
        <Skeleton count={5} height={120} />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div style={styles.container}>
        <Link to="/attempts" style={styles.breadcrumb}>
          {LABELS.attempts.backLink}
        </Link>
        <div style={styles.errorContainer}>
          Attempt not found
        </div>
      </div>
    );
  }

  // State A: In Progress (interactive test-taking)
  if (!isCompleted) {
    return (
      <div style={styles.container}>
        <Link to="/attempts" style={styles.breadcrumb}>
          {LABELS.attempts.backLink}
        </Link>

        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <div style={styles.domain}>Test: {attempt.name || attempt.testName || test?.name || test?.domain?.name || test?.domain}</div>
            <Badge difficulty={attempt.testDifficulty || test?.difficulty} />
          </div>
          
          {/* Detailed test information */}
          <div style={styles.testInfo}>
            {(attempt.testTopic || test?.domain?.name || test?.domain) && (
              <div style={styles.testInfoRow}>
                <div style={styles.testInfoLabel}>Topic:</div>
                <div style={styles.testInfoValue}>{attempt.testTopic || test?.domain?.name || test?.domain}</div>
              </div>
            )}
            {(attempt.testDomain || test?.domain?.name || test?.domain) && (
              <div style={styles.testInfoRow}>
                <div style={styles.testInfoLabel}>Domain:</div>
                <div style={styles.testInfoValue}>{attempt.testDomain || test?.domain?.name || test?.domain}</div>
              </div>
            )}
            {attempt.testSection && (
              <div style={styles.testInfoRow}>
                <div style={styles.testInfoLabel}>Section:</div>
                <div style={styles.testInfoValue}>{attempt.testSection}</div>
              </div>
            )}
          </div>
        </div>

        {test?.questions?.map((question, index) => (
          <div key={index} style={styles.questionCard}>
            <div style={styles.questionText}>
              Q{index + 1}. {question.question}
            </div>
            
            <textarea
              placeholder="Type your answer here..."
              value={answers[`q${index}`] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              onFocus={() => handleQuestionFocus(index)}
              onBlur={handleQuestionBlur}
              style={styles.textarea}
            />
            
            <div style={styles.timer}>
              {LABELS.attempts.timeTaken}: {formatTime(timings[`q${index}`] || 0)}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={submitMutation.isLoading}
          style={{
            ...styles.submitButton,
            ...(submitMutation.isLoading ? styles.submitButtonDisabled : {}),
          }}
        >
          {submitMutation.isLoading ? LABELS.attempts.submitting : LABELS.attempts.submit}
        </button>
      </div>
    );
  }

  // State B: Completed (results view)
  return (
    <div style={styles.container}>
      <Link to="/attempts" style={styles.breadcrumb}>
        {LABELS.attempts.backLink}
      </Link>

      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.domain}>Test: {attempt.name || attempt.testName || test?.name || test?.domain?.name || test?.domain}</div>
          <Badge difficulty={attempt.testDifficulty || test?.difficulty} />
        </div>
        
        {/* Detailed test information */}
        <div style={styles.testInfo}>
          {(attempt.testTopic || test?.domain?.name || test?.domain) && (
            <div style={styles.testInfoRow}>
              <div style={styles.testInfoLabel}>Topic:</div>
              <div style={styles.testInfoValue}>{attempt.testTopic || test?.domain?.name || test?.domain}</div>
            </div>
          )}
          {(attempt.testDomain || test?.domain?.name || test?.domain) && (
            <div style={styles.testInfoRow}>
              <div style={styles.testInfoLabel}>Domain:</div>
              <div style={styles.testInfoValue}>{attempt.testDomain || test?.domain?.name || test?.domain}</div>
            </div>
          )}
          {attempt.testSection && (
            <div style={styles.testInfoRow}>
              <div style={styles.testInfoLabel}>Section:</div>
              <div style={styles.testInfoValue}>{attempt.testSection}</div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.md }}>
          {hasAIScoring ? (
            <AIScoreBadge 
              score={attempt.scorePercent} 
              confidence={attempt.perQuestionResults?.q0?.confidence}
              improvement={scoreImprovement}
            />
          ) : (
            <div style={styles.score}>
              Score: {attempt.scorePercent} / {attempt.totalQuestions}
            </div>
          )}
          
          {needsRemarking && (
            <RemarkButton
              attemptId={id}
              onRemark={handleRemark}
              isLoading={remarkMutation.isLoading}
              hasBeenRemarked={hasBeenRemarked}
              scoreImprovement={scoreImprovement}
              remarkCount={attempt.remarkCount}
            />
          )}
        </div>
        <div style={styles.date}>
          {formatDate(attempt.submittedAt || attempt.updatedAt)}
          {hasBeenRemarked && (
            <span style={{ marginLeft: SPACE.sm, color: COLORS.muted }}>
              (Re-marked {attempt.remarkCount} time{attempt.remarkCount > 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      {test?.questions?.map((question, index) => {
        const questionId = `q${index}`;
        const questionResult = attempt.perQuestionResults?.[questionId];
        const hasAIData = questionResult?.aiScore !== undefined;
        
        return (
          <div key={index} style={styles.questionCard}>
            <div style={styles.questionText}>
              Q{index + 1}. {question.question}
            </div>
            
            <div style={styles.answerSection}>
              <div style={styles.answerLabel}>{LABELS.attempts.yourAnswer}:</div>
              <div style={styles.answerText}>
                {attempt.answers?.[questionId] || 'No answer provided'}
              </div>
              
              <div style={styles.answerLabel}>{LABELS.attempts.modelAnswer}:</div>
              <div style={styles.modelAnswer}>
                {questionResult?.expectedAnswer || question.answer}
              </div>
              
              <div style={styles.timeTaken}>
                {LABELS.attempts.timeTaken}: {formatTime(attempt.timings?.[questionId] || 0)}
              </div>
              
              {/* AI Score Display */}
              {hasAIData && (
                <div style={{ marginTop: SPACE.sm, marginBottom: SPACE.sm }}>
                  <AIScoreBadge 
                    score={questionResult.aiScore} 
                    confidence={questionResult.confidence}
                    showGrade={true}
                  />
                </div>
              )}
              
              {/* Fallback to basic correct/incorrect for non-AI attempts */}
              {!hasAIData && questionResult?.correct !== undefined && (
                <div style={{
                  ...styles.correctIndicator,
                  ...(questionResult.correct ? styles.correct : styles.incorrect),
                }}>
                  {questionResult.correct ? 'CORRECT' : 'INCORRECT'}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* AI Critiques Section */}
      <AICritiquesSection 
        critiques={attempt.critiques} 
        perQuestionResults={attempt.perQuestionResults}
      />

      {/* Per-note breakdown — which notes this test was drawn from and their SR stats */}
      {test?.sourceNotes && test.sourceNotes.length > 0 && (
        <NoteBreakdown
          sourceNotes={test.sourceNotes}
          noteStats={noteStatsMap}
        />
      )}
    </div>
  );
}
