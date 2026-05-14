import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTests } from '../api/tests';
import { getDomains } from '../api/vault';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, FONTS, SPACE, SIZE, LABELS, PAGE_SIZE } from '../constants';

const styles = {
  container: {
    padding: `${SPACE.lg}px`,
  },
  filtersContainer: {
    display: 'flex',
    gap: SPACE.md,
    alignItems: 'center',
    marginBottom: SPACE.lg,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
  },
  filterLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  select: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    outline: 'none',
  },
  difficultyButtons: {
    display: 'flex',
    gap: SPACE.xs,
  },
  difficultyButton: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  difficultyButtonActive: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    borderColor: COLORS.accent,
  },
  searchInput: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    outline: 'none',
    minWidth: 200,
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
    cursor: 'pointer',
    textDecoration: 'none',
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
};

const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TestLibrary() {
  const [filters, setFilters] = useState({
    domain: '',
    difficulty: '',
    search: '',
  });
  const [offset, setOffset] = useState(0);
  
  const debouncedSearch = useDebounce(filters.search);

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ['vault', 'domains'],
    queryFn: getDomains
  });

  const { data: tests, isLoading: testsLoading, error: testsError, refetch: refetchTests } = useQuery({
    queryKey: ['tests', { ...filters, search: debouncedSearch, offset, limit: PAGE_SIZE }],
    queryFn: () => getTests({ ...filters, search: debouncedSearch, offset, limit: PAGE_SIZE }),
    keepPreviousData: true
  });

  const handleDomainChange = (e) => {
    setFilters({ ...filters, domain: e.target.value });
    setOffset(0);
  };

  const handleDifficultyChange = (difficulty) => {
    setFilters({ ...filters, difficulty: filters.difficulty === difficulty ? '' : difficulty });
    setOffset(0);
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
    setOffset(0);
  };

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - PAGE_SIZE));
  };

  const handleNextPage = () => {
    setOffset(offset + PAGE_SIZE);
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
      {LABELS.empty.tests}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.filtersContainer}>
        <div style={styles.filterGroup}>
          <div style={styles.filterLabel}>Domain</div>
          {domainsLoading ? (
            <Skeleton width={120} height={32} />
          ) : (
            <select
              value={filters.domain}
              onChange={handleDomainChange}
              style={styles.select}
            >
              <option value="">All domains</option>
              {domains?.map((domain) => (
                <option key={domain.name || domain} value={domain.name || domain}>
                  {domain.name || domain}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={styles.filterGroup}>
          <div style={styles.filterLabel}>Difficulty</div>
          <div style={styles.difficultyButtons}>
            {DIFFICULTIES.map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                onClick={() => handleDifficultyChange(difficulty)}
                style={{
                  ...styles.difficultyButton,
                  ...(filters.difficulty === difficulty ? styles.difficultyButtonActive : {}),
                }}
              >
                {LABELS.difficulty[difficulty]}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.filterGroup}>
          <div style={styles.filterLabel}>Search</div>
          <input
            type="text"
            placeholder="Search tests..."
            value={filters.search}
            onChange={handleSearchChange}
            style={styles.searchInput}
          />
        </div>
      </div>

      {testsError ? (
        renderError(testsError, refetchTests)
      ) : testsLoading ? (
        renderLoading()
      ) : !tests || tests.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <div style={styles.tableHeaderCell}>Test Name</div>
              <div style={styles.tableHeaderCell}>Domain</div>
              <div style={styles.tableHeaderCell}>Difficulty</div>
              <div style={styles.tableHeaderCell}>Questions</div>
              <div style={styles.tableHeaderCell}>Created</div>
            </div>
            
            {tests.map((test) => (
              <Link
                key={test.id}
                to={`/tests/${test.id}`}
                style={styles.tableRow}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={styles.tableCell}>{test.name || test.domain}</div>
                <div style={styles.tableCell}>{test.domain}</div>
                <div style={styles.tableCell}>
                  <Badge difficulty={test.difficulty} />
                </div>
                <div style={styles.tableCell}>{test.questionCount}</div>
                <div style={styles.tableCell}>{formatDate(test.createdAt)}</div>
              </Link>
            ))}
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
              {offset + 1}-{offset + tests.length} tests
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={tests.length < PAGE_SIZE}
              style={{
                ...styles.paginationButton,
                ...(tests.length < PAGE_SIZE ? styles.paginationButtonDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (tests.length >= PAGE_SIZE) e.currentTarget.style.backgroundColor = COLORS.bg;
              }}
              onMouseLeave={(e) => {
                if (tests.length >= PAGE_SIZE) e.currentTarget.style.backgroundColor = COLORS.surface;
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
