import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAttempts, remarkAttempt } from '../api/attempts';
import Skeleton from '../components/Skeleton';
import AIScoreBadge from '../components/AIScoreBadge';
import { COLORS, FONTS, SPACE, SIZE, LABELS, PAGE_SIZE } from '../constants';

const styles = {
  container: {
    padding: `${SPACE.lg}px`,
  },
  tableContainer: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    backgroundColor: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    fontWeight: 500,
  },
  tableHeaderCell: {
    flex: 1,
  },
  tableRow: {
    display: 'flex',
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    borderBottom: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    transition: 'background-color 0.2s',
  },
  tableRowHover: {
    backgroundColor: COLORS.bg,
  },
  tableCell: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  testId: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  score: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACE.md,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
  },
  paginationButton: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paginationButtonHover: {
    backgroundColor: COLORS.bg,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  paginationInfo: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
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
  emptyState: {
    padding: SPACE.xl,
    textAlign: 'center',
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  actionCell: {
    flex: '0 0 120px',
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  remarkBtn: {
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.accent,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  remarkBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  remarkBtnLoading: {
    cursor: 'wait',
  },
  statusBadge: {
    fontSize: SIZE.xs,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    whiteSpace: 'nowrap',
  },
  statusBasic: {
    backgroundColor: `${COLORS.muted}20`,
    color: COLORS.muted,
    border: `1px solid ${COLORS.muted}40`,
  },
  statusAi: {
    backgroundColor: `${COLORS.success}20`,
    color: COLORS.success,
    border: `1px solid ${COLORS.success}40`,
  },
  statusNeedsAi: {
    backgroundColor: `${COLORS.diffMedium}20`,
    color: COLORS.diffMedium,
    border: `1px solid ${COLORS.diffMedium}40`,
  },
  spinner: {
    width: 12,
    height: 12,
    border: `2px solid ${COLORS.accent}`,
    borderTop: `2px solid ${COLORS.surface}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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

function formatTestId(testId) {
  if (!testId) return 'Unknown';
  return testId.length > 8 ? `${testId.substring(0, 8)}...` : testId;
}

export default function AttemptList() {
  const [offset, setOffset] = useState(0);
  const [remarkingIds, setRemarkingIds] = useState(new Set());

  const { data: attempts, isLoading, error, refetch } = useQuery({
    queryKey: ['attempts', { limit: PAGE_SIZE, offset }],
    queryFn: () => getAttempts({ limit: PAGE_SIZE, offset }),
    keepPreviousData: true,
  });

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - PAGE_SIZE));
  };

  const handleNextPage = () => {
    setOffset(offset + PAGE_SIZE);
  };

  const handleRemark = async (attemptId) => {
    setRemarkingIds(prev => new Set([...prev, attemptId]));
    try {
      await remarkAttempt(attemptId);
      await refetch();
    } catch (err) {
      console.error('Failed to remark attempt:', err);
    } finally {
      setRemarkingIds(prev => {
        const next = new Set(prev);
        next.delete(attemptId);
        return next;
      });
    }
  };

  const handleRowClick = (e, attemptId, hasAIScoring) => {
    // Don't navigate if clicking the remark button
    if (e.target.closest('[data-action="remark"]')) return;
    window.location.href = `/attempts/${attemptId}`;
  };

  const renderError = (error, refetch) => (
    <div style={styles.errorContainer}>
      <div>{LABELS.error.generic}</div>
      <button style={styles.retryButton} onClick={refetch}>
        {LABELS.error.retry}
      </button>
    </div>
  );

  const renderLoading = () => (
    <div style={styles.tableContainer}>
      <Skeleton count={PAGE_SIZE} height={40} />
    </div>
  );

  const renderEmpty = () => (
    <div style={styles.emptyState}>
      {LABELS.empty.attempts}
    </div>
  );

  return (
    <div style={styles.container}>
      {error ? (
        renderError(error, refetch)
      ) : isLoading ? (
        renderLoading()
      ) : !attempts || attempts.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <div style={styles.tableHeaderCell}>ID / Vault</div>
              <div style={styles.tableHeaderCell}>Score</div>
              <div style={styles.tableHeaderCell}>AI Status</div>
              <div style={styles.tableHeaderCell}>Questions</div>
              <div style={{ flex: '0 0 120px' }}>Action</div>
              <div style={styles.tableHeaderCell}>Date</div>
            </div>
            
            {attempts.map((attempt) => {
              const isVaultAttempt = !!attempt.vaultId;
              const hasAIScoring = attempt.hasAIScoring || false;
              const needsRemarking = !hasAIScoring && attempt.status === 'completed' && !isVaultAttempt;
              const hasBeenRemarked = (attempt.remarkCount || 0) > 0;
              const isRemarking = remarkingIds.has(attempt.id);

              return (
                <div
                  key={attempt.id}
                  style={{
                    ...styles.tableRow,
                    cursor: needsRemarking ? 'default' : 'pointer',
                  }}
                  onClick={(e) => handleRowClick(e, attempt.id, hasAIScoring)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={styles.tableCell}>
                    {isVaultAttempt ? (
                      <span style={styles.testId}>
                        {attempt.domainId && attempt.sectionId
                          ? `${attempt.domainId} / ${attempt.sectionId}`
                          : attempt.vaultId.split('__').slice(0, 2).join(' / ')}
                        {attempt.isResubmission && (
                          <span style={{ marginLeft: 4, color: COLORS.diffMedium }}>[re-submit]</span>
                        )}
                      </span>
                    ) : (
                      <span style={styles.testId}>{formatTestId(attempt.testId)}</span>
                    )}
                  </div>
                  <div style={styles.tableCell}>
                    {hasAIScoring ? (
                      <AIScoreBadge 
                        score={attempt.scorePercent} 
                        showGrade={true}
                        style={{ fontSize: SIZE.xs }}
                      />
                    ) : (
                      <span style={styles.score}>
                        {attempt.scorePercent !== undefined && attempt.totalQuestions !== undefined
                          ? `${attempt.scorePercent} / ${attempt.totalQuestions}`
                          : '—'}
                      </span>
                    )}
                  </div>
                  <div style={styles.tableCell}>
                    {hasAIScoring && (
                      <span style={{ ...styles.statusBadge, ...styles.statusAi }}>AI Scored</span>
                    )}
                    {needsRemarking && (
                      <span style={{ ...styles.statusBadge, ...styles.statusNeedsAi }}>Needs AI</span>
                    )}
                    {!hasAIScoring && !needsRemarking && (
                      <span style={{ ...styles.statusBadge, ...styles.statusBasic }}>Basic</span>
                    )}
                    {hasBeenRemarked && (
                      <span style={{
                        fontFamily: FONTS.mono,
                        fontSize: SIZE.xs,
                        color: COLORS.muted,
                        marginLeft: SPACE.xs,
                      }}>
                        (re-marked)
                      </span>
                    )}
                  </div>
                  <div style={styles.tableCell}>
                    {attempt.correctAnswers || 0} / {attempt.totalQuestions || '?'}</div>
                  <div style={styles.actionCell}>
                    {needsRemarking && (
                      <button
                        data-action="remark"
                        style={{
                          ...styles.remarkBtn,
                          ...(isRemarking ? styles.remarkBtnLoading : {}),
                          ...(isRemarking ? styles.remarkBtnDisabled : {}),
                        }}
                        onClick={() => handleRemark(attempt.id)}
                        disabled={isRemarking}
                        title="Re-mark with AI"
                      >
                        {isRemarking ? (
                          <>
                            <div style={styles.spinner} />
                            Marking...
                          </>
                        ) : (
                          <>
                            ✨ Re-mark
                            {attempt.remarkCount > 0 && ` (${attempt.remarkCount})`}
                          </>
                        )}
                      </button>
                    )}
                    {!needsRemarking && !hasAIScoring && (
                      <span style={{ fontSize: SIZE.xs, color: COLORS.muted }}>—</span>
                    )}
                    {hasAIScoring && (
                      <span style={{ fontSize: SIZE.xs, color: COLORS.muted }}>✓</span>
                    )}
                  </div>
                  <div style={styles.tableCell}>
                    {formatDate(attempt.submittedAt || attempt.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.paginationContainer}>
            <button
              onClick={handlePrevPage}
              disabled={offset === 0}
              style={{
                ...styles.paginationButton,
                ...(offset === 0 ? styles.paginationButtonDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (offset !== 0) e.currentTarget.style.backgroundColor = COLORS.bg;
              }}
              onMouseLeave={(e) => {
                if (offset !== 0) e.currentTarget.style.backgroundColor = COLORS.surface;
              }}
            >
              Previous
            </button>
            
            <div style={styles.paginationInfo}>
              {offset + 1}-{offset + attempts.length} attempts
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={attempts.length < PAGE_SIZE}
              style={{
                ...styles.paginationButton,
                ...(attempts.length < PAGE_SIZE ? styles.paginationButtonDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (attempts.length >= PAGE_SIZE) e.currentTarget.style.backgroundColor = COLORS.bg;
              }}
              onMouseLeave={(e) => {
                if (attempts.length >= PAGE_SIZE) e.currentTarget.style.backgroundColor = COLORS.surface;
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
