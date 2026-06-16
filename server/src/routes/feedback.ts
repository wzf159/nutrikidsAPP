import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const submitSchema = z.object({
  text: z.string().min(1),
  q1: z.string().optional(),
  q2: z.string().optional(),
  q3: z.string().optional(),
  q4: z.string().optional(),
  q5: z.string().optional(),
  comment: z.string().optional(),
});

export default async function feedbackRoutes(app: FastifyInstance) {
  app.post('/feedback', async (req, reply) => {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    let userId: string | null = null;
    try {
      await req.jwtVerify();
      userId = req.user.sub;
    } catch {
      /* 匿名 */
    }

    await prisma.feedback.create({
      data: {
        userId,
        text: parsed.data.text,
        q1: parsed.data.q1,
        q2: parsed.data.q2,
        q3: parsed.data.q3,
        q4: parsed.data.q4,
        q5: parsed.data.q5,
        comment: parsed.data.comment,
      },
    });

    return reply.code(201).send({ ok: true });
  });

  app.get('/admin/feedback', async (req, reply) => {
    await req.jwtVerify();

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, displayName: true } } },
    });

    return reply.send({ feedbacks });
  });

  app.get('/admin/feedback/stats', async (req, reply) => {
    await req.jwtVerify();

    const total = await prisma.feedback.count();

    const q1Stats = await prisma.feedback.groupBy({
      by: ['q1'],
      _count: { q1: true },
    });

    const q2Stats = await prisma.feedback.groupBy({
      by: ['q2'],
      _count: { q2: true },
    });

    const q3Stats = await prisma.feedback.groupBy({
      by: ['q3'],
      _count: { q3: true },
    });

    const q4Stats = await prisma.feedback.groupBy({
      by: ['q4'],
      _count: { q4: true },
    });

    const q5Stats = await prisma.feedback.groupBy({
      by: ['q5'],
      _count: { q5: true },
    });

    const avgNPS = q5Stats.reduce((sum, s) => {
      const num = parseInt(s.q5 || '0', 10);
      return sum + num * s._count.q5;
    }, 0) / total || 0;

    return reply.send({
      total,
      q1: q1Stats.map(s => ({ value: s.q1, count: s._count.q1 })),
      q2: q2Stats.map(s => ({ value: s.q2, count: s._count.q2 })),
      q3: q3Stats.map(s => ({ value: s.q3, count: s._count.q3 })),
      q4: q4Stats.map(s => ({ value: s.q4, count: s._count.q4 })),
      q5: q5Stats.map(s => ({ value: s.q5, count: s._count.q5 })),
      avgNPS,
    });
  });
}
