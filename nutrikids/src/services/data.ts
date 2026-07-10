// ============================================================
// 数据访问层：调用 NutriKids REST API (Fastify + Prisma + SQLite)
// JWT 存 localStorage，自动带到 Authorization 头。
// ============================================================
//const BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8787';
const BASE = '';  // 空字符串，走 Vite proxy
const TOKEN_KEY = 'nutrikids_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include', 
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

// ---------- 鉴权 ----------
export async function register(email: string, password: string) {
  const data = await request<{ token: string; user: unknown }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}
export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: unknown }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}
export function logout() {
  setToken(null);
}
export const me = () => request<{ user: unknown }>('/auth/me');

// ---------- 孩子档案 ----------
export const fetchChildren = () => request<unknown[]>('/children');
export const createChild = (body: Record<string, unknown>) =>
  request('/children', { method: 'POST', body: JSON.stringify(body) });

// ---------- 产品 ----------
export const searchFood = (query: string) =>
  query ? request<unknown[]>(`/products/search?q=${encodeURIComponent(query)}`) : Promise.resolve([]);
export const fetchFoodFact = (productId: number) => request(`/products/${productId}`);

// ---------- 个性化评分 ----------
export const scoreFood = (body: {
  childId: string;
  productId: number;
  source?: 'search' | 'barcode' | 'photo';
  imagePath?: string;
}) => request('/analyses', { method: 'POST', body: JSON.stringify(body) });

export const fetchAnalysis = (id: string) => request(`/analyses/${id}`);
export const fetchAnalyses = () => request<unknown[]>('/analyses');

// ---------- 管理后台：外部数据源 ----------
export interface DataSourceMeta {
  id: string;
  name: string;
  nameZh: string;
  org: string;
  homeUrl: string;
  testUrl: string;
  kind: 'api' | 'html';
  note: string;
}
export interface DataSourceTestResult {
  id: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  contentType: string | null;
  bytes: number;
  sample: { type: string; title?: string | null; url?: string | null; excerpt?: string | null } | null;
  error: string | null;
}
export const fetchDataSources = () =>
  request<{ sources: DataSourceMeta[] }>('/admin/datasources');
export const testDataSource = (id: string) =>
  request<DataSourceTestResult>(`/admin/datasources/${id}/test`);

// ---------- 反馈 ----------
export interface FeedbackSubmission {
  text: string;
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  q5?: string;
  comment?: string;
}

export interface FeedbackItem {
  id: string;
  userId: string | null;
  text: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q5: string | null;
  comment: string | null;
  createdAt: string;
  user?: { email: string; displayName: string | null };
}

export interface FeedbackStats {
  total: number;
  q1: { value: string | null; count: number }[];
  q2: { value: string | null; count: number }[];
  q3: { value: string | null; count: number }[];
  q4: { value: string | null; count: number }[];
  q5: { value: string | null; count: number }[];
  avgNPS: number;
}

export const submitFeedback = (data: FeedbackSubmission) =>
  request('/feedback', { method: 'POST', body: JSON.stringify(data) });

export const fetchFeedbacks = () =>
  request<{ feedbacks: FeedbackItem[] }>('/api/admin/feedback');

export const fetchFeedbackStats = () =>
  request<FeedbackStats>('/api/admin/feedback/stats');