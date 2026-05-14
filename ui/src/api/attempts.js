import { get, post } from './client';
export const startAttempt  = (testId)            => post('/api/attempt/start', { testId });
export const submitAttempt = (body)              => post('/api/attempt/submit', body);
export const getAttempts   = (params)            => get(`/api/attempt?${new URLSearchParams(params)}`);
export const getAttemptById = (id)               => get(`/api/attempt/${id}`);
export const getAttemptStats = ()                => get('/api/attempt/stats');
export const remarkAttempt = (attemptId)         => post(`/api/attempt/${attemptId}/remark`, {});
