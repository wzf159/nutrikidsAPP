import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { findProduct } from '../productFinder.js';

export default async function productRoutes(app: FastifyInstance) {
  app.get('/products/search', async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q) return [];

    const localResults = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { nameZh: { contains: q } },
        ],
      },
      take: 10,
      select: { id: true, name: true, nameZh: true, brand: { select: { name: true } } },
    });

    if (localResults.length > 0) {
      return localResults;
    }

    const result = await findProduct({ names: [q] });

    if (result) {
      return [result.product];
    }

    return [];
  });

  app.get('/products/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (Number.isNaN(id)) return reply.code(400).send({ error: 'id 非法' });

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        manufacturer: true,
        nutrients: { include: { nutrient: true } },
        ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
        additives: { include: { additive: true } },
        labels: { include: { label: true } },
        allergens: { include: { allergen: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!product) return reply.code(404).send({ error: '产品不存在' });

    if (product.manufacturer?.certifications) {
      try {
        (product.manufacturer as unknown as { certifications: unknown }).certifications =
          JSON.parse(product.manufacturer.certifications);
      } catch {
        /* 保持原值 */
      }
    }
    return product;
  });
}