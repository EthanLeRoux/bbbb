import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVaultTestHistory, resubmitVaultTest, getVaultResubmissionAnalytics } from '../api/vaultSpacedRepetition';
import { getAllNotes } from '../api/vault';
import Skeleton from './Skeleton';
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
  analyticsSection: {
    marginBottom: SPACE.xl,
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  analyticsCard: {
    backgroundColor: COLORS.bg,
    padding: SPACE.md,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
    textAlign: 'center',
  },
  analyticsTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    marginBottom: SPACE.xs,
  },
  bigNumber: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xl,
    fontWeight: 700,
    color: COLORS.accent,
    margin: `${SPACE.xs}px 0`,
  },
  analyticsSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  recentResubmissions: {
    backgroundColor: COLORS.bg,
    padding: SPACE.md,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
  },
  recentResubmissionsTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  resubmissionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${SPACE.xs}px 0`,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  resubmissionItemLast: {
    borderBottom: 'none',
  },
  scores: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
  },
  arrow: {
    margin: `0 ${SPACE.xs}px`,
    color: COLORS.muted,
  },
  changePositive: {
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
  },
  changeNegative: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
  },
  qualityChange: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
  testHistory: {
    marginBottom: SPACE.lg,
  },
  testHistoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  testHistoryTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    fontWeight: 500,
    color: COLORS.text,
  },
  testCount: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  testItem: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: SPACE.md,
    marginBottom: SPACE.sm,
    borderLeft: '4px solid transparent',
  },
  testItemOriginal: {
    borderLeftColor: COLORS.accent,
  },
  testItemResubmission: {
    borderLeftColor: COLORS.success,
    backgroundColor: `${COLORS.success}10`,
  },
  testItemOtherVault: {
    borderLeftColor: COLORS.muted,
  },
  testHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  testTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
  },
  resubmissionBadge: {
    backgroundColor: COLORS.success,
    color: COLORS.bg,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
    marginLeft: SPACE.xs,
  },
  qualityBadge: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  qualityEasy: {
    backgroundColor: COLORS.success,
    color: COLORS.bg,
  },
  qualityGood: {
    backgroundColor: COLORS.diffEasy,
    color: COLORS.bg,
  },
  qualityHard: {
    backgroundColor: COLORS.diffMedium,
    color: COLORS.bg,
  },
  qualityAgain: {
    backgroundColor: COLORS.diffHard,
    color: COLORS.bg,
  },
  qualityFail: {
    backgroundColor: COLORS.error,
    color: COLORS.bg,
  },
  testDetails: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginBottom: SPACE.sm,
  },
  testActions: {
    display: 'flex',
    justifyContent: 'flex-end',
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
  originalInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACE.md,
    borderRadius: 4,
    marginBottom: SPACE.md,
  },
  originalInfoTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  originalInfoDetails: {
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
  emptyState: {
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontStyle: 'italic',
    padding: SPACE.lg,
  },
  errorState: {
    textAlign: 'center',
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    padding: SPACE.lg,
  },
  successMessage: {
    backgroundColor: `${COLORS.success}10`,
    border: `1px solid ${COLORS.success}`,
    borderRadius: 4,
    padding: SPACE.sm,
    marginBottom: SPACE.md,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.success,
  },
  vaultLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginTop: SPACE.xs,
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

function getVaultDisplay(test) {
  return [test.domainId, test.sectionId].filter(Boolean).join('/') || test.vaultId || 'Unknown';
}

export default function TestResubmissionDashboard({ vaultId, vaultTitle, vaultDomain, vaultSection, showAllAttempts = false }) {
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    scorePercent: '',
    totalQuestions: '',
    correctAnswers: '',
    avgTimePerQuestion: '',
  });
  const [focusedField, setFocusedField] = useState(null);

  const queryClient = useQueryClient();

  // Fetch all vault notes if showing all attempts
  const { data: allVaultNotes = [] } = useQuery({
    queryKey: ['vault', 'all-notes-for-resubmit'],
    queryFn: async () => {
      try {
        const notes = await getAllNotes(100);
        return notes.map(note => note.id);
      } catch {
        return [];
      }
    },
    retry: 1,
    enabled: showAllAttempts,
  });

  // Determine which vault IDs to query
  const vaultIdsToQuery = showAllAttempts ? allVaultNotes : (vaultId ? [vaultId] : []);

  // Fetch test history for all relevant vaults in parallel
  const { data: testHistory = [], isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['vault-test-history-all', vaultIdsToQuery],
    queryFn: async () => {
      if (!vaultIdsToQuery || vaultIdsToQuery.length === 0) return [];
      
      const allResults = await Promise.all(
        vaultIdsToQuery.map(vid => getVaultTestHistory(vid, 20).catch(() => ({ testHistory: [] })))
      );
      
      const flattened = [];
      allResults.forEach((result, idx) => {
        const attempts = result?.testHistory || [];
        attempts.forEach(attempt => {
          flattened.push({
            ...attempt,
            vaultId: vaultIdsToQuery[idx],
          });
        });
      });
      
      return flattened.sort((a, b) =>
        new Date(b.completedAt || b.submittedAt || b.createdAt) -
        new Date(a.completedAt || a.submittedAt || a.createdAt)
      );
    },
    enabled: vaultIdsToQuery.length > 0,
    retry: 1,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['vault-resubmission-analytics', vaultId],
    queryFn: () => getVaultResubmissionAnalytics(vaultId),
    enabled: !!vaultId && !showAllAttempts,
    retry: (failureCount, error) => {
      if (error?.message?.includes('404') || error?.message?.includes('Not Found') ||
          error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: resubmitVaultTest,
    onSuccess: (data) => {
      console.log('Test resubmitted successfully:', data);
      queryClient.invalidateQueries(['vault-test-history', selectedTest.vaultId]);
      queryClient.invalidateQueries(['vault-test-history-all', vaultIdsToQuery]);
      queryClient.invalidateQueries(['vault-resubmission-analytics', selectedTest.vaultId]);
      queryClient.invalidateQueries(['vault-review-schedule']);
      queryClient.invalidateQueries(['vault-stats', selectedTest.vaultId]);
      
      setShowResubmitForm(false);
      setSelectedTest(null);
      
      const improvement = data.resubmissionAnalysis?.scoreImprovement || 0;
      alert(`Test resubmitted successfully! Score improved by ${improvement}%`);
    },
    onError: (error) => {
      console.error('Failed to resubmit test:', error);
    },
  });
  const isResubmitting = resubmitMutation.isPending || resubmitMutation.isLoading;

  const handleResubmitTest = (test) => {
    setSelectedTest(test);
    setFormData({
      scorePercent: test.scorePercent.toString(),
      totalQuestions: test.totalQuestions?.toString() || '10',
      correctAnswers: Math.round((test.scorePercent * (test.totalQuestions || 10)) / 100).toString(),
      avgTimePerQuestion: '',
    });
    setShowResubmitForm(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      vaultId: selectedTest.vaultId,
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

  const isAPIUnavailable = historyError?.message?.includes('404') || historyError?.message?.includes('Not Found') ||
                          historyError?.message?.includes('500') || historyError?.message?.includes('Internal Server Error');

  if (isAPIUnavailable && !showAllAttempts) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Test Resubmission Dashboard</h2>
        </div>
        <div style={styles.emptyState}>
          <div style={{ marginBottom: SPACE.md }}>
            <strong>Test Resubmission System</strong>
          </div>
          <div style={{ marginBottom: SPACE.md }}>
            The test resubmission feature is coming soon! This feature will help you:
          </div>
          <ul style={{ textAlign: 'left', fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.muted }}>
            <li>Resubmit tests for improved spaced repetition analysis</li>
            <li>Track learning progress and improvement over time</li>
            <li>Get personalized recommendations based on performance</li>
            <li>Compare original and resubmitted test results</li>
          </ul>
          <div style={{ marginTop: SPACE.md, color: COLORS.accent }}>
            Take tests to build your resubmission history!
          </div>
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Test Resubmission Dashboard</h2>
        </div>
        <div style={styles.errorState}>
          Failed to load test history
        </div>
      </div>
    );
  }

  if (historyLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Test Resubmission Dashboard</h2>
        </div>
        <Skeleton count={3} height={60} />
      </div>
    );
  }

  const originalTests = testHistory.filter(test => !test.isResubmission) || [];
  const resubmittedTests = testHistory.filter(test => test.isResubmission) || [];

  const AnalyticsSection = () => {
    if (!analytics || analytics.totalResubmissions === 0) {
      return (
        <div style={styles.analyticsSection}>
          <h3 style={styles.testHistoryTitle}>Resubmission Analytics</h3>
          <div style={styles.emptyState}>
            <div style={{ marginBottom: SPACE.md }}>
              <strong>No Resubmissions Yet</strong>
            </div>
            <div style={{ marginBottom: SPACE.md }}>
              Complete and resubmit tests to see your improvement analytics!
            </div>
            <div style={{ marginTop: SPACE.md, color: COLORS.accent }}>
              Each resubmission will show your learning progress and retention gains.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.analyticsSection}>
        <h3 style={styles.testHistoryTitle}>Resubmission Analytics</h3>
        
        <div style={styles.analyticsGrid}>
          <div style={styles.analyticsCard}>
            <div style={styles.analyticsTitle}>Total Resubmissions</div>
            <div style={styles.bigNumber}>{analytics.totalResubmissions}</div>
            <div style={styles.analyticsSubtitle}>tests resubmitted</div>
          </div>
          
          <div style={styles.analyticsCard}>
            <div style={styles.analyticsTitle}>Average Improvement</div>
            <div style={styles.bigNumber}>+{analytics.averageScoreImprovement}%</div>
            <div style={styles.analyticsSubtitle}>score gain</div>
          </div>
          
          <div style={styles.analyticsCard}>
            <div style={styles.analyticsTitle}>Success Rate</div>
            <div style={styles.bigNumber}>{analytics.improvementRate}%</div>
            <div style={styles.analyticsSubtitle}>showed improvement</div>
          </div>
          
          <div style={styles.analyticsCard}>
            <div style={styles.analyticsTitle}>Retention Gain</div>
            <div style={styles.bigNumber}>+{analytics.averageRetentionGain}</div>
            <div style={styles.analyticsSubtitle}>memory strength</div>
          </div>
        </div>
        
        {analytics.recentResubmissions?.length > 0 && (
          <div style={styles.recentResubmissions}>
            <h4 style={styles.recentResubmissionsTitle}>Recent Resubmissions</h4>
            {analytics.recentResubmissions.map((sub, index) => (
              <div key={index} style={{
                ...styles.resubmissionItem,
                ...(index === analytics.recentResubmissions.length - 1 ? styles.resubmissionItemLast : {}),
              }}>
                <span style={styles.scores}>
                  {sub.originalScore}% <span style={styles.arrow}>{'->'}</span> {sub.newScore}%
                </span>
                <span style={sub.scoreChange > 0 ? styles.changePositive : styles.changeNegative}>
                  {sub.scoreChange > 0 ? '+' : ''}{sub.scoreChange}%
                </span>
                <span style={styles.qualityChange}>
                  {sub.recallQualityChange?.original} <span style={styles.arrow}>{'->'}</span> {sub.recallQualityChange?.new}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const TestHistoryItem = ({ test }) => {
    const vaultDisplay = getVaultDisplay(test);
    const isFromOtherVault = showAllAttempts && test.vaultId && test.vaultId !== vaultId;
    
    return (
      <div style={{
        ...styles.testItem,
        ...(test.isResubmission ? styles.testItemResubmission : styles.testItemOriginal),
        ...(isFromOtherVault ? styles.testItemOtherVault : {}),
      }}>
        <div style={styles.testHeader}>
          <div style={styles.testTitle}>
            {test.isResubmission ? 'Resubmitted Test' : 'Original Test'}
            {test.isResubmission && <span style={styles.resubmissionBadge}>Improved</span>}
            {isFromOtherVault && <span style={{
              ...styles.resubmissionBadge,
              backgroundColor: COLORS.muted,
              marginLeft: SPACE.xs,
            }}>Other Vault</span>}
          </div>
          <span style={{ ...styles.qualityBadge, ...getQualityStyle(test.recallQuality) }}>
            {test.recallQuality}
          </span>
        </div>
        
        <div style={styles.testDetails}>
          <div><strong>Score:</strong> {test.scorePercent}%</div>
          <div><strong>Date:</strong> {formatDate(test.completedAt || test.submittedAt || test.createdAt)}</div>
          {isFromOtherVault && (
            <div style={styles.vaultLabel}>Vault: {vaultDisplay}</div>
          )}
          {test.isResubmission && test.originalTestId && (
            <div><strong>Original:</strong> Test #{test.originalTestId.slice(-6)}</div>
          )}
        </div>
        
        <div style={styles.testActions}>
          {!test.isResubmission && (
            <button 
              onClick={() => handleResubmitTest(test)}
              style={styles.resubmitButton}
            >
              Resubmit Test
            </button>
          )}
        </div>
      </div>
    );
  };

  const ResubmissionForm = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h3 style={styles.modalTitle}>Resubmit Test</h3>
        
        {selectedTest && (
          <div style={styles.originalInfo}>
            <h4 style={styles.originalInfoTitle}>Original Test Results</h4>
            <div style={styles.originalInfoDetails}>
              <div><strong>Score:</strong> {selectedTest.scorePercent}%</div>
              <div><strong>Quality:</strong> {selectedTest.recallQuality || 'n/a'}</div>
              <div><strong>Date:</strong> {formatDate(selectedTest.completedAt || selectedTest.submittedAt || selectedTest.createdAt)}</div>
              {selectedTest.vaultId && (
                <div><strong>Vault:</strong> {getVaultDisplay(selectedTest)}</div>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleFormSubmit}>
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
              onClick={() => {
                setShowResubmitForm(false);
                setSelectedTest(null);
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
        
        {resubmitMutation.error && (
          <div style={styles.errorState}>
            Failed to resubmit test. Please try again.
          </div>
        )}
      </div>
    </div>
  );

  if (showAllAttempts && allVaultNotes.length === 0 && !historyLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>All Test Attempts</h2>
        </div>
        <div style={styles.emptyState}>
          No vault items found. Create some notes in your vault first.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {showAllAttempts ? 'All Test Attempts' : `Test Resubmission: ${vaultTitle || 'Vault Item'}`}
        </h2>
        {vaultDomain && vaultSection && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{
              fontFamily: FONTS.mono,
              fontSize: SIZE.xs,
              color: COLORS.accent,
              backgroundColor: `${COLORS.accent}15`,
              padding: `2px 8px`,
              borderRadius: 4,
              border: `1px solid ${COLORS.accent}40`,
            }}>
              {vaultDomain}
            </span>
            <span style={{
              fontFamily: FONTS.mono,
              fontSize: SIZE.xs,
              color: COLORS.muted,
              backgroundColor: COLORS.bg,
              padding: `2px 8px`,
              borderRadius: 4,
              border: `1px solid ${COLORS.border}`,
            }}>
              {vaultSection}
            </span>
          </div>
        )}
      </div>
      
      {!showAllAttempts && <AnalyticsSection />}
      
      <div style={styles.testHistory}>
        <div style={styles.testHistoryHeader}>
          <h3 style={styles.testHistoryTitle}>
            {showAllAttempts ? 'All Attempts' : 'Test History'}
          </h3>
          <div style={styles.testCount}>
            {testHistory.length} attempts
          </div>
        </div>
        
        {testHistory.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ marginBottom: SPACE.md }}>
              <strong>No Tests Yet</strong>
            </div>
            <div style={{ marginBottom: SPACE.md }}>
              {showAllAttempts 
                ? 'No test attempts found across any vault items.' 
                : 'Take your first test to get started with resubmissions!'}
            </div>
            <div style={{ marginTop: SPACE.md, color: COLORS.accent }}>
              Each test creates an opportunity for improvement analysis.
            </div>
          </div>
        ) : (
          testHistory.map(test => (
            <TestHistoryItem key={test.id} test={test} />
          ))
        )}
      </div>
      
      {showResubmitForm && <ResubmissionForm />}
    </div>
  );
}
