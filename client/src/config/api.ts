export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '';
    }
  }
  return 'http://localhost:5001';
};

const SESSION_KEY = 'apticode-user-session';

export interface SessionUser {
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  token: string;
  refreshToken?: string;
  isOnboarded?: boolean;
  onboardingCompleted?: boolean;
}

export function getSession(): SessionUser | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && typeof parsed.token === 'string' ? (parsed as SessionUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: any;

  constructor(status: number, message: string, payload?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function emitSessionExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apticode:session-expired'));
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  const session = getSession();
  if (!session?.refreshToken) return null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body || body.status !== 'success' || !body.token) return null;
    saveSession({
      ...session,
      token: body.token,
      refreshToken: body.refreshToken || session.refreshToken
    });
    return body.token;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let url = endpoint;
  if (!url.startsWith('http')) {
    if (!url.startsWith('/api/')) {
      url = url.startsWith('/') ? `/api${url}` : `/api/${url}`;
    }
    url = `${getApiBaseUrl()}${url}`;
  }

  const withAuth = (token?: string): RequestInit => {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return { ...options, headers };
  };

  let response = await fetch(url, withAuth(getSession()?.token || undefined));

  const session = getSession();
  if (response.status === 401 && session?.refreshToken) {
    refreshPromise ??= attemptRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (newToken) {
      response = await fetch(url, withAuth(newToken));
    } else {
      emitSessionExpired();
    }
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload && typeof payload === 'object' && typeof (payload as any).message === 'string'
        ? (payload as any).message
        : `HTTP error ${response.status}`,
      payload
    );
  }

  if (payload && typeof payload === 'object' && (payload as any).status === 'fail') {
    throw new ApiError(response.status, (payload as any).message || 'Request failed', payload);
  }

  return payload as T;
}

export async function logout(): Promise<void> {
  const session = getSession();
  await apiFetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: session?.refreshToken ? JSON.stringify({ refreshToken: session.refreshToken }) : undefined
  });
}

export async function safeFetch(endpoint: string, options?: RequestInit): Promise<any> {
  return apiFetch(endpoint, options);
}
