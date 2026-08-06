import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    minify: false,
    // 避免旧构建文件继续留在部署目录中并可被直接访问。
    emptyOutDir: true,
  },
  server: {
    allowedHosts: ['qualify-yogurt-imaging.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
