import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
  locale: z.string().optional(),
});

export default async function authRoutes(app: FastifyInstance) {
  // 注册
  app.post('/auth/register', async (req, reply) => {
    const parsed = credSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { email, password, displayName, locale } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return reply.code(409).send({ error: '邮箱已注册' });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        displayName: displayName ?? email.split('@')[0],
        locale: locale ?? 'en',
      },
      select: { id: true, email: true, displayName: true, locale: true },
    });
    const token = app.jwt.sign({ sub: user.id });
    return reply.code(201).send({ token, user });
  });

  // 登录
  app.post('/auth/login', async (req, reply) => {
    const parsed = credSchema.pick({ email: true, password: true }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
      return reply.code(401).send({ error: '邮箱或密码错误' });

    const token = app.jwt.sign({ sub: user.id });
    return {
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName, locale: user.locale },
    };
  });

  // 当前用户
  app.get('/auth/me', { onRequest: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, displayName: true, locale: true },
    });
    return { user };
  });
}
