import type { FastifyReply, FastifyRequest } from 'fastify';

// Fastify 类型增强：JWT 载荷 + authenticate 装饰器
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string }; // 签发时放 userId
    user: { sub: string };    // request.user 解析后
  }
}
