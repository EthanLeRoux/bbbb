import { get, post } from './client';

export const getDomains = () => get('/api/vault/domains');
export const getSections = (domain) => get(`/api/vault/${encodeURIComponent(domain)}`);
export const getTopics = (domain, section) =>
  get(`/api/vault/${encodeURIComponent(domain)}/${encodeURIComponent(section)}/topics`);
export const getNotes = (domain, section) =>
  get(`/api/vault/${encodeURIComponent(domain)}/${encodeURIComponent(section)}`);
export const getTopicNotes = (domain, section, topic) =>
  get(
    `/api/vault/${encodeURIComponent(domain)}/${encodeURIComponent(section)}/topics/${encodeURIComponent(topic)}`,
  );
export const getAllNotes = (limit = 100, offset = 0) => get(`/api/vault/notes?limit=${limit}&offset=${offset}`);
export const getCardWithState = (id) => get(`/api/vault/cards/${encodeURIComponent(id)}`);
export const syncVaultCards = () => post('/api/vault/sync', {});
export const searchVault = (q) => get(`/api/vault/search?q=${encodeURIComponent(q)}`);
