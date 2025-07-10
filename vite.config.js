import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5174, // 端口号
    proxy: {
      // 将本地 /api 请求代理到 huanst.cn/api
      '/api': {
        target: 'https://huanst.cn', // 使用固定的后端地址
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
