import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import axios from 'axios'
import './style.css'
import { API_BASE_URL } from '@/utils/urlUtils'
import { i18nService } from '@/utils/i18nService'

// 输出环境信息
// console.log('应用环境:', import.meta.env.MODE)
// console.log('API基础URL:', API_BASE_URL)

// 配置Axios请求拦截器
axios.interceptors.request.use(
  config => {
    // console.log('API请求发送:', {
    //   url: config.url,
    //   method: config.method,
    //   headers: {
    //     ...config.headers,
    //     Authorization: config.headers.Authorization ? '已设置' : '未设置',
    //   },
    // })
    return config
  },
  error => {
    // console.error('API请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 配置Axios响应拦截器
axios.interceptors.response.use(
  response => {
    // console.log('API响应成功:', {
    //   url: response.config.url,
    //   status: response.status,
    //   statusText: response.statusText,
    //   responseSize: JSON.stringify(response.data).length + ' 字节',
    // })
    return response
  },
  error => {
    // console.error('API响应错误:', {
    //   url: error.config?.url,
    //   message: error.message,
    //   code: error.code,
    //   response: error.response
    //     ? {
    //         status: error.response.status,
    //         statusText: error.response.statusText,
    //         data: error.response.data,
    //       }
    //     : '无响应',
    // })
    return Promise.reject(error)
  }
)

// 创建应用实例
const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化国际化服务
i18nService.loadLocaleFromStorage()

// 设置页面标题
document.title = i18nService.t('app.title')

// 挂载应用
app.mount('#app')
