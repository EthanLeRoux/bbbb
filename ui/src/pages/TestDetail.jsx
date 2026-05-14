import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTestById, deleteTest } from '../api/tests';
import { startAttempt } from '../api/attempts';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.xl,
    paddingBottom: SPACE.md,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
  },
  domain: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.lg,
    color: COLORS.text,
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
  conceptTags: {
    display: 'flex',
    gap: SPACE.xs,
    flexWrap: 'wrap',
  },
  conceptTag: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  actions: {
    display: 'flex',
    gap: SPACE.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACE.xl,
    paddingTop: SPACE.lg,
    borderTop: `1px solid ${COLORS.border}`,
  },
  startButton: {
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
  startButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    color: COLORS.error,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    padding: `${SPACE.md}px ${SPACE.lg}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteButtonHover: {
    backgroundColor: COLORS.error,
    color: COLORS.bg,
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
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: test, isLoading, error, refetch } = useQuery({
    queryKey: ['tests', id],
    queryFn: () => getTestById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTest,
    onSuccess: () => {
      queryClient.invalidateQueries(['tests']);
      navigate('/tests');
    },
  });

  const startAttemptMutation = useMutation({
    mutationFn: startAttempt,
    onSuccess: (data) => {
      console.log('Start attempt response:', data);
      // Use attemptId from the response
      const attemptId = data?.attemptId;
      if (attemptId) {
        navigate(`/attempts/${attemptId}`);
      } else {
        console.error('No attempt ID found in response:', data);
      }
    },
    onError: (error) => {
      console.error('Failed to start attempt:', error);
    },
  });
  const isStartingAttempt = startAttemptMutation.isPending || startAttemptMutation.isLoading;
  const isDeletingTest = deleteMutation.isPending || deleteMutation.isLoading;


  const handleDelete = () => {
    if (window.confirm(LABELS.tests.deleteConfirm)) {
      deleteMutation.mutate(id);
    }
  };

  const handleStartAttempt = () => {
    startAttemptMutation.mutate(id);
  };

  if (error) {
    return (
      <div style={styles.container}>
        <Link to="/tests" style={styles.breadcrumb}>
          {LABELS.tests.backLink}
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
        <Link to="/tests" style={styles.breadcrumb}>
          {LABELS.tests.backLink}
        </Link>
        <Skeleton count={5} height={120} />
      </div>
    );
  }

  if (!test) {
    return (
      <div style={styles.container}>
        <Link to="/tests" style={styles.breadcrumb}>
          {LABELS.tests.backLink}
        </Link>
        <div style={styles.errorContainer}>
          Test not found
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Link to="/tests" style={styles.breadcrumb}>
        {LABELS.tests.backLink}
      </Link>

      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.domain}>{test.name || test.domain?.name || test.domain}</div>
          <Badge difficulty={test.difficulty} />
          <div style={styles.date}>{formatDate(test.createdAt)}</div>
        </div>
      </div>

       <div style={styles.questionCard}>
        <div style={styles.questionText}>
          This test contains {test.questions?.length || 0} questions
        </div>
      </div>

      {test.sourceNotes && test.sourceNotes.length > 0 && (
        <div style={styles.questionCard}>
          <div style={{
            ...styles.questionText,
            marginBottom: SPACE.lg
          }}>
            Source Notes Used:
          </div>
          {test.sourceNotes.slice(0, 20).map((note, index) => (
            <div key={index} style={{
              padding: SPACE.md,
              backgroundColor: COLORS.bg,
              borderRadius: 4,
              marginBottom: SPACE.sm,
              borderLeft: `3px solid ${COLORS.accent}`
            }}>
              <div style={{
                fontFamily: FONTS.mono,
                fontSize: SIZE.sm,
                fontWeight: 500,
                color: COLORS.text,
                marginBottom: SPACE.xs
              }}>
                {note.title || 'Untitled note'}
              </div>
              {note.section && (
                <div style={{
                  fontFamily: FONTS.mono,
                  fontSize: SIZE.xs,
                  color: COLORS.muted,
                  marginBottom: SPACE.xs
                }}>
                  {note.section}
                </div>
              )}
              {/* {note.content && (
                <div style={{
                  fontFamily: FONTS.mono,
                  fontSize: SIZE.xs,
                  color: COLORS.muted,
                  lineHeight: 1.6,
                  maxHeight: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {note.content}
                </div>
              )} */}
            </div>
          ))}
          {test.sourceNotes.length > 20 && (
            <div style={{
              fontFamily: FONTS.mono,
              fontSize: SIZE.xs,
              color: COLORS.muted,
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: SPACE.sm
            }}>
              ... and {test.sourceNotes.length - 20} more notes
            </div>
          )}
        </div>
      )}

      <div style={styles.actions}>
        <button
          onClick={handleStartAttempt}
          disabled={isStartingAttempt}
          style={{
            ...styles.startButton,
            ...(isStartingAttempt ? styles.startButtonDisabled : {}),
          }}
        >
          {isStartingAttempt ? 'Starting...' : LABELS.tests.startAttempt}
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeletingTest}
          style={{
            ...styles.deleteButton,
            ...(isDeletingTest ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
          onMouseEnter={(e) => {
            if (!isDeletingTest) e.currentTarget.style.backgroundColor = COLORS.error;
            e.currentTarget.style.color = COLORS.bg;
          }}
          onMouseLeave={(e) => {
            if (!isDeletingTest) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.error;
            }
          }}
        >
          {isDeletingTest ? 'Deleting...' : LABELS.tests.deleteBtn}
        </button>
      </div>
    </div>
  );
}
