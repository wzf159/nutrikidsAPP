import { createAuthClient } from 'better-auth/react';
import { anonymousClient } from 'better-auth/client/plugins'; // 匿名（游客）登录客户端插件

// nutrikids/src/lib/auth.ts
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [anonymousClient()], // 启用游客登录：authClient.signIn.anonymous()
});
export const { signIn, signOut, useSession } = authClient;