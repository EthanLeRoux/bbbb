const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function buildUrl(path) {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  const normalizedBaseUrl = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, options = {}) {
  const { headers, ...requestOptions } = options;

  const response = await fetch(buildUrl(path), {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const fallbackMessage =
      typeof data === 'string' && data ? data : response.statusText || `Request failed with status ${response.status}`;
    const message = data?.error || data?.message || fallbackMessage;
    throw new Error(message);
  }

  return data?.data ?? data;
}

export const get = (path) => apiRequest(path);

export const post = (path, body) =>
  apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const del = (path) =>
  apiRequest(path, {
    method: 'DELETE',
  });

export function getApiBaseUrl() {
  return API_BASE_URL;
}
