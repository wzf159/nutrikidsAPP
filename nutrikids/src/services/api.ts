/* ================================================================
 * 真实后端 API（server/，经 vite 代理 /api → http://localhost:8787）
 * ================================================================ */

const API = '/api';

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...(init?.headers ?? {}) },
  });
  return res;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `请求失败 (${res.status})`);
  }
  return res.json();
}

export interface ProductMatch {
  id: number;
  name: string;
  nameZh: string | null;
  imageUrl: string | null;
  brand?: { name: string } | null;
}

export interface Recognition {
  isFood: boolean;
  kind: 'packaged' | 'whole' | 'dish';
  nameEn: string;
  nameZh: string;
  brand: string | null;
  barcode: string | null;
  confidence: number;
  alternatives: { nameEn: string; nameZh: string }[];
}

export interface AnalysisView {
  product: {
    id: number; name: string; nameZh: string | null; brand: string | null;
    category: string | null; categoryZh: string | null; imageUrl: string | null;
    novaScore: number | null; servingSize: string | null;
    verified: boolean; 
  };
  child: { id: string; name: string; age: number | null };
  allergenSafe: boolean;
  matchedAllergens: { code: string; name: string; nameZh: string | null; icon: string | null }[];
  goals: { id: number; icon: string | null; label: string; labelZh: string | null; selected: boolean; tier: 'core' | 'important' | 'supporting' | null; supportDV: number }[];
  nutrients: { id: number; name: string; nameZh: string | null; icon: string | null; value: number | null; unit: string | null; dailyValue: number; level: 'High' | 'Moderate' | 'Low' }[];
  flows: { goalId: number; nutrientId: number; value: number }[];
  watch: { code: string; icon: string; name: string; nameZh: string; present: boolean; detail: string; detailZh: string }[];
}

export interface AnalysisResult {
  analysisId: string;
  overallScore: number;
  grade: string;
  view: AnalysisView;
}
export interface Child {
  id: string;
  name: string;
  age: number | null;
  ageMonths: number | null;
  gender: 'boy' | 'girl' | 'other' | null;
  heightCm: number | null;
  weightKg: number | null;
  stageKey: string | null;
  avatarEmoji: string | null;
  allergens: { allergenId: number }[];
}

export interface ChildInput {
  name: string;
  age?: number;
  ageMonths?: number;
  gender?: 'boy' | 'girl' | 'other';
  heightCm?: number;
  weightKg?: number;
  stageKey?: string;
  avatarEmoji?: string;
  allergenIds?: number[];
}

export interface Allergen {
  id: number;
  code: string;
  name: string;
  nameZh: string | null;
  icon: string | null;
}

export async function getAllergens() {
  return asJson<Allergen[]>(await authedFetch('/allergens'));
}

export async function getChildren() {
  return asJson<Child[]>(await authedFetch('/children'));
}

export async function createChild(input: ChildInput) {
  return asJson<Child>(await authedFetch('/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }));
}

export async function updateChild(id: string, input: Partial<ChildInput>) {
  return asJson<Child>(await authedFetch(`/children/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }));
}

export interface AISummary {
  recommended: 'yes' | 'no' | 'caution';
  benefits: string[];
  concerns: string[];
  summary: string;
}

export async function getAISummary(productName: string, childId: string): Promise<AISummary> {
  const res = await authedFetch('/analyses/ai-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName, childId }),
  });
  return asJson<AISummary>(res);
}

export async function recognizePhoto(file: File): Promise<{ recognition: Recognition; matches: ProductMatch[]; source?: 'local' | 'openfoodfacts' | 'ai' }> {
  const form = new FormData();
  form.append('file', file);
  return asJson(await fetch(`${API}/recognize/photo`, { method: 'POST', body: form }));
}

export async function recognizeImageUrl(url: string): Promise<{ recognition: Recognition; matches: ProductMatch[]; source?: 'local' | 'openfoodfacts' | 'ai' }> {
  return asJson(await fetch(`${API}/recognize/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }));
}

export async function lookupBarcode(code: string): Promise<{ source: string; product: ProductMatch }> {
  return asJson(await fetch(`${API}/barcode/${encodeURIComponent(code)}`));
}

export async function searchProducts(q: string): Promise<ProductMatch[]> {
  if (!q.trim()) return [];
  return asJson(await fetch(`${API}/products/search?q=${encodeURIComponent(q)}`));
}

export async function analyzeProduct(childId: string, productId: number, source: 'search' | 'barcode' | 'photo'): Promise<AnalysisResult> {
  return asJson(await authedFetch('/analyses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId, productId, source }),
  }));
}

/* ================================================================
 * 以下为原型期 mock 接口（其余页面仍在使用，逐步迁移后删除）
 * ================================================================ */

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export async function fetchFood() {
  await delay();
  const res = await fetch('/mock/food.json');
  return res.json();
}

export async function fetchScore() {
  await delay(300);
  const res = await fetch('/mock/score.json');
  return res.json();
}

export async function fetchChildProfile() {
  await delay(200);
  const res = await fetch('/mock/childProfile.json');
  return res.json();
}

export async function fetchNutrition() {
  await delay(350);
  const res = await fetch('/mock/nutrition.json');
  return res.json();
}

export async function searchFood(query: string) {
  await delay(200);
  const res = await fetch('/mock/food.json');
  const data = await res.json();
  if (!query) return [];
  return (data.searchSuggestions as Array<{ name: string; brand: string; id: string }>)
    .filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.brand.toLowerCase().includes(query.toLowerCase())
    );
}

export async function fetchFoodFact() {
  await delay(300);
  const res = await fetch('/mock/foodfact.json');
  return res.json();
}
