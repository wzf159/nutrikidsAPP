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
import adminAuthRoutes from './routes/admin-auth.js';
import recognizeRoutes from './routes/recognize.js';
import { registerFoodScoringRoutes } from "./scoring/food-scoring-routes.js";
import { prisma } from './prisma.js';

// A local-only testing mode. It must be explicitly enabled and is never
// available when NODE_ENV is production.
const devBypassAuth =
  process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true';
const devUserId = 'local-dev-user';

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

if (devBypassAuth) {
  await prisma.user.upsert({
    where: { id: devUserId },
    update: {},
    create: {
      id: devUserId,
      email: 'local-dev@nutrikids.test',
      name: 'Local Developer',
      displayName: 'Local Developer',
    },
  });
  app.log.warn('DEV_BYPASS_AUTH is enabled; all protected requests use the local test user.');
}

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
  credentials: true,
});

await app.register(multipart);

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
});

app.decorate('authenticate', async (req: any, reply: any) => {
  if (devBypassAuth) {
    req.userId = devUserId;
    req.user = { sub: devUserId };
    return;
  }

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

app.decorate('authenticateAdmin', async (req: any, reply: any) => {
  try {
    await req.jwtVerify();
    if (req.user.role !== 'admin') throw new Error('not admin');
  } catch {
    return reply.code(401).send({ error: '需要管理员登录。' });
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
await app.register(adminAuthRoutes, { prefix: '/api' });
await app.register(recognizeRoutes, { prefix: '/api' });
await app.register(authRoutes, { prefix: '/api' });

registerFoodScoringRoutes(app);

const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`NutriKids API on http://localhost:${port}`);
});
