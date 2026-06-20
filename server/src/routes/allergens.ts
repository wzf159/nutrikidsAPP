import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';

export default async function allergensRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // 过敏原字典（全局共享，不分用户）
  app.get('/allergens', async () => {
    return prisma.allergen.findMany({ orderBy: { id: 'asc' } });
  });
}