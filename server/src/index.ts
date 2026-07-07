import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { auth } from './auth.js';
import './types.js';
import authRoutes from './routes/auth.js';
import childrenRoutes from './routes/children.js';
import allergensRoutes from './routes/allergens.js';
import productRoutes from './routes/products.js';
import analysisRoutes from './routes/analyses.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';
import recognizeRoutes from './routes/recognize.js';

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
  credentials: true,
});

await app.register(multipart);

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
});

app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (!session) {
      reply.code(401).send({ error: '未登录' });
      return;
    }
    req.userId = session.user.id;
    req.user = { sub: session.user.id };  
  } catch (e) {
    console.error('auth error:', e);
    reply.code(401).send({ error: '未登录' });
  }
});
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
  // Better Auth 路由返回 buffer，其他路由正常解析
  if (req.url?.startsWith('/api/auth/')) {
    done(null, body);
  } else {
    try {
      done(null, JSON.parse(body.toString()));
    } catch (e) {
      done(null, body);
    }
  }
});
const authHandler = async (req: any, reply: any) => {
  const url = `http://localhost:8787${req.url}`;
  const headers = new Headers();
  Object.entries(req.headers).forEach(([k, v]) => {
    if (v) headers.set(k, Array.isArray(v) ? v.join(',') : v as string);
  });

  const body = Buffer.isBuffer(req.body) ? req.body : undefined;

  const webRequest = new Request(url, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
  });

  const response = await auth.handler(webRequest);
  reply.status(response.status);
  response.headers.forEach((v: string, k: string) => reply.header(k, v));
  reply.send(await response.text());
};

app.get('/api/auth/*', authHandler);
app.post('/api/auth/*', authHandler);
app.options('/api/auth/*', authHandler);

app.get('/health', async () => ({ ok: true }));

await app.register(authRoutes);

await app.register(childrenRoutes, { prefix: '/api' });
await app.register(allergensRoutes, { prefix: '/api' });
await app.register(productRoutes, { prefix: '/api' });
await app.register(analysisRoutes, { prefix: '/api' });
await app.register(feedbackRoutes, { prefix: '/api' });
await app.register(adminRoutes, { prefix: '/api' });
await app.register(recognizeRoutes, { prefix: '/api' });
await app.register(authRoutes, { prefix: '/api' });

const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`NutriKids API on http://localhost:${port}`);
});
