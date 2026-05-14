import { get, post } from './client';

export const submitTest = (data) => post('/api/spaced-repetition/submit-test', data);
export const getReviewSchedule = (limit = 10) => 
  get(`/api/spaced-repetition/review-schedule?limit=${limit}`);
export const getUserStats = () => get('/api/spaced-repetition/user-stats');
export const getEntityStats = (entityType, entityId) => 
  get(`/api/spaced-repetition/entity-stats/${entityType}/${entityId}`);
export const getTestHistory = (limit = 5, entityType, entityId) => {
  let url = `/api/spaced-repetition/test-history?limit=${limit}`;
  if (entityType) url += `&entityType=${entityType}`;
  if (entityId) url += `&entityId=${entityId}`;
  return get(url);
};
