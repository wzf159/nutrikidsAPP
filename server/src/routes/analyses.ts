import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { scoreFood } from '../scoring.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const scoreSchema = z.object({
  childId: z.string().uuid(),
  productId: z.number().int(),
  source: z.enum(['search', 'barcode', 'photo']).optional(),
  imagePath: z.string().optional(),
});

const aiSummarySchema = z.object({
  productName: z.string().min(1),
  childId: z.string().uuid().optional(),
});

const aiSummaryResponseSchema = z.object({
  recommendation: z.string().min(1),
  recommendationLevel: z.enum([
    'recommended',
    'moderate',
    'limit',
  ]),
  considerations: z
    .array(
      z.object({
        title: z.string().min(1),
        text: z.string().min(1),
        type: z.enum(['positive', 'caution']),
      }),
    )
    .length(3),
});

export default async function analysisRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // ================================================================
  // Standard Growtrition personalized scoring
  // ================================================================
  app.post('/analyses', async (req, reply) => {
    const parsed = scoreSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: parsed.error.flatten(),
      });
    }

    const {
      childId,
      productId,
      source,
      imagePath,
    } = parsed.data;

    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        allergens: {
          include: {
            allergen: true,
          },
        },
      },
    });

    if (!child || child.userId !== req.user.sub) {
      return reply.code(403).send({
        error: '无权为该孩子打分',
      });
    }

    try {
      const result = await scoreFood({
        userId: req.user.sub,
        childId,
        productId,
        source,
        imagePath,
      });

      return reply.code(201).send(result);
    } catch (e) {
      const err = e as Error & { statusCode?: number };

      return reply
        .code(err.statusCode ?? 500)
        .send({
          error: err.message,
        });
    }
  });

  // ================================================================
// AI fallback summary
// Only for products unavailable in the Growtrition database.
// It must NOT generate a Growtrition score or grade.
// ================================================================
app.post('/analyses/ai-summary', async (req, reply) => {
  const parsed = aiSummarySchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: parsed.error.flatten(),
    });
  }

  const { productName, childId } = parsed.data;

  let childContext =
    'a general child audience with no specific age or gender profile available';

  // childId 是可选的：
  // 有 child profile -> 个性化 AI guidance
  // 没有 child profile -> general child nutrition guidance
  if (childId) {
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child || child.userId !== req.user.sub) {
      return reply.code(403).send({
        error: '无权访问',
      });
    }

    const ageLabel =
      child.ageMonths != null && child.ageMonths < 24
        ? `${child.ageMonths}-month-old`
        : child.age != null
          ? `${child.age}-year-old`
          : child.stageKey ?? 'young child';

    const gender =
      child.gender === 'girl'
        ? 'girl'
        : child.gender === 'boy'
          ? 'boy'
          : 'child';

    childContext = `${ageLabel} ${gender}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',

      messages: [
        {
          role: 'system',
          content: `
You generate general nutrition guidance for Growtrition,
a child-focused food analysis application.

The product being analyzed is NOT currently available in
Growtrition's verified database.

Therefore:
- Do NOT generate a Growtrition score.
- Do NOT generate a nutrition grade.
- Do NOT describe the result as Growtrition's standard evidence-based evaluation.
- Do NOT imply that nutrition facts, ingredient amounts, or nutrient quantities are verified unless explicitly known.
- Do NOT invent exact nutrient quantities.
- Do NOT make disease-prevention, diagnosis, or treatment claims.
- Use cautious, parent-friendly language.
- Always return valid JSON only.
- Do not include markdown or code fences.

If no specific child profile is available:
- provide only general child nutrition guidance;
- do NOT assume a specific age or gender;
- do NOT claim the guidance is personalized.
          `.trim(),
        },

        {
          role: 'user',
          content: `
Provide general nutrition guidance for:

Product: "${productName}"
Child context: ${childContext}

Follow these rules:

1. Write ONE concise recommendation sentence.

The sentence should:
- state whether this food is generally suitable for the available child context;
- include a practical consumption-frequency suggestion;
- use wording such as "regularly", "occasionally", "in moderation", or "best limited" unless a more specific frequency is clearly justified;
- avoid inventing precise serving-frequency recommendations;
- if no specific child profile is available, keep the recommendation general rather than age-specific.

2. Provide EXACTLY THREE key considerations.

Choose the three most important nutritional factors.

Positive considerations may include:
- nutrients the food is commonly a good source of;
- developmental areas those nutrients may support;
- useful nutritional characteristics.

Caution considerations may include:
- added sugar;
- sodium;
- saturated fat;
- highly processed ingredients;
- limited nutrient density;
- other major nutritional concerns relevant to child growth and development.

3. Each consideration must include:
- a short title;
- one concise parent-friendly explanation;
- type = "positive" or "caution".

4. If there is not enough reliable information about this specific branded product,
use cautious wording such as:
- "may"
- "can"
- "is commonly"
- "depending on the formulation"

5. Return JSON exactly in this structure:

{
  "recommendation": "one concise recommendation sentence",
  "recommendationLevel": "recommended" | "moderate" | "limit",
  "considerations": [
    {
      "title": "short title",
      "text": "short explanation",
      "type": "positive" | "caution"
    },
    {
      "title": "short title",
      "text": "short explanation",
      "type": "positive" | "caution"
    },
    {
      "title": "short title",
      "text": "short explanation",
      "type": "positive" | "caution"
    }
  ]
}
          `.trim(),
        },
      ],

      max_tokens: 450,
      temperature: 0.2,

      response_format: {
        type: 'json_object',
      },
    });

    const text =
      completion.choices[0]?.message?.content ?? '{}';

    let raw: unknown;

    try {
      raw = JSON.parse(text);
    } catch (parseError) {
      console.error(
        'AI summary JSON parse failed:',
        parseError,
        text,
      );

      return reply.code(500).send({
        error: 'AI response parsing failed',
      });
    }

    const validated =
      aiSummaryResponseSchema.safeParse(raw);

    if (!validated.success) {
      console.error(
        'Invalid AI summary response:',
        validated.error.flatten(),
        raw,
      );

      return reply.code(500).send({
        error: 'AI response format invalid',
      });
    }

    return reply.send(validated.data);
  } catch (e) {
    console.error(
      'AI summary generation failed:',
      e,
    );

    return reply.code(500).send({
      error: 'AI summary generation failed',
    });
  }
});

  // ================================================================
  // History list
  // ================================================================
  app.get('/analyses', async (req) => {
    return prisma.analysis.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        product: {
          select: {
            name: true,
            nameZh: true,
            imageUrl: true,
          },
        },
        child: {
          select: {
            name: true,
          },
        },
      },
    });
  });

  // ================================================================
  // Single analysis detail
  // ================================================================
  app.get('/analyses/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            name: true,
            nameZh: true,
            imageUrl: true,
          },
        },
        breakdown: true,
        factors: true,
        exposure: {
          include: {
            concern: true,
          },
        },
        allergenFlags: {
          include: {
            allergen: true,
          },
        },
      },
    });

    if (!analysis || analysis.userId !== req.user.sub) {
      return reply.code(404).send({
        error: '未找到',
      });
    }

    return analysis;
  });
}