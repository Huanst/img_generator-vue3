import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5174, // 端口号
    proxy: {
      '/api': {
        target: 'https://huanst.cn', // 使用HTTPS避免混合内容问题
        changeOrigin: true,
        secure: true, // 因为目标是https，所以设置为true
        // 如果 API 需要保留 /api 前缀，则不需要重写路径
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
