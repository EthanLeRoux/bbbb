import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resubmitVaultTest } from '../api/vaultSpacedRepetition';
import ImprovementAnalysis from './ImprovementAnalysis';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    marginBottom: SPACE.lg,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    marginBottom: SPACE.lg,
  },
  originalTestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.md,
  },
  originalTestItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: SPACE.md,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  testDetails: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  resubmitButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  noResubmitOptions: {
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontStyle: 'italic',
    padding: SPACE.lg,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: SPACE.lg,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  originalTestInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACE.md,
    borderRadius: 4,
    marginBottom: SPACE.md,
  },
  originalTestInfoTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  originalTestInfoDetails: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  formGroup: {
    marginBottom: SPACE.md,
  },
  formLabel: {
    display: 'block',
    marginBottom: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
  },
  formInput: {
    width: '100%',
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    outline: 'none',
  },
  formInputFocus: {
    borderColor: COLORS.accent,
  },
  formActions: {
    display: 'flex',
    gap: SPACE.sm,
    marginTop: SPACE.lg,
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
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  cancelButton: {
    backgroundColor: COLORS.muted,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 4,
    padding: `${SPACE.sm}px ${SPACE.lg}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    cursor: 'pointer',
  },
  resubmissionResult: {
    marginTop: SPACE.lg,
  },
  resultTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  resultActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: SPACE.lg,
  },
  closeButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    cursor: 'pointer',
  },
  errorMessage: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    marginTop: SPACE.sm,
  },
};

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ResubmitButton({ vaultId, testHistory, onResubmitSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [formData, setFormData] = useState({
    scorePercent: '',
    totalQuestions: '',
    correctAnswers: '',
    avgTimePerQuestion: '',
  });
  const [focusedField, setFocusedField] = useState(null);
  const [result, setResult] = useState(null);

  const queryClient = useQueryClient();

  const resubmitMutation = useMutation({
    mutationFn: resubmitVaultTest,
    onSuccess: (data) => {
      console.log('Test resubmitted successfully:', data);
      setResult(data.data);
      onResubmitSuccess && onResubmitSuccess();
      // Invalidate related queries
      queryClient.invalidateQueries(['vault-test-history', vaultId]);
      queryClient.invalidateQueries(['vault-resubmission-analytics', vaultId]);
      queryClient.invalidateQueries(['vault-review-schedule']);
      queryClient.invalidateQueries(['vault-stats', vaultId]);
    },
    onError: (error) => {
      console.error('Failed to resubmit test:', error);
      if (error?.message?.includes('404') || error?.message?.includes('Not Found') ||
          error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        console.log('Vault resubmission API not available yet');
      }
    },
  });
  const isResubmitting = resubmitMutation.isPending || resubmitMutation.isLoading;

  const originalTests = testHistory?.filter(test => !test.isResubmission) || [];

  const handleResubmit = (testId) => {
    const originalTest = testHistory.find(t => t.id === testId);
    setSelectedTest(originalTest);
    setFormData({
      scorePercent: originalTest.scorePercent.toString(),
      totalQuestions: originalTest.totalQuestions?.toString() || '10',
      correctAnswers: Math.round((originalTest.scorePercent * (originalTest.totalQuestions || 10)) / 100).toString(),
      avgTimePerQuestion: '',
    });
    setShowModal(true);
    setResult(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      vaultId,
      originalTestId: selectedTest.id,
      updatedTestData: {
        scorePercent: parseInt(formData.scorePercent),
        totalQuestions: parseInt(formData.totalQuestions),
        correctAnswers: parseInt(formData.correctAnswers),
        avgTimePerQuestion: parseFloat(formData.avgTimePerQuestion) || 0,
      },
    };

    resubmitMutation.mutate(payload);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-calculate correct answers if score and total questions change
    if (field === 'scorePercent' || field === 'totalQuestions') {
      const score = field === 'scorePercent' ? Number(value) : Number(formData.scorePercent);
      const total = field === 'totalQuestions' ? Number(value) : Number(formData.totalQuestions);
      
      if (score >= 0 && total > 0) {
        const correct = Math.round((score * total) / 100);
        setFormData(prev => ({
          ...prev,
          correctAnswers: correct.toString(),
        }));
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTest(null);
    setResult(null);
  };

  if (originalTests.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Resubmit Tests for Improvement</h3>
        <div style={styles.noResubmitOptions}>
          <p>No original tests available for resubmission.</p>
          <p>Take tests to build your resubmission history!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Resubmit Tests for Improvement</h3>
      <p style={styles.subtitle}>Choose a test to resubmit with updated scores:</p>
      
      <div style={styles.originalTestsList}>
        {originalTests.map(test => (
          <div key={test.id} style={styles.originalTestItem}>
            <div style={styles.testInfo}>
              <h4 style={styles.testTitle}>Test #{test.id.slice(-6)}</h4>
              <div style={styles.testDetails}>
                <div>Score: {test.scorePercent}% | Quality: {test.recallQuality}</div>
                <div>Date: {formatDate(test.completedAt)}</div>
              </div>
            </div>
            <button 
              onClick={() => handleResubmit(test.id)}
              style={styles.resubmitButton}
            >
              Resubmit
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Resubmit Test</h3>
            
            <div style={styles.originalTestInfo}>
              <h4 style={styles.originalTestInfoTitle}>Original Test</h4>
              <div style={styles.originalTestInfoDetails}>
                <div>Score: {selectedTest.scorePercent}%</div>
                <div>Quality: {selectedTest.recallQuality}</div>
                <div>Date: {formatDate(selectedTest.completedAt)}</div>
              </div>
            </div>

            {!result ? (
              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Updated Score (%):</label>
                  <input
                    type="number"
                    value={formData.scorePercent}
                    onChange={(e) => handleInputChange('scorePercent', e.target.value)}
                    min="0"
                    max="100"
                    required
                    style={{
                      ...styles.formInput,
                      ...(focusedField === 'scorePercent' ? styles.formInputFocus : {}),
                    }}
                    onFocus={() => setFocusedField('scorePercent')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Total Questions:</label>
                  <input
                    type="number"
                    value={formData.totalQuestions}
                    onChange={(e) => handleInputChange('totalQuestions', e.target.value)}
                    min="1"
                    required
                    style={{
                      ...styles.formInput,
                      ...(focusedField === 'totalQuestions' ? styles.formInputFocus : {}),
                    }}
                    onFocus={() => setFocusedField('totalQuestions')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Correct Answers:</label>
                  <input
                    type="number"
                    value={formData.correctAnswers}
                    onChange={(e) => handleInputChange('correctAnswers', e.target.value)}
                    min="0"
                    max={formData.totalQuestions}
                    required
                    style={{
                      ...styles.formInput,
                      ...(focusedField === 'correctAnswers' ? styles.formInputFocus : {}),
                    }}
                    onFocus={() => setFocusedField('correctAnswers')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Average Time per Question (seconds):</label>
                  <input
                    type="number"
                    value={formData.avgTimePerQuestion}
                    onChange={(e) => handleInputChange('avgTimePerQuestion', e.target.value)}
                    min="0"
                    step="0.1"
                    style={{
                      ...styles.formInput,
                      ...(focusedField === 'avgTimePerQuestion' ? styles.formInputFocus : {}),
                    }}
                    onFocus={() => setFocusedField('avgTimePerQuestion')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                
                <div style={styles.formActions}>
                  <button 
                    type="submit" 
                    disabled={isResubmitting}
                    style={{
                      ...styles.submitButton,
                      ...(isResubmitting ? styles.submitButtonDisabled : {}),
                    }}
                  >
                    {isResubmitting ? 'Submitting...' : 'Submit Resubmission'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCloseModal}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={styles.resubmissionResult}>
                <h4 style={styles.resultTitle}>Resubmission Successful!</h4>
                <ImprovementAnalysis 
                  analysis={result.resubmissionAnalysis}
                  originalTest={selectedTest}
                  newTest={result.testAttempt}
                />
                
                <div style={styles.resultActions}>
                  <button onClick={handleCloseModal} style={styles.closeButton}>
                    Close
                  </button>
                </div>
              </div>
            )}
            
            {resubmitMutation.error && (
              <div style={styles.errorMessage}>
                Failed to resubmit test. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
