import type { FastifyInstance } from 'fastify';
import { findProduct } from '../productFinder.js';
import { recognizeFoodImage } from '../openai.js';

async function buildRecognitionResponse(buf: Buffer, mimetype: string) {
  const recognition = await recognizeFoodImage(buf, mimetype);

  if (!recognition.isFood) {
    return { recognition, matches: [] };
  }

  const names = [
    recognition.nameEn,
    recognition.nameZh,
    // 加一个简短版本：只取前3个词
    recognition.nameEn?.split(' ').slice(0, 3).join(' '),
    ...(recognition.brand ? [
      recognition.brand,
      `${recognition.brand} ${recognition.nameEn?.split(' ').slice(-2).join(' ')}`,
    ] : []),
    ...recognition.alternatives.flatMap(a => [a.nameEn, a.nameZh]),
  ].filter(Boolean);

  const result = await findProduct({ 
    barcode: recognition.barcode ?? undefined, 
    names 
  });
  console.log('Recognition result:', JSON.stringify(recognition));
  if (result) {
    return { recognition, matches: [result.product], source: result.source };
  }

  return { recognition, matches: [] };
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '::1' || h.endsWith('.local') || h.endsWith('.internal')) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 127 || a === 10 || a === 0 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

export default async function recognizeRoutes(app: FastifyInstance) {
  app.post('/recognize/photo', async (req, reply) => {
    const file = await req.file({ limits: { fileSize: MAX_IMAGE_BYTES } });
    if (!file) return reply.code(400).send({ error: '缺少图片文件' });
    if (!/^image\//.test(file.mimetype)) return reply.code(400).send({ error: '仅支持图片文件' });

    const buf = await file.toBuffer();
    try {
      return await buildRecognitionResponse(buf, file.mimetype);
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      return reply.code(err.statusCode ?? 502).send({ error: `识别失败: ${err.message}` });
    }
  });

  app.post('/recognize/url', async (req, reply) => {
    const { url } = (req.body ?? {}) as { url?: string };
    if (!url || typeof url !== 'string') return reply.code(400).send({ error: '缺少图片地址' });

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return reply.code(400).send({ error: '图片地址非法' });
    }
    if (!/^https?:$/.test(parsed.protocol) || isPrivateHost(parsed.hostname)) {
      return reply.code(400).send({ error: '仅支持公网 http/https 图片地址' });
    }

    let res: Response;
    try {
      res = await fetch(parsed, {
        headers: { 'User-Agent': 'NutriKids/0.1 (dev)', Accept: 'image/*' },
        signal: AbortSignal.timeout(15_000),
        redirect: 'follow',
      });
    } catch {
      return reply.code(502).send({ error: '图片下载失败（链接可能已失效或源站拒绝访问）' });
    }
    if (!res.ok) return reply.code(502).send({ error: `图片下载失败（源站返回 ${res.status}）` });

    const mimetype = res.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    if (!/^image\//.test(mimetype)) return reply.code(400).send({ error: '该链接不是图片' });

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return reply.code(400).send({ error: '图片超过 8MB 限制' });

    try {
      return await buildRecognitionResponse(buf, mimetype);
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      return reply.code(err.statusCode ?? 502).send({ error: `识别失败: ${err.message}` });
    }
  });

  app.get('/barcode/:code', async (req, reply) => {
    const code = String((req.params as { code: string }).code).replace(/\D/g, '');
    if (code.length < 6) return reply.code(400).send({ error: '条形码非法' });

    const result = await findProduct({ barcode: code });

    if (result) {
      return { source: result.source, product: result.product };
    }

    return reply.code(404).send({ error: '未找到该条形码对应的产品' });
  });
}