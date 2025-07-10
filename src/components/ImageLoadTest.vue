<template>
  <div class="image-test-container">
    <h2>图片加载测试工具</h2>
    
    <!-- 测试控制面板 -->
    <div class="test-controls">
      <button @click="testHistoryImages" class="test-button">
        测试历史记录图片
      </button>
      <button @click="testSingleImage" class="test-button">
        测试单张图片
      </button>
      <button @click="clearResults" class="clear-button">
        清除结果
      </button>
    </div>

    <!-- 单张图片测试输入 -->
    <div class="single-test">
      <input 
        v-model="testImageUrl" 
        placeholder="输入图片URL进行测试"
        class="url-input"
      />
    </div>

    <!-- 测试结果显示 -->
    <div class="test-results">
      <h3>测试结果：</h3>
      <div class="results-list">
        <div 
          v-for="(result, index) in testResults" 
          :key="index"
          class="result-item"
          :class="result.status"
        >
          <div class="result-header">
            <span class="result-index">第{{ index + 1 }}条</span>
            <span class="result-status" :class="result.status">
              {{ result.status === 'success' ? '✅ 成功' : '❌ 失败' }}
            </span>
            <span class="result-time">{{ result.loadTime }}ms</span>
          </div>
          
          <div class="result-details">
            <p><strong>URL:</strong> {{ result.url }}</p>
            <p v-if="result.error"><strong>错误:</strong> {{ result.error }}</p>
            <p><strong>网络状态:</strong> {{ result.networkStatus }}</p>
            <p><strong>CORS检查:</strong> {{ result.corsStatus }}</p>
            <p><strong>图片尺寸:</strong> {{ result.dimensions }}</p>
          </div>

          <!-- 图片预览 -->
          <div class="image-preview" v-if="result.status === 'success'">
            <img :src="result.url" :alt="`测试图片${index + 1}`" />
          </div>
        </div>
      </div>
    </div>

    <!-- 网络诊断信息 -->
    <div class="network-info">
      <h3>网络诊断信息：</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>在线状态:</strong> {{ (typeof navigator !== 'undefined' && navigator.onLine) ? '在线' : '离线' }}
        </div>
        <div class="info-item">
          <strong>连接类型:</strong> {{ connectionType }}
        </div>
        <div class="info-item">
          <strong>用户代理:</strong> {{ (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.substring(0, 50) + '...' : '未知' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userState } from '@/utils/userStore'
import { API_SERVER_URL } from '@/utils/urlutils'

/**
 * 测试结果数据
 */
const testResults = ref([])
const testImageUrl = ref('')
const connectionType = ref('unknown')

/**
 * 获取网络连接信息
 */
const getConnectionInfo = () => {
  try {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      connectionType.value = navigator.connection.effectiveType || 'unknown'
    } else {
      connectionType.value = 'unknown'
    }
  } catch (error) {
    console.warn('无法获取网络连接信息:', error)
    connectionType.value = 'unknown'
  }
}

/**
 * 测试单张图片加载
 * @param {string} url - 图片URL
 * @param {number} index - 图片索引
 * @returns {Promise<Object>} 测试结果
 */
const testImageLoad = (url, index = 0) => {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const img = new Image()
    
    const result = {
      url,
      index,
      status: 'loading',
      loadTime: 0,
      error: null,
      networkStatus: (typeof navigator !== 'undefined' && navigator.onLine) ? '在线' : '离线',
      corsStatus: '检查中...',
      dimensions: '未知'
    }

    // 图片加载成功
    img.onload = () => {
      result.status = 'success'
      result.loadTime = Date.now() - startTime
      result.dimensions = `${img.naturalWidth} x ${img.naturalHeight}`
      result.corsStatus = '允许'
      console.log(`图片 ${index + 1} 加载成功:`, result)
      resolve(result)
    }

    // 图片加载失败
    img.onerror = (error) => {
      result.status = 'failed'
      result.loadTime = Date.now() - startTime
      result.error = '图片加载失败'
      result.corsStatus = '可能被阻止'
      console.error(`图片 ${index + 1} 加载失败:`, error, result)
      resolve(result)
    }

    // 设置超时
    setTimeout(() => {
      if (result.status === 'loading') {
        result.status = 'failed'
        result.loadTime = Date.now() - startTime
        result.error = '加载超时（10秒）'
        result.corsStatus = '超时'
        console.warn(`图片 ${index + 1} 加载超时:`, result)
        resolve(result)
      }
    }, 10000)

    // 开始加载图片
    img.crossOrigin = 'anonymous' // 尝试跨域加载
    img.src = url
  })
}

/**
 * 测试历史记录中的所有图片
 */
const testHistoryImages = async () => {
  console.log('开始测试历史记录图片...')
  testResults.value = []
  
  if (!userState.token) {
    alert('请先登录')
    return
  }

  try {
    // 获取历史记录
    const response = await fetch(`${API_SERVER_URL}/api/image-history?page=1&limit=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userState.token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (data.status === 'success' && data.data.items) {
      console.log(`获取到 ${data.data.items.length} 条历史记录，开始测试图片加载...`)
      
      // 逐个测试图片
      for (let i = 0; i < data.data.items.length; i++) {
        const item = data.data.items[i]
        console.log(`测试第 ${i + 1} 张图片:`, item.image_url)
        
        const result = await testImageLoad(item.image_url, i)
        result.prompt = item.prompt?.substring(0, 30) + '...'
        result.created_at = item.created_at
        
        testResults.value.push(result)
        
        // 特别关注第5条以后的图片
        if (i >= 4) {
          console.warn(`第 ${i + 1} 条图片测试结果:`, result)
        }
      }
      
      // 分析结果
      analyzeResults()
    } else {
      console.error('获取历史记录失败:', data)
      alert('获取历史记录失败')
    }
  } catch (error) {
    console.error('测试历史记录图片时出错:', error)
    alert('测试失败: ' + error.message)
  }
}

/**
 * 测试单张图片
 */
const testSingleImage = async () => {
  if (!testImageUrl.value.trim()) {
    alert('请输入图片URL')
    return
  }

  console.log('测试单张图片:', testImageUrl.value)
  const result = await testImageLoad(testImageUrl.value, 0)
  testResults.value = [result]
}

/**
 * 分析测试结果
 */
const analyzeResults = () => {
  const successCount = testResults.value.filter(r => r.status === 'success').length
  const failedCount = testResults.value.filter(r => r.status === 'failed').length
  const totalCount = testResults.value.length
  
  console.log('=== 测试结果分析 ===')
  console.log(`总计: ${totalCount} 张图片`)
  console.log(`成功: ${successCount} 张图片`)
  console.log(`失败: ${failedCount} 张图片`)
  console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`)
  
  // 分析失败的图片
  const failedResults = testResults.value.filter(r => r.status === 'failed')
  if (failedResults.length > 0) {
    console.log('=== 失败图片分析 ===')
    failedResults.forEach((result, index) => {
      console.log(`失败图片 ${result.index + 1}:`, {
        url: result.url,
        error: result.error,
        loadTime: result.loadTime,
        corsStatus: result.corsStatus
      })
    })
    
    // 检查是否第5条以后的图片失败率更高
    const first4Results = testResults.value.slice(0, 4)
    const after5Results = testResults.value.slice(4)
    
    if (after5Results.length > 0) {
      const first4SuccessRate = (first4Results.filter(r => r.status === 'success').length / first4Results.length) * 100
      const after5SuccessRate = (after5Results.filter(r => r.status === 'success').length / after5Results.length) * 100
      
      console.log(`前4条成功率: ${first4SuccessRate.toFixed(1)}%`)
      console.log(`第5条以后成功率: ${after5SuccessRate.toFixed(1)}%`)
      
      if (after5SuccessRate < first4SuccessRate) {
        console.warn('⚠️ 发现问题：第5条以后的图片成功率明显较低！')
      }
    }
  }
}

/**
 * 清除测试结果
 */
const clearResults = () => {
  testResults.value = []
  console.log('测试结果已清除')
}

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  getConnectionInfo()
  console.log('图片加载测试工具已准备就绪')
})
</script>

<style scoped>
.image-test-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.test-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.test-button {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.test-button:hover {
  background: var(--primary-color);
}

.clear-button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clear-button:hover {
  background: #c82333;
}

.single-test {
  margin-bottom: 20px;
}

.url-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
}

.test-results {
  margin-bottom: 20px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.result-item.success {
  border-left: 4px solid #28a745;
}

.result-item.failed {
  border-left: 4px solid #dc3545;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-weight: 600;
}

.result-status.success {
  color: #28a745;
}

.result-status.failed {
  color: #dc3545;
}

.result-time {
  color: var(--text-secondary);
  font-size: 12px;
}

.result-details {
  margin-bottom: 12px;
}

.result-details p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.image-preview {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.network-info {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.info-item {
  font-size: 14px;
  color: var(--text-secondary);
}

h2, h3 {
  color: var(--text-color);
  margin-bottom: 16px;
}

h2 {
  font-size: 24px;
}

h3 {
  font-size: 18px;
}
</style>