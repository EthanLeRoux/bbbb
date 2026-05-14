import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDomains, getSections, getTopics } from '../api/vault';
import { generateTest } from '../api/tests';
import Skeleton from '../components/Skeleton';
import { COLORS, FONTS, SPACE, SIZE, LABELS } from '../constants';

const styles = {
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: SPACE.xl,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xxl,
    color: COLORS.text,
    marginBottom: SPACE.xl,
  },
  formGroup: {
    marginBottom: SPACE.lg,
  },
  label: {
    display: 'block',
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  select: {
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
  checkboxContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
    maxHeight: 200,
    overflowY: 'auto',
    padding: SPACE.sm,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accent: COLORS.accent,
  },
  difficultyButtons: {
    display: 'flex',
    gap: SPACE.sm,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  difficultyButtonActive: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    borderColor: COLORS.accent,
  },
  numberInput: {
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
  submitButton: {
    width: '100%',
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
  generationStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    marginBottom: SPACE.md,
  },
  spinner: {
    width: 16,
    height: 16,
    border: `2px solid ${COLORS.border}`,
    borderTopColor: COLORS.accent,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flex: '0 0 auto',
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    padding: SPACE.md,
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    marginBottom: SPACE.md,
  },
  successContainer: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.success}`,
    borderRadius: 8,
    padding: SPACE.md,
    color: COLORS.success,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    marginBottom: SPACE.md,
  },
};

const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];

export default function GenerateTest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    sections: [],
    topics: {},
    allSections: false,
    difficulty: 'mixed',
    questionCount: 10,
  });

  const { data: domains, isLoading: domainsLoading, error: domainsError } = useQuery({
    queryKey: ['vault', 'domains'],
    queryFn: getDomains
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['vault', formData.domain, 'sections'],
    queryFn: () => getSections(formData.domain),
    enabled: !!formData.domain
  });

  const selectedSections = formData.allSections ? [] : formData.sections;
  const topicQueries = useQueries({
    queries: selectedSections.map((section) => ({
      queryKey: ['vault', formData.domain, section, 'topics'],
      queryFn: () => getTopics(formData.domain, section),
      enabled: !!formData.domain && !!section,
    })),
  });

  const topicsBySection = selectedSections.reduce((acc, section, index) => {
    acc[section] = topicQueries[index]?.data || [];
    return acc;
  }, {});
  const topicsLoading = topicQueries.some(query => query.isLoading);

  const mutation = useMutation({
    mutationFn: generateTest,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tests']);
      navigate(`/tests/${data.id}`);
    },
  });
  const isGenerating = mutation.isPending || mutation.isLoading;
  const generationError = mutation.error?.message || '';

  const handleDomainChange = (e) => {
    setFormData({
      ...formData,
      domain: e.target.value,
      sections: [],
      topics: {},
      allSections: false,
    });
  };

  const handleSectionToggle = (section) => {
    if (section === 'all') {
      setFormData({
        ...formData,
        allSections: !formData.allSections,
        sections: [],
        topics: {},
      });
    } else {
      const newSections = formData.sections.includes(section)
        ? formData.sections.filter(s => s !== section)
        : [...formData.sections, section];
      const newTopics = { ...formData.topics };
      if (!newSections.includes(section)) {
        delete newTopics[section];
      }
      
      setFormData({
        ...formData,
        sections: newSections,
        topics: newTopics,
        allSections: false,
      });
    }
  };

  const handleTopicToggle = (section, topic) => {
    const sectionTopics = formData.topics[section] || [];
    const newSectionTopics = sectionTopics.includes(topic)
      ? sectionTopics.filter(t => t !== topic)
      : [...sectionTopics, topic];
    const newTopics = { ...formData.topics };

    if (newSectionTopics.length > 0) {
      newTopics[section] = newSectionTopics;
    } else {
      delete newTopics[section];
    }

    setFormData({ ...formData, topics: newTopics });
  };

  const handleDifficultyChange = (difficulty) => {
    setFormData({ ...formData, difficulty });
  };

  const handleQuestionCountChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setFormData({
      ...formData,
      questionCount: Math.max(1, Math.min(30, value)),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedTopics = Object.fromEntries(
      Object.entries(formData.topics).filter(([, topics]) => topics.length > 0)
    );
    
    const payload = {
      name: formData.name || undefined,
      domain: formData.domain,
      sections: formData.allSections ? 'all' : formData.sections,
      topics: Object.keys(selectedTopics).length > 0 ? selectedTopics : undefined,
      difficulty: formData.difficulty,
      questionCount: formData.questionCount,
    };

    mutation.mutate(payload);
  };

  const isFormValid = formData.domain && 
    (formData.allSections || formData.sections.length > 0) &&
    formData.questionCount >= 1 && 
    formData.questionCount <= 30;

  if (domainsError) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          {LABELS.error.generic}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <h1 style={styles.title}>{LABELS.generate.title}</h1>
      
      <form onSubmit={handleSubmit}>
        {isGenerating && (
          <div style={styles.generationStatus} role="status" aria-live="polite">
            <span style={styles.spinner} />
            <span>Generating your test with AI. This can take a moment...</span>
          </div>
        )}

        {mutation.isSuccess && !isGenerating && (
          <div style={styles.successContainer} role="status" aria-live="polite">
            Test generated. Opening it now...
          </div>
        )}

        {mutation.isError && !isGenerating && (
          <div style={styles.errorContainer} role="alert">
            {generationError || 'Failed to generate test. Please try again.'}
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Test Name (Optional)</label>
          <input
            type="text"
            placeholder="Enter a custom name for this test"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.select}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{LABELS.generate.domain}</label>
          {domainsLoading ? (
            <Skeleton height={40} />
          ) : (
            <select
              value={formData.domain}
              onChange={handleDomainChange}
              style={styles.select}
              required
            >
              <option value="">Select domain</option>
              {domains?.map((domain) => (
                <option key={domain.name || domain} value={domain.name || domain}>
                  {domain.name || domain}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{LABELS.generate.sections}</label>
          {formData.domain ? (
            sectionsLoading ? (
              <Skeleton height={120} />
            ) : (
              <div style={styles.checkboxContainer}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.allSections}
                    onChange={() => handleSectionToggle('all')}
                    style={styles.checkbox}
                  />
                  {LABELS.generate.allSections}
                </label>
                {sections?.map((section) => (
                  <label key={section.name || section} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.sections.includes(section.name || section)}
                      onChange={() => handleSectionToggle(section.name || section)}
                      disabled={formData.allSections}
                      style={styles.checkbox}
                    />
                    {section.name || section}
                  </label>
                ))}
              </div>
            )
          ) : (
            <div style={{ ...styles.checkboxContainer, justifyContent: 'center', color: COLORS.muted }}>
              Select a domain first
            </div>
          )}
        </div>

        {!formData.allSections && formData.sections.length > 0 && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Topics</label>
            {topicsLoading ? (
              <Skeleton height={120} />
            ) : (
              <div style={styles.checkboxContainer}>
                {selectedSections.map((section) => {
                  const sectionTopics = topicsBySection[section] || [];
                  return (
                    <div key={section}>
                      <div style={{ ...styles.label, marginBottom: SPACE.xs }}>
                        {section}
                      </div>
                      {sectionTopics.length === 0 ? (
                        <div style={{ color: COLORS.muted, fontFamily: FONTS.mono, fontSize: SIZE.sm }}>
                          No topics found
                        </div>
                      ) : (
                        sectionTopics.map((topic) => (
                          <label key={`${section}-${topic.name}`} style={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={(formData.topics[section] || []).includes(topic.name)}
                              onChange={() => handleTopicToggle(section, topic.name)}
                              style={styles.checkbox}
                            />
                            {topic.name}
                            {topic.noteCount !== undefined && (
                              <span style={{ color: COLORS.muted }}>({topic.noteCount})</span>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>{LABELS.generate.difficulty}</label>
          <div style={styles.difficultyButtons}>
            {DIFFICULTIES.map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                onClick={() => handleDifficultyChange(difficulty)}
                style={{
                  ...styles.difficultyButton,
                  ...(formData.difficulty === difficulty ? styles.difficultyButtonActive : {}),
                }}
              >
                {LABELS.difficulty[difficulty]}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>{LABELS.generate.count}</label>
          <input
            type="number"
            min="1"
            max="30"
            value={formData.questionCount}
            onChange={handleQuestionCountChange}
            style={styles.numberInput}
            required
          />
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isGenerating}
          style={{
            ...styles.submitButton,
            ...(isGenerating || !isFormValid ? styles.submitButtonDisabled : {}),
          }}
        >
          {isGenerating ? LABELS.generate.generating : LABELS.generate.submit}
        </button>
      </form>
    </div>
  );
}
