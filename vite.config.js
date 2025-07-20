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
      // 使用环境变量配置代理目标
      '/api': {
        target: process.env.VITE_API_SERVER_URL || 'https://huanst.cn',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})