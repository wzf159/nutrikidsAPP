import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { anonymous } from 'better-auth/plugins';
import { prisma } from './prisma.js';

// 本地开发（NODE_ENV 未设为 production）时用 localhost baseURL，
// 让 better-auth 生成非 Secure 的宽松 cookie，便于 localhost 测试；
// 生产环境保持 .env 里的 https baseURL（Secure + 固定 Domain）。
const isProduction = process.env.NODE_ENV === 'production';
const baseURL = isProduction
  ? (process.env.BETTER_AUTH_BASE_URL ?? 'https://growtrition.sense-institute.org')
  : (process.env.BETTER_AUTH_DEV_URL ?? 'http://localhost:8787');

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  baseURL,
  trustedOrigins: ['http://localhost:5173', 'http://localhost:5174', 'https://growtrition.sense-institute.org'],
  secret: process.env.BETTER_AUTH_SECRET!,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    anonymous({
      // 游客用 Google 登录升级为正式账号时，把游客期间的数据迁移到新账号
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        const fromId = anonymousUser.user.id;
        const toId = newUser.user.id;
        if (fromId === toId) return;
        await prisma.$transaction([
          prisma.child.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
          prisma.analysis.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
          prisma.feedback.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
          prisma.productReview.updateMany({ where: { userId: fromId }, data: { userId: toId } }),
        ]);
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    disableOriginCheck: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: isProduction
      ? { sameSite: 'lax', httpOnly: true, secure: true, domain: 'growtrition.sense-institute.org' }
      : { sameSite: 'lax', httpOnly: true },
  },
});

export type Auth = typeof auth;
