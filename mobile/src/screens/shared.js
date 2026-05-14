export function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.tests)) return data.tests;
  if (Array.isArray(data?.attempts)) return data.attempts;
  if (Array.isArray(data?.notes)) return data.notes;
  if (Array.isArray(data?.domains)) return data.domains;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function itemTitle(item, fallback = 'Untitled') {
  if (typeof item === 'string') return item;
  return item?.name || item?.title || item?.domain?.name || item?.domain || fallback;
}
