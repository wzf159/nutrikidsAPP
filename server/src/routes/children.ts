import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const childSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().optional(),
  ageMonths: z.number().int().min(0).max(12).optional(),
  gender: z.enum(['boy', 'girl', 'other']).optional(),
  heightCm: z.number().min(30).max(230).optional(),
  weightKg: z.number().min(1).max(200).optional(),
  stageKey: z.string().optional(),
  avatarEmoji: z.string().optional(),
  goalIds: z.array(z.number().int()).optional(),
  nutrientIds: z.array(z.number().int()).optional(),
  allergenIds: z.array(z.number().int()).optional(),
});

export default async function childrenRoutes(app: FastifyInstance) {
  // 全部受保护，且只能操作自己的孩子
  app.addHook('onRequest', app.authenticate);

  // 列表（含发育目标/关键营养素/过敏原）
  app.get('/children', async (req) => {
    return prisma.child.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'asc' },
      include: {
        goals: { include: { goal: true } },
        nutrients: { include: { nutrient: true } },
        allergens: { include: { allergen: true } },
      },
    });
  });

  // 新建
  app.post('/children', async (req, reply) => {
    const parsed = childSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const d = parsed.data;

    const child = await prisma.child.create({
      data: {
        userId: req.user.sub,
        name: d.name,
        age: d.age,
        ageMonths: d.ageMonths,
        gender: d.gender,
        heightCm: d.heightCm,
        weightKg: d.weightKg,
        stageKey: d.stageKey,
        avatarEmoji: d.avatarEmoji,
        goals: { create: (d.goalIds ?? []).map((goalId) => ({ goalId })) },
        nutrients: { create: (d.nutrientIds ?? []).map((nutrientId) => ({ nutrientId })) },
        allergens: { create: (d.allergenIds ?? []).map((allergenId) => ({ allergenId })) },
      },
      include: { goals: true, nutrients: true, allergens: true },
    });
    return reply.code(201).send(child);
  });

  // 更新档案（仅本人；只更新提供的字段）
  app.patch('/children/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.child.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.sub)
      return reply.code(404).send({ error: '未找到' });

    const parsed = childSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const d = parsed.data;

    const child = await prisma.child.update({
      where: { id },
      data: {
        name: d.name,
        age: d.age,
        ageMonths: d.ageMonths,
        gender: d.gender,
        heightCm: d.heightCm,
        weightKg: d.weightKg,
        stageKey: d.stageKey,
        avatarEmoji: d.avatarEmoji,
        ...(d.allergenIds !== undefined && {
          allergens: {
            deleteMany: {},
            create: d.allergenIds.map((allergenId) => ({ allergenId })),
          },
        }),
      },
      include: { goals: true, nutrients: true, allergens: true },
    });
    return child;
  });

  // 删除（仅本人）
  app.delete('/children/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const child = await prisma.child.findUnique({ where: { id } });
    if (!child || child.userId !== req.user.sub)
      return reply.code(404).send({ error: '未找到' });
    await prisma.child.delete({ where: { id } });
    return reply.code(204).send();
  });
}
