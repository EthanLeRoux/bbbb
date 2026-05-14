import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDomains, getSections } from '../api/vault';
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
};

const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];

export default function GenerateTest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    sections: [],
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

  const mutation = useMutation({
    mutationFn: generateTest,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tests']);
      navigate(`/tests/${data.id}`);
    },
  });

  const handleDomainChange = (e) => {
    setFormData({
      ...formData,
      domain: e.target.value,
      sections: [],
      allSections: false,
    });
  };

  const handleSectionToggle = (section) => {
    if (section === 'all') {
      setFormData({
        ...formData,
        allSections: !formData.allSections,
        sections: [],
      });
    } else {
      const newSections = formData.sections.includes(section)
        ? formData.sections.filter(s => s !== section)
        : [...formData.sections, section];
      
      setFormData({
        ...formData,
        sections: newSections,
        allSections: false,
      });
    }
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
    
    const payload = {
      name: formData.name || undefined,
      domain: formData.domain,
      sections: formData.allSections ? 'all' : formData.sections,
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
      <h1 style={styles.title}>{LABELS.generate.title}</h1>
      
      <form onSubmit={handleSubmit}>
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
          disabled={!isFormValid || mutation.isLoading}
          style={{
            ...styles.submitButton,
            ...(mutation.isLoading || !isFormValid ? styles.submitButtonDisabled : {}),
          }}
        >
          {mutation.isLoading ? LABELS.generate.generating : LABELS.generate.submit}
        </button>
      </form>
    </div>
  );
}
