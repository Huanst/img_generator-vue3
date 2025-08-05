import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
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
    build: {
      // 生产环境构建配置
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          // 移除所有console语句
          drop_console: true,
          drop_debugger: true,
        },
      } : {},
      // 根据环境变量控制sourcemap
      sourcemap: process.env.VITE_BUILD_SOURCEMAP === 'true',
    },
    // 定义全局常量
    define: {
      __VUE_PROD_DEVTOOLS__: mode !== 'production',
    },
  }
})