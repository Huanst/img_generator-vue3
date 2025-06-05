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
        target: 'http://huanst.cn', // 注意这里使用http而不是https，与CORS设置匹配
        changeOrigin: true,
        secure: false, // 因为目标是http，所以设置为false
        // 如果 API 需要保留 /api 前缀，则不需要重写路径
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
