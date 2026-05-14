import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDomains, getSections, getTopics, getTopicNotes, searchVault } from '../api/vault';
import Skeleton from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, FONTS, SPACE, SIZE, LABELS } from '../constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 48px)',
  },
  searchContainer: {
    padding: `${SPACE.md}px ${SPACE.lg}px`,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  searchInput: {
    width: '100%',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    outline: 'none',
  },
  columnsContainer: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  column: {
    flex: 1,
    padding: SPACE.lg,
    borderRight: `1px solid ${COLORS.border}`,
    overflowY: 'auto',
  },
  columnLast: {
    borderRight: 'none',
  },
  sectionHeader: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  row: {
    padding: `${SPACE.xs}px 0`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    cursor: 'pointer',
    borderRadius: 4,
    transition: 'background-color 0.2s',
  },
  rowHover: {
    backgroundColor: COLORS.surface,
  },
  rowSelected: {
    backgroundColor: COLORS.surface,
    color: COLORS.accent,
  },
  searchResult: {
    padding: `${SPACE.sm}px`,
    borderBottom: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  searchResultHover: {
    backgroundColor: COLORS.surface,
  },
  searchResultTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  searchResultMeta: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  errorContainer: {
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
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
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  noteRow: {
    padding: `${SPACE.sm}px`,
    borderRadius: 4,
    marginBottom: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  },
  noteRowHover: {
    backgroundColor: COLORS.surface,
    borderLeftColor: COLORS.accent,
  },
  noteTitle: {
    marginBottom: SPACE.xs,
    wordBreak: 'break-word',
  },
  noteMeta: {
    fontSize: SIZE.xs,
    color: COLORS.muted,
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  newLinesBadge: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    padding: `2px ${SPACE.xs}px`,
    borderRadius: 3,
    fontSize: SIZE.xs,
    fontWeight: 500,
  },
};

export default function VaultExplorer() {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput);

  const { data: domains, isLoading: domainsLoading, error: domainsError, refetch: refetchDomains } = useQuery({
    queryKey: ['vault', 'domains'],
    queryFn: getDomains
  });

  const { data: sections, isLoading: sectionsLoading, error: sectionsError, refetch: refetchSections } = useQuery({
    queryKey: ['vault', selectedDomain, 'sections'],
    queryFn: () => getSections(selectedDomain),
    enabled: !!selectedDomain && !debouncedSearch
  });

  const { data: topics, isLoading: topicsLoading, error: topicsError, refetch: refetchTopics } = useQuery({
    queryKey: ['vault', selectedDomain, selectedSection, 'topics'],
    queryFn: () => getTopics(selectedDomain, selectedSection),
    enabled: !!selectedDomain && !!selectedSection && !debouncedSearch
  });

  const { data: topicNotes, isLoading: topicNotesLoading, error: topicNotesError, refetch: refetchTopicNotes } = useQuery({
    queryKey: ['vault', selectedDomain, selectedSection, selectedTopic, 'notes'],
    queryFn: () => getTopicNotes(selectedDomain, selectedSection, selectedTopic),
    enabled: !!selectedDomain && !!selectedSection && !!selectedTopic && !debouncedSearch
  });

  useEffect(() => {
    if (!selectedSection) return;

    const selectedTopicStillExists = topics?.some((topic) => topic.name === selectedTopic);
    if (selectedTopicStillExists) return;

    setSelectedTopic(topics?.[0]?.name || '');
  }, [selectedSection, selectedTopic, topics]);

  const { data: searchResults, isLoading: searchLoading, error: searchError, refetch: refetchSearch } = useQuery({
    queryKey: ['vault', 'search', debouncedSearch],
    queryFn: () => searchVault(debouncedSearch),
    enabled: debouncedSearch.length > 0
  });

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
    setSelectedSection('');
    setSelectedTopic('');
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    setSelectedTopic('');
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    if (e.target.value) {
      setSelectedDomain('');
      setSelectedSection('');
      setSelectedTopic('');
    }
  };

  const renderError = (error, refetch) => (
    <div style={styles.errorContainer}>
      <div>{LABELS.error.generic}</div>
      <button style={styles.retryButton} onClick={refetch}>
        {LABELS.error.retry}
      </button>
    </div>
  );

  const renderLoading = () => <Skeleton count={5} height={32} />;

  const renderEmpty = (message) => (
    <div style={styles.emptyState}>{message}</div>
  );

  if (debouncedSearch) {
    return (
      <div style={styles.container}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search vault..."
            value={searchInput}
            onChange={handleSearchChange}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.columnsContainer}>
          <div style={{ ...styles.column, ...styles.columnLast }}>
            {searchError ? (
              renderError(searchError, refetchSearch)
            ) : searchLoading ? (
              renderLoading()
            ) : !searchResults || searchResults.length === 0 ? (
              renderEmpty(LABELS.empty.search)
            ) : (
              searchResults.map((result) => (
                <div
                  key={`${result.domain?.name || result.domain}-${result.section?.name || result.section}-${result.title}`}
                  style={styles.searchResult}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.surface}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={styles.searchResultTitle}>{result.title}</div>
                  <div style={styles.searchResultMeta}>
                    {[result.domain?.name || result.domain, result.section?.name || result.section, result.topic]
                      .filter(Boolean)
                      .join(' / ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search vault..."
          value={searchInput}
          onChange={handleSearchChange}
          style={styles.searchInput}
        />
      </div>
      
      <div style={styles.columnsContainer}>
        <div style={styles.column}>
          <h3 style={styles.sectionHeader}>Domains</h3>
          {domainsError ? (
            renderError(domainsError, refetchDomains)
          ) : domainsLoading ? (
            renderLoading()
          ) : !domains || domains.length === 0 ? (
            renderEmpty(LABELS.empty.domains)
          ) : (
            domains.map((domain) => (
              <div
                key={domain.name || domain}
                style={{
                  ...styles.row,
                  ...(selectedDomain === (domain.name || domain) ? styles.rowSelected : {}),
                }}
                onClick={() => handleDomainClick(domain.name || domain)}
                onMouseEnter={(e) => {
                  if (selectedDomain !== (domain.name || domain)) {
                    e.currentTarget.style.backgroundColor = COLORS.surface;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDomain !== (domain.name || domain)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {domain.name || domain}
                {domain.noteCount !== undefined && (
                  <span style={{ color: COLORS.muted }}> ({domain.noteCount})</span>
                )}
              </div>
            ))
          )}
        </div>

        <div style={styles.column}>
          <h3 style={styles.sectionHeader}>Sections</h3>
          {sectionsError ? (
            renderError(sectionsError, refetchSections)
          ) : sectionsLoading ? (
            renderLoading()
          ) : !sections || sections.length === 0 ? (
            renderEmpty(LABELS.empty.notes)
          ) : (
            sections.map((section) => (
              <div
                key={section.name || section}
                style={{
                  ...styles.row,
                  ...(selectedSection === (section.name || section) ? styles.rowSelected : {}),
                }}
                onClick={() => handleSectionClick(section.name || section)}
                onMouseEnter={(e) => {
                  if (selectedSection !== (section.name || section)) {
                    e.currentTarget.style.backgroundColor = COLORS.surface;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSection !== (section.name || section)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {section.name || section}
                {section.noteCount !== undefined && (
                  <span style={{ color: COLORS.muted }}> ({section.noteCount})</span>
                )}
              </div>
            ))
          )}
        </div>

        <div style={styles.column}>
          <h3 style={styles.sectionHeader}>Topics</h3>
          {!selectedSection ? (
            renderEmpty('Select a section to view topics.')
          ) : topicsError ? (
            renderError(topicsError, refetchTopics)
          ) : topicsLoading ? (
            renderLoading()
          ) : !topics || topics.length === 0 ? (
            renderEmpty('No topics in this section.')
          ) : (
            topics.map((topic) => (
              <div
                key={topic.name}
                style={{
                  ...styles.row,
                  ...(selectedTopic === topic.name ? styles.rowSelected : {}),
                }}
                onClick={() => handleTopicClick(topic.name)}
                onMouseEnter={(e) => {
                  if (selectedTopic !== topic.name) {
                    e.currentTarget.style.backgroundColor = COLORS.surface;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTopic !== topic.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {topic.name}
                <span style={{ color: COLORS.muted }}> ({topic.noteCount})</span>
              </div>
            ))
          )}
        </div>

        <div style={{ ...styles.column, ...styles.columnLast }}>
          <h3 style={styles.sectionHeader}>Notes</h3>
          {!selectedTopic ? (
            renderEmpty('Select a topic to view notes.')
          ) : topicNotesError ? (
            renderError(topicNotesError, refetchTopicNotes)
          ) : topicNotesLoading ? (
            renderLoading()
          ) : !topicNotes || topicNotes.length === 0 ? (
            renderEmpty(LABELS.empty.notes)
          ) : (
            topicNotes.map((note) => (
              <div
                key={note.id}
                style={styles.noteRow}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.surface;
                  e.currentTarget.style.borderLeftColor = COLORS.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                }}
              >
                <div style={styles.noteTitle}>
                  {note.title}
                </div>
                <div style={styles.noteMeta}>
                  <span>{note.id}</span>
                  {note.isNewLines && (
                    <span style={styles.newLinesBadge}>NEW LINES</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
