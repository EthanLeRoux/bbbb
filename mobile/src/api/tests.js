import { del, get, post } from './client';

export const generateTest = (body) => post('/api/tests/generate', body);
export const getTests = (params) => get(`/api/tests?${new URLSearchParams(params)}`);
export const getTestById = (id) => get(`/api/tests/${id}`);
export const deleteTest = (id) => del(`/api/tests/${id}`);
export const getStats = () => get('/api/tests/stats');
