import type { FastifyInstance } from 'fastify';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ============================================================
// 管理后台：外部权威数据源连通性测试
// 4 个数据源均无 CORS / 无统一 API，浏览器无法直连，
// 由后端代理发起请求，返回状态、延迟与抽样数据。
// ============================================================

interface SourceMeta {
  id: string;
  name: string;
  nameZh: string;
  org: string;
  homeUrl: string;   // 展示给用户的入口
  testUrl: string;   // 实际探测的地址
  kind: 'api' | 'html';
  note: string;
}

const SOURCES: SourceMeta[] = [
  {
    id: 'nih-ods',
    name: 'NIH Office of Dietary Supplements',
    nameZh: 'NIH 膳食补充剂办公室（微量营养素）',
    org: 'National Institutes of Health',
    homeUrl: 'https://ods.od.nih.gov/factsheets/list-all/',
    testUrl: 'https://ods.od.nih.gov/api/?resourcename=Calcium&readinglevel=Consumer&outputformat=JSON',
    kind: 'api',
    note: '唯一提供官方 JSON API 的数据源（Fact Sheet API），按营养素名查询。',
  },
  {
    id: 'jecfa',
    name: 'JECFA Food Additives Database',
    nameZh: 'JECFA 食品添加剂数据库（ADI）',
    org: 'Joint FAO/WHO Expert Committee on Food Additives',
    homeUrl: 'https://apps.who.int/food-additives-contaminants-jecfa-database/',
    testUrl: 'https://apps.who.int/food-additives-contaminants-jecfa-database/',
    kind: 'html',
    note: '无 API，仅在线检索网站；正式接入需按 INS 编号做一次性抓取后导入本地库。',
  },
  {
    id: 'fda',
    name: 'FDA Food Additive Status List',
    nameZh: 'FDA 食品添加剂法规状态清单',
    org: 'U.S. Food and Drug Administration',
    homeUrl: 'https://www.fda.gov/food/food-additives-petitions/food-additive-status-list',
    testUrl: 'https://www.fda.gov/food/food-additives-petitions/food-additive-status-list',
    kind: 'html',
    note: '单页 HTML 清单（按字母排列，含 21 CFR 条款号）；正式接入需解析页面后导入本地库。',
  },
  {
    id: 'efsa',
    name: 'EFSA Food Additives',
    nameZh: 'EFSA 欧洲食品添加剂评估',
    org: 'European Food Safety Authority',
    homeUrl: 'https://www.efsa.europa.eu/en/topics/topic/food-additives',
    testUrl: 'https://www.efsa.europa.eu/en/topics/topic/food-additives',
    kind: 'html',
    note: '评估报告为主；结构化的 E 编号许可数据在欧委会 Food Additives Database，需抓取导入。',
  },
];

const htmlTitle = (html: string) =>
  /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? null;

/** 去标签取正文片段，用于抽样展示 */
function textSnippet(html: string, max = 400) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
};

/** Cloudflare 等 WAF 对 Node fetch 的 TLS 指纹质询页 */
const isChallenge = (status: number, body: string) =>
  (status === 403 || status === 503) && /just a moment|cf-challenge|cloudflare/i.test(body);

interface RawResult { status: number; body: string; contentType: string | null }

async function fetchRaw(url: string): Promise<RawResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS });
    return { status: res.status, body: await res.text(), contentType: res.headers.get('content-type') };
  } finally {
    clearTimeout(timer);
  }
}

/** 回退方案：系统 curl 的 TLS 指纹可通过 WAF（NIH ODS 需要） */
async function curlRaw(url: string): Promise<RawResult> {
  const args = [
    '-s', '-m', '15', '-A', BROWSER_HEADERS['User-Agent'],
    '-H', `Accept: ${BROWSER_HEADERS.Accept}`,
    '-H', `Accept-Language: ${BROWSER_HEADERS['Accept-Language']}`,
    '-w', '\n__HTTP_STATUS__:%{http_code}:%{content_type}',
    url,
  ];
  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 20 * 1024 * 1024 });
  const m = /\n__HTTP_STATUS__:(\d+):(.*)$/.exec(stdout);
  return {
    status: m ? Number(m[1]) : 0,
    body: m ? stdout.slice(0, m.index) : stdout,
    contentType: m?.[2] || null,
  };
}

async function probe(src: SourceMeta) {
  const started = Date.now();
  try {
    let raw = await fetchRaw(src.testUrl);
    if (isChallenge(raw.status, raw.body)) raw = await curlRaw(src.testUrl);
    const latencyMs = Date.now() - started;
    const { status, body, contentType } = raw;

    let sample: unknown = null;
    if (src.kind === 'api') {
      try {
        const json = JSON.parse(body);
        // NIH ODS Fact Sheet API：返回 FactSheet 对象（Title / Content 等）
        const fs = Array.isArray(json) ? json[0] : json;
        sample = {
          type: 'json',
          title: fs?.Title ?? fs?.title ?? null,
          url: fs?.URL ?? null,
          excerpt: typeof fs?.Content === 'string' ? textSnippet(fs.Content, 400) : null,
        };
      } catch {
        // ODS API 实际返回 Factsheet XML（即使请求 outputformat=JSON）
        const title = /<Title>([\s\S]*?)<\/Title>/i.exec(body)?.[1]?.trim() ?? null;
        const url = /<URL>([\s\S]*?)<\/URL>/i.exec(body)?.[1]?.trim() ?? null;
        const content = /<Content>([\s\S]*?)<\/Content>/i.exec(body)?.[1] ?? body;
        sample = { type: 'xml', title, url, excerpt: textSnippet(content, 400) };
      }
    } else {
      sample = { type: 'html', title: htmlTitle(body), excerpt: textSnippet(body) };
    }

    return {
      id: src.id,
      ok: status >= 200 && status < 300,
      status,
      latencyMs,
      contentType,
      bytes: body.length,
      sample,
      error: null as string | null,
    };
  } catch (e) {
    return {
      id: src.id,
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      contentType: null,
      bytes: 0,
      sample: null,
      error: e instanceof Error ? (e.name === 'AbortError' ? '请求超时(15s)' : e.message) : String(e),
    };
  }
}

export default async function adminRoutes(app: FastifyInstance) {
  // 数据源元信息列表
  app.get('/admin/datasources', async () => ({ sources: SOURCES }));

  // 单个数据源连通性测试
  app.get<{ Params: { id: string } }>('/admin/datasources/:id/test', async (req, reply) => {
    const src = SOURCES.find((s) => s.id === req.params.id);
    if (!src) return reply.code(404).send({ error: '未知数据源' });
    return probe(src);
  });
}
