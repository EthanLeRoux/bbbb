const BASE = import.meta.env.VITE_API_BASE_URL;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const json = await res.json();
  return json.data ?? json;
}

export const get  = (path)       => request(path);
export const post = (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) });
export const del  = (path)       => request(path, { method: 'DELETE' });
