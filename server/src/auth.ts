import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../prisma.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? 'http://localhost:8787',
  trustedOrigins: ['http://localhost:5173', 'http://localhost:5174'],
  secret: process.env.BETTER_AUTH_SECRET!,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    disableOriginCheck: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: false,
      secure: false,
      domain: 'localhost',
    },
  },
});

export type Auth = typeof auth;
