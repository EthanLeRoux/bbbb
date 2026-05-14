import { get, post } from './client';

// Returns note-level SR docs from review_stats where entityType === 'note'
// filtered to nextReviewAt <= now (overdue/due)
export const getNotesDueForReview = () =>
  get('/api/review-due?entityType=note');

// Returns the note SR doc for a single noteId slug
export const getNoteStats = (noteId) =>
  get(`/api/review-due/note/${encodeURIComponent(noteId)}`);

export const submitVaultTest = (data) => post('/api/vault-learning/submit-test', data);
export const getVaultReviewSchedule = (options = {}) => {
  const params = new URLSearchParams();
  if (options.timeRange) params.append('timeRange', options.timeRange);
  if (options.limit) params.append('limit', options.limit);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  
  const queryString = params.toString();
  return get(`/api/vault-learning/review-schedule${queryString ? `?${queryString}` : ''}`);
};
export const getVaultStats = (vaultId) => get(`/api/vault-learning/vault-stats/${encodeURIComponent(vaultId)}`);
export const getVaultTestHistory = (vaultId, limit = 10) =>
  get(`/api/vault-learning/test-history/${encodeURIComponent(vaultId)}?limit=${limit}`);
export const resubmitVaultTest = (data) => post('/api/vault-learning/resubmit-test', data);
export const getVaultResubmissionAnalytics = (vaultId) =>
  get(`/api/vault-learning/resubmission-analytics/${encodeURIComponent(vaultId)}`);
