import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { findProduct,createProductByAI } from '../productFinder.js';

export default async function productRoutes(app: FastifyInstance) {
  app.get('/products/search', async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q) return [];

    // 纯数字 → 优先当条形码查（走 OFF 真实数据）
    if (/^\d{6,14}$/.test(q.trim())) {
      const result = await findProduct({ barcode: q.trim() });
      if (result) return [result.product];
      return [];
    }

    // 先查本地数据库
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

    // 本地没有 → 走名字搜索
    const result = await findProduct({ names: [q] });
    if (result) return [result.product];

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
  
  // 通过 AI 创建产品
  app.post('/products/create-by-ai', async (req, reply) => {
    const { nameEn, nameZh, brand } = req.body as { nameEn: string; nameZh?: string; brand?: string };
    if (!nameEn) return reply.code(400).send({ error: 'nameEn required' });
    
    const result = await findProduct({ names: [nameEn, nameZh ?? ''].filter(Boolean) });
    if (result) return { id: result.product.id };
  
    const product = await createProductByAI(nameEn, nameZh ?? '', brand ?? null);
    if (!product) return reply.code(500).send({ error: 'Failed to create product' });
    
    return { id: product.id };
  });
}