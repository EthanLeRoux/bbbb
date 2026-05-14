import { get, post } from './client';

export const generateSchedule = (options = {}) =>
  post('/api/review-schedule/generate', options);

export const getDomainSchedule = (domain, options = {}) => {
  const params = new URLSearchParams(options).toString();
  return get(`/api/review-schedule/domain/${domain}${params ? `?${params}` : ''}`);
};

export const getSectionSchedule = (domain, section, options = {}) => {
  const params = new URLSearchParams(options).toString();
  return get(`/api/review-schedule/domain/${domain}/section/${section}${params ? `?${params}` : ''}`);
};

export const getOverdueItems = (options = {}) => {
  const params = new URLSearchParams(options).toString();
  return get(`/api/review-schedule/overdue${params ? `?${params}` : ''}`);
};

export const getTopPriorityConcepts = (count = 10, options = {}) => {
  const params = new URLSearchParams({ ...options, count }).toString();
  return get(`/api/review-schedule/top-priority?${params}`);
};