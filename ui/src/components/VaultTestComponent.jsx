import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitVaultTest } from '../api/vaultSpacedRepetition';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    marginBottom: SPACE.lg,
  },
  header: {
    marginBottom: SPACE.lg,
    paddingBottom: SPACE.md,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    margin: 0,
  },
  form: {
    maxWidth: '500px',
  },
  formGroup: {
    marginBottom: SPACE.md,
  },
  label: {
    display: 'block',
    marginBottom: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
  },
  input: {
    width: '100%',
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: COLORS.accent,
  },
  autoCalc: {
    backgroundColor: `${COLORS.accent}10`,
    padding: SPACE.sm,
    borderRadius: 4,
    margin: `${SPACE.sm} 0`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 4,
    padding: `${SPACE.sm}px ${SPACE.lg}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    marginTop: SPACE.sm,
  },
  resultContainer: {
    padding: SPACE.lg,
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
  },
  resultTitle: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  resultSummary: {
    marginBottom: SPACE.lg,
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
  },
  resultLabel: {
    color: COLORS.muted,
  },
  resultValue: {
    fontWeight: 500,
    color: COLORS.text,
  },
  weakAreas: {
    marginBottom: SPACE.lg,
  },
  weakAreasTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  weakAreasList: {
    margin: 0,
    paddingLeft: SPACE.lg,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    cursor: 'pointer',
  },
};

export default function VaultTestComponent({ vaultId, vaultTitle }) {
  const [testData, setTestData] = useState({
    vaultId,
    scorePercent: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    avgTimePerQuestion: 0,
  });
  const [focusedField, setFocusedField] = useState(null);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: submitVaultTest,
    onSuccess: (data) => {
      console.log('Vault test submitted successfully:', data);
      // Invalidate vault-related queries
      queryClient.invalidateQueries(['vault-review-schedule']);
      queryClient.invalidateQueries(['vault-stats', vaultId]);
      queryClient.invalidateQueries(['vault-test-history', vaultId]);
      // Vault attempts now appear in unified attempts collection
      queryClient.invalidateQueries(['attempts']);
      queryClient.invalidateQueries(['attempt-stats']);
    },
    onError: (error) => {
      console.error('Failed to submit vault test:', error);
      // Check if it's a 404 or 500 error (API not implemented yet or server issues)
      if (error?.message?.includes('404') || error?.message?.includes('Not Found') ||
          error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        console.log('Vault spaced repetition API not available yet');
      }
    },
  });
  const isSubmitting = submitMutation.isPending || submitMutation.isLoading;

  const handleInputChange = (field, value) => {
    const numValue = field === 'scorePercent' || field === 'totalQuestions' || 
                     field === 'correctAnswers' || field === 'avgTimePerQuestion' 
      ? Number(value) || 0 : value;
    
    setTestData(prev => ({
      ...prev,
      [field]: numValue
    }));

    // Auto-calculate score percentage if totalQuestions and correctAnswers are set
    if (field === 'totalQuestions' || field === 'correctAnswers') {
      const newTotal = field === 'totalQuestions' ? numValue : testData.totalQuestions;
      const newCorrect = field === 'correctAnswers' ? numValue : testData.correctAnswers;
      
      if (newTotal > 0) {
        const calculatedScore = Math.round((newCorrect / newTotal) * 100);
        setTestData(prev => ({
          ...prev,
          scorePercent: calculatedScore
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate data
    if (testData.totalQuestions <= 0) {
      alert('Total questions must be greater than 0');
      return;
    }
    
    if (testData.correctAnswers < 0 || testData.correctAnswers > testData.totalQuestions) {
      alert('Correct answers must be between 0 and total questions');
      return;
    }

    submitMutation.mutate(testData);
  };

  const handleReset = () => {
    setTestData({
      vaultId,
      scorePercent: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      avgTimePerQuestion: 0,
    });
    submitMutation.reset();
  };

  if (submitMutation.data) {
    const result = submitMutation.data;
    // New unified response: result.attempt is the canonical attempt object,
    // result.spacedRepetitionResult.data holds { testAttempt, updatedStats }
    const { attempt: submittedAttempt, vaultInfo } = result;
    const srData = result.spacedRepetitionResult?.data;
    const srStats = srData?.updatedStats;
    const weakAreas = srData?.weakAreas || result.weakAreas || [];

    // Score from the unified attempt object; fall back to SR data for legacy compat
    const scorePercent = submittedAttempt?.scorePercent ?? srData?.testAttempt?.scorePercent;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Test Results for {vaultTitle}</h2>
          {vaultInfo && (
            <div style={{
              marginTop: SPACE.sm,
              display: 'flex',
              gap: SPACE.md,
              flexWrap: 'wrap',
            }}>
              {vaultInfo.domain && (
                <span style={{
                  fontFamily: FONTS.mono,
                  fontSize: SIZE.xs,
                  color: COLORS.accent,
                  backgroundColor: `${COLORS.accent}15`,
                  padding: `2px ${SPACE.sm}px`,
                  borderRadius: 4,
                  border: `1px solid ${COLORS.accent}40`,
                }}>
                  Domain: {vaultInfo.domain}
                </span>
              )}
              {vaultInfo.section && (
                <span style={{
                  fontFamily: FONTS.mono,
                  fontSize: SIZE.xs,
                  color: COLORS.muted,
                  backgroundColor: COLORS.bg,
                  padding: `2px ${SPACE.sm}px`,
                  borderRadius: 4,
                  border: `1px solid ${COLORS.border}`,
                }}>
                  Section: {vaultInfo.section}
                </span>
              )}
              {vaultInfo.path && (
                <span style={{
                  fontFamily: FONTS.mono,
                  fontSize: SIZE.xs,
                  color: COLORS.muted,
                }}>
                  {vaultInfo.path}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div style={styles.resultContainer}>
          <h3 style={styles.resultTitle}>Test Results</h3>
          
          <div style={styles.resultSummary}>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>Score:</span>
              <span style={styles.resultValue}>{scorePercent}%</span>
            </div>
            {srStats && (
              <>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Priority Score:</span>
                  <span style={styles.resultValue}>{srStats.priorityScore ?? srStats.material?.priorityScore}</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Next Review:</span>
                  <span style={styles.resultValue}>
                    {new Date(srStats.nextReviewAt ?? srStats.material?.nextReviewAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Retention Strength:</span>
                  <span style={styles.resultValue}>
                    {(srStats.retentionStrength ?? srStats.material?.retentionStrength)?.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {weakAreas.length > 0 && (
            <div style={styles.weakAreas}>
              <h4 style={styles.weakAreasTitle}>Areas to Improve:</h4>
              <ul style={styles.weakAreasList}>
                {weakAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button style={styles.retryButton} onClick={handleReset}>
            Take Another Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Test: {vaultTitle}</h2>
      </div>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Total Questions:</label>
          <input
            type="number"
            value={testData.totalQuestions}
            onChange={(e) => handleInputChange('totalQuestions', e.target.value)}
            min="1"
            required
            style={{
              ...styles.input,
              ...(focusedField === 'totalQuestions' ? styles.inputFocus : {}),
            }}
            onFocus={() => setFocusedField('totalQuestions')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Correct Answers:</label>
          <input
            type="number"
            value={testData.correctAnswers}
            onChange={(e) => handleInputChange('correctAnswers', e.target.value)}
            min="0"
            max={testData.totalQuestions}
            required
            style={{
              ...styles.input,
              ...(focusedField === 'correctAnswers' ? styles.inputFocus : {}),
            }}
            onFocus={() => setFocusedField('correctAnswers')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Average Time per Question (seconds):</label>
          <input
            type="number"
            value={testData.avgTimePerQuestion}
            onChange={(e) => handleInputChange('avgTimePerQuestion', e.target.value)}
            min="0"
            step="0.1"
            style={{
              ...styles.input,
              ...(focusedField === 'avgTimePerQuestion' ? styles.inputFocus : {}),
            }}
            onFocus={() => setFocusedField('avgTimePerQuestion')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        
        {testData.totalQuestions > 0 && (
          <div style={styles.autoCalc}>
            <strong>Auto-calculated Score:</strong> {testData.scorePercent}%
          </div>
        )}
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Score Override (optional):</label>
          <input
            type="number"
            value={testData.scorePercent}
            onChange={(e) => handleInputChange('scorePercent', e.target.value)}
            min="0"
            max="100"
            style={{
              ...styles.input,
              ...(focusedField === 'scorePercent' ? styles.inputFocus : {}),
            }}
            onFocus={() => setFocusedField('scorePercent')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
            ...styles.submitButton,
            ...(isSubmitting ? styles.submitButtonDisabled : {}),
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Test'}
        </button>
        
        {submitMutation.error && (
          <div style={styles.error}>
            Failed to submit test. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}
