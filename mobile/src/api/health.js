import { get } from './client';

export function getHealth() {
  return get('/api/health');
}
