import { createAuthClient } from 'better-auth/react';

// nutrikids/src/lib/auth.ts
export const authClient = createAuthClient({
  baseURL: window.location.origin,
});
export const { signIn, signOut, useSession } = authClient;