import { get } from './client';
export const getDomains  = ()                => get('/api/vault/domains');
export const getSections = (domain)          => get(`/api/vault/${domain}`);
export const getNotes    = (domain, section) => get(`/api/vault/${domain}/${encodeURIComponent(section)}`);
export const searchVault = (q)               => get(`/api/vault/search?q=${encodeURIComponent(q)}`);
