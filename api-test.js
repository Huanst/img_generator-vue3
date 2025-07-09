import axios from 'axios'
import { API_BASE_URL } from './src/utils/urlutils.js'

// 配置axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 测试健康检查API
async function testHealthCheck() {
  try {
    console.log('测试健康检查API...')
    const response = await api.get('/health')
    console.log('健康检查API响应:', {
      status: response.status,
      data: response.data
    })
    return true
  } catch (error) {
    console.error('健康检查API测试失败:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
    return false
  }
}

// 测试用户认证API
async function testAuth() {
  try {
    console.log('测试用户登录API...')
    const response = await api.post('/auth/login', {
      username: 'testuser',
      password: 'testpassword'
    })
    console.log('登录API响应:', {
      status: response.status,
      data: response.data
    })
    return true
  } catch (error) {
    console.error('用户登录API测试失败:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
    return false
  }
}

// 主测试函数
async function runTests() {
  console.log('开始API测试...')
  console.log('API基础URL:', API_BASE_URL)

  const healthCheckPassed = await testHealthCheck()
  const authPassed = await testAuth()

  console.log('\n测试结果:')
  console.log(`健康检查API: ${healthCheckPassed ? '✓ 通过' : '✗ 失败'}`)
  console.log(`用户认证API: ${authPassed ? '✓ 通过' : '✗ 失败'}`)

  if (!healthCheckPassed) {
    console.log('\n建议检查:')
    console.log('1. 确保API服务器正在运行')
    console.log('2. 检查API基础URL配置是否正确')
    console.log('3. 检查网络连接和跨域设置')
  }
}

runTests()