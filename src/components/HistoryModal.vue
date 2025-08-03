<template>
  <div class="history-modal-overlay" @click="closeModal">
    <div class="history-modal" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="icon-history"></span>
          图片生成历史
        </h2>
        <button class="close-button" @click="closeModal">
          <span class="icon-close">×</span>
        </button>
      </div>

      <!-- 历史记录内容 -->
      <div class="modal-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>正在加载历史记录...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
          <button class="retry-button" @click="loadHistory">
            重试
          </button>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!historyItems.length" class="empty-container">
          <div class="empty-icon">📝</div>
          <p class="empty-message">暂无生成历史</p>
          <p class="empty-hint">开始生成您的第一张图片吧！</p>
        </div>

        <!-- 历史记录列表 -->
        <div v-else class="history-list">
          <div 
            v-for="item in historyItems" 
            :key="item.id" 
            class="history-item"
          >
            <!-- 图片预览 -->
            <div class="image-preview">
              <img 
                :src="item.image_url" 
                :alt="item.prompt"
                class="preview-image"
                @error="handleImageError"
                @load="(e) => console.log('图片加载成功:', e.target.src)"
              />
            </div>

            <!-- 历史记录信息 -->
            <div class="item-info">
              <p class="prompt-text">{{ item.prompt }}</p>
              <p class="created-time">{{ formatDate(item.created_at) }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="item-actions">
              <button 
                class="action-button view-button" 
                @click="viewImage(item.image_url)"
                title="查看大图"
              >
                <span class="icon-view">👁</span>
              </button>
              <button 
                class="action-button download-button" 
                @click="downloadImage(item.image_url, item.prompt)"
                title="下载图片"
              >
                <span class="icon-download">⬇</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button 
            class="page-button" 
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
          >
            上一页
          </button>
          
          <span class="page-info">
            第 {{ pagination.page }} 页，共 {{ pagination.totalPages }} 页
          </span>
          
          <button 
            class="page-button" 
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { userState } from '@/utils/userStore'
import { API_SERVER_URL } from '@/utils/urlUtils'

/**
 * 组件属性定义
 */
const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  }
})

/**
 * 组件事件定义
 */
const emit = defineEmits(['close'])

/**
 * 响应式数据
 */
const loading = ref(false)
const error = ref('')
const historyItems = ref([])
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

/**
 * 关闭模态框
 */
const closeModal = () => {
  emit('close')
}

/**
 * 加载历史记录数据
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 */
const loadHistory = async (page = 1, limit = 10) => {
  console.log('开始加载历史记录...', { page, limit })
  console.log('用户token:', userState.token ? '存在' : '不存在')
  console.log('API_SERVER_URL:', API_SERVER_URL)
  
  if (!userState.token) {
    console.error('用户未登录，无法加载历史记录')
    error.value = '请先登录'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const url = `${API_SERVER_URL}/api/image-history?page=${page}&limit=${limit}`
    console.log('请求URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userState.token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('响应状态:', response.status)
    console.log('响应头:', response.headers)
    
    const data = await response.json()
    console.log('响应数据:', data)

    if (data.status === 'success') {
      historyItems.value = data.data.items || []
      Object.assign(pagination, data.data.pagination || {})
      console.log('历史记录加载成功:', historyItems.value.length, '条记录')
      
      // 检查每个图片URL的有效性
      historyItems.value.forEach((item, index) => {
        console.log(`第${index + 1}条记录:`, {
          id: item.id,
          prompt: item.prompt?.substring(0, 30) + '...',
          image_url: item.image_url,
          created_at: item.created_at
        })
        
        // 检查图片URL是否有效
        if (!item.image_url || item.image_url.trim() === '') {
          console.warn(`第${index + 1}条记录的图片URL为空`)
        } else if (!item.image_url.startsWith('http')) {
          console.warn(`第${index + 1}条记录的图片URL格式可能有问题:`, item.image_url)
        }
      })
    } else {
      console.error('API返回错误:', data.message)
      error.value = data.message || '加载历史记录失败'
    }
  } catch (err) {
    console.error('加载历史记录失败:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

/**
 * 切换页码
 * @param {number} newPage - 新页码
 */
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.totalPages) {
    loadHistory(newPage, pagination.limit)
  }
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 查看图片大图
 * @param {string} imageUrl - 图片URL
 */
const viewImage = (imageUrl) => {
  window.open(imageUrl, '_blank')
}

/**
 * 下载图片
 * @param {string} imageUrl - 图片URL
 * @param {string} prompt - 提示词
 */
const downloadImage = async (imageUrl, prompt) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('下载图片失败:', err)
    alert('下载失败，请稍后重试')
  }
}

/**
 * 处理图片加载错误
 * @param {Event} event - 错误事件
 */
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src)
  
  // 尝试使用public目录下的默认图片
  const defaultImage = '/default-avatar.png'
  
  // 如果已经是默认图片还失败，则显示占位符
  if (event.target.src.includes('default-avatar.png')) {
    console.error('默认图片也加载失败，使用占位符')
    event.target.style.display = 'none'
    
    // 创建占位符元素
    const placeholder = document.createElement('div')
    placeholder.className = 'image-placeholder'
    placeholder.innerHTML = '🖼️'
    placeholder.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--border-color);
      color: var(--text-secondary);
      font-size: 24px;
      border-radius: 6px;
    `
    
    // 替换图片元素
    event.target.parentNode.appendChild(placeholder)
  } else {
    console.log('尝试使用默认图片:', defaultImage)
    event.target.src = defaultImage
  }
}

/**
 * 组件挂载时加载数据
 */
onMounted(() => {
  console.log('HistoryModal mounted, loading history...')
  loadHistory()
})
</script>

<style scoped>
/* 模态框遮罩层 */
.history-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

/* 模态框主体 */
.history-modal {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

/* 模态框头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 模态框内容 */
.modal-content {
  padding: 24px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

/* 错误状态 */
.error-container {
  text-align: center;
  padding: 40px 20px;
}

.error-message {
  color: #ff6b6b;
  margin-bottom: 16px;
}

.retry-button {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background: var(--primary-color);
}

/* 空状态 */
.empty-container {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-message {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
}

.empty-hint {
  font-size: 14px;
}

/* 历史记录列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* 图片预览 */
.image-preview {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--border-color);
  position: relative;
  background: var(--card-bg);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.preview-image:hover {
  opacity: 0.8;
}

/* 图片占位符 */
.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 24px;
  border-radius: 6px;
}

/* 历史记录信息 */
.item-info {
  flex: 1;
  min-width: 0;
}

.prompt-text {
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.created-time {
  color: var(--text-secondary);
  font-size: 12px;
  margin: 0;
}

/* 操作按钮 */
.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.view-button {
  background: var(--accent-color);
  color: white;
}

.view-button:hover {
  background: var(--primary-color);
  transform: scale(1.1);
}

.download-button {
  background: #28a745;
  color: white;
}

.download-button:hover {
  background: #218838;
  transform: scale(1.1);
}

/* 分页控件 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.page-button {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-button:hover:not(:disabled) {
  background: var(--primary-color);
}

.page-button:disabled {
  background: var(--border-color);
  cursor: not-allowed;
  opacity: 0.5;
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 图标样式 */
.icon-history::before { content: '📋'; }
.icon-close::before { content: '×'; }
.icon-view::before { content: '👁'; }
.icon-download::before { content: '⬇'; }

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-modal {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .image-preview {
    width: 100%;
    height: 200px;
  }
  
  .item-actions {
    width: 100%;
    justify-content: center;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
}
</style>