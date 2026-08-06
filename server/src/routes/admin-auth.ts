import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export default async function adminAuthRoutes(app: FastifyInstance) {
  app.post('/admin/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: '请输入有效的账号和密码。' });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    const passwordMatches = user?.passwordHash
      ? await bcrypt.compare(parsed.data.password, user.passwordHash)
      : false;
    if (!user || user.role !== 'admin' || !passwordMatches)
      return reply.code(401).send({ error: '管理员账号或密码错误。' });
    return { token: app.jwt.sign({ sub: user.id, role: 'admin' }), user: { email: user.email, displayName: user.displayName } };
  });

  app.get('/admin/summary', { onRequest: [app.authenticateAdmin] }, async () => {
    const [users, children, feedbacks, analyses] = await Promise.all([
      prisma.user.count(),
      prisma.child.count(),
      prisma.feedback.count(),
      prisma.analysis.count(),
    ]);
    return { users, children, feedbacks, analyses };
  });
}
