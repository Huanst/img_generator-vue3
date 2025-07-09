<template>
  <div class="health-check">
    <glassmorphic-card variant="secondary" :withBorder="true">
      <div class="health-header">
        <h3>API 连接状态</h3>
        <el-button 
          @click="checkHealth" 
          :loading="checking" 
          size="small" 
          type="primary">
          {{ checking ? '检查中...' : '检查连接' }}
        </el-button>
      </div>
      
      <div class="health-status">
        <div class="status-item">
          <span class="status-label">API 服务器:</span>
          <el-tag 
            :type="apiStatus === 'success' ? 'success' : apiStatus === 'error' ? 'danger' : 'info'"
            size="small">
            {{ getStatusText(apiStatus) }}
          </el-tag>
        </div>
        
        <div class="status-item" v-if="lastCheckTime">
          <span class="status-label">最后检查:</span>
          <span class="status-value">{{ lastCheckTime }}</span>
        </div>
        
        <div class="status-item" v-if="responseTime">
          <span class="status-label">响应时间:</span>
          <span class="status-value">{{ responseTime }}ms</span>
        </div>
        
        <div class="status-item" v-if="errorMessage">
          <span class="status-label">错误信息:</span>
          <span class="status-error">{{ errorMessage }}</span>
        </div>
      </div>
      
      <div class="api-info">
        <div class="info-item">
          <span class="info-label">API 地址:</span>
          <code class="info-value">{{ apiBaseUrl }}</code>
        </div>
      </div>
    </glassmorphic-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import { healthAPI } from '../utils/apiservice'
import { API_BASE_URL } from '../utils/urlutils'
import { ElMessage } from 'element-plus'

const checking = ref(false)
const apiStatus = ref('unknown') // 'success', 'error', 'unknown'
const lastCheckTime = ref('')
const responseTime = ref(null)
const errorMessage = ref('')
const apiBaseUrl = ref(API_BASE_URL)

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'success':
      return '正常'
    case 'error':
      return '异常'
    default:
      return '未知'
  }
}

// 检查API健康状态
const checkHealth = async () => {
  checking.value = true
  errorMessage.value = ''
  responseTime.value = null
  
  const startTime = Date.now()
  
  try {
    const response = await healthAPI.check()
    const endTime = Date.now()
    
    responseTime.value = endTime - startTime
    lastCheckTime.value = new Date().toLocaleString()
    
    if (response.data.status === 'success') {
      apiStatus.value = 'success'
      ElMessage({
        type: 'success',
        message: 'API 连接正常',
        duration: 2000,
      })
    } else {
      apiStatus.value = 'error'
      errorMessage.value = response.data.message || '服务器响应异常'
    }
  } catch (error) {
    const endTime = Date.now()
    responseTime.value = endTime - startTime
    lastCheckTime.value = new Date().toLocaleString()
    apiStatus.value = 'error'
    
    console.error('健康检查失败:', error)
    
    if (error.response) {
      errorMessage.value = `HTTP ${error.response.status}: ${error.response.statusText}`
    } else if (error.request) {
      errorMessage.value = '无法连接到服务器'
    } else {
      errorMessage.value = error.message || '未知错误'
    }
    
    ElMessage({
      type: 'error',
      message: 'API 连接失败',
      duration: 3000,
    })
  } finally {
    checking.value = false
  }
}

// 组件挂载时自动检查一次
onMounted(() => {
  checkHealth()
})
</script>

<style scoped>
.health-check {
  margin-bottom: 20px;
}

.health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.health-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.health-status {
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.status-label {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.status-value {
  color: var(--text-primary);
  font-size: 14px;
}

.status-error {
  color: var(--color-danger);
  font-size: 14px;
  max-width: 200px;
  text-align: right;
  word-break: break-word;
}

.api-info {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.info-label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.info-value {
  color: var(--text-primary);
  font-size: 12px;
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .health-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .status-item,
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .status-error,
  .info-value {
    max-width: 100%;
    text-align: left;
  }
}
</style>