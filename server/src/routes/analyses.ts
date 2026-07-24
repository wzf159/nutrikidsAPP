import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { scoreFood } from '../scoring.js';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const scoreSchema = z.object({
  childId: z.string().uuid(),
  productId: z.number().int(),
  source: z.enum(['search', 'barcode', 'photo']).optional(),
  imagePath: z.string().optional(),
});

export default async function analysisRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // 发起个性化评分
  app.post('/analyses', async (req, reply) => {
    const parsed = scoreSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { childId, productId, source, imagePath } = parsed.data;

    // 校验该孩子属于当前用户
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.userId !== req.user.sub)
      return reply.code(403).send({ error: '无权为该孩子打分' });

    try {
      const result = await scoreFood({ userId: req.user.sub, childId, productId, source, imagePath });
      return reply.code(201).send(result);
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
  // AI 兜底分析（产品不在数据库时）
  const aiSummarySchema = z.object({
    productName: z.string().min(1),
    childId: z.string().uuid(),
  });

  app.post('/analyses/ai-summary', async (req, reply) => {
    const parsed = aiSummarySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { productName, childId } = parsed.data;

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.userId !== req.user.sub)
      return reply.code(403).send({ error: '无权访问' });

    const ageLabel = child.age ? `${child.age}-year-old` : child.stageKey ?? 'young child';
    const gender = child.gender === 'girl' ? 'girl' : 'boy';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are a children\'s nutrition expert. Always respond with valid JSON only, no markdown.',
      }, {
        role: 'user',
        content: `Analyze "${productName}" for a ${ageLabel} ${gender}.
Respond with this JSON:
{
  "recommended": "yes" | "no" | "caution",
  "benefits": ["up to 3 short benefit strings"],
  "concerns": ["up to 3 short concern strings"],
  "summary": "one sentence summary of whether this food is appropriate for this child"
}`,
      }],
      max_tokens: 300,
      temperature: 0.3,
    });

    try {
      const text = completion.choices[0].message.content ?? '{}';
      const data = JSON.parse(text.replace(/```json|```/g, '').trim());
      return reply.send(data);
    } catch {
      return reply.code(500).send({ error: 'AI response parsing failed' });
    }
  });
  // 历史列表
  app.get('/analyses', async (req) => {
    return prisma.analysis.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { product: { select: { name: true, nameZh: true, imageUrl: true } }, child: { select: { name: true } } },
    });
  });

  // 单条详情
  app.get('/analyses/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        product: { select: { name: true, nameZh: true, imageUrl: true } },
        breakdown: true,
        factors: true,
        exposure: { include: { concern: true } },
        allergenFlags: { include: { allergen: true } },
      },
    });
    if (!analysis || analysis.userId !== req.user.sub)
      return reply.code(404).send({ error: '未找到' });
    return analysis;
  });
}
