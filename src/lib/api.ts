// Tiny fetch wrapper. Attaches Clerk session token if a getter is registered.

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

export function setTokenGetter(fn: TokenGetter) {
  tokenGetter = fn;
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (tokenGetter) {
    const t = await tokenGetter();
    if (t) headers.set('Authorization', `Bearer ${t}`);
  }
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${init.method || 'GET'} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
