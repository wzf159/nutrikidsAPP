import Fastify from 'fastify';
import allergensRoutes from './routes/allergens.js';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import './types.js';
import authRoutes from './routes/auth.js';
import childrenRoutes from './routes/children.js';
import productRoutes from './routes/products.js';
import analysisRoutes from './routes/analyses.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';
import multipart from '@fastify/multipart';
import recognizeRoutes from './routes/recognize.js';

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  credentials: true,
});

await app.register(multipart);

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
});

// authenticate 装饰器：校验 Bearer JWT
app.decorate('authenticate', async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ error: '未登录或令牌无效' });
  }
});

app.get('/health', async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(childrenRoutes);
await app.register(allergensRoutes);  
await app.register(productRoutes);
await app.register(analysisRoutes);
await app.register(feedbackRoutes);
await app.register(adminRoutes);
await app.register(recognizeRoutes);

const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`NutriKids API on http://localhost:${port}`);
});
