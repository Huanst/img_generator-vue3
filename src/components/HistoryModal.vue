<template>
  <div class="history-modal-overlay" @click="closeModal">
    <div class="history-modal" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h2 class="modal-title">
          图片生成历史
        </h2>
        <button class="close-button" @click="closeModal">
          ×
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
              <el-image
                :src="getImageUrl(item.display_url)"
                :alt="item.prompt"
                class="preview-image"
                fit="cover"
                :preview-src-list="[getImageUrl(item.display_url)]"
                :preview-teleported="true"
                loading="lazy"
                @error="handleImageError">
                <template #placeholder>
                  <div class="image-placeholder">
                    <el-icon class="is-loading"><Loading /></el-icon>
                  </div>
                </template>
                <template #error>
                  <div class="image-error">
                    <span>无法加载此图片，请重新生成</span>
                  </div>
                </template>
              </el-image>
            </div>

            <!-- 历史记录信息 -->
            <div class="item-info" @click="handleTitleClick(item)">
              <p class="prompt-text">{{ item.prompt }}</p>
              <p class="created-time">{{ formatDate(item.created_at) }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="item-actions">
              <button 
                class="action-button download-button" 
                @click="downloadImage(getImageUrl(item.display_url), item.prompt)"
                title="下载图片"
              >
                下载
              </button>
              <button 
                class="action-button delete-button" 
                @click="confirmDeleteImage(item)"
                title="删除图片"
              >
                删除
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
import { Loading, PictureFilled } from '@element-plus/icons-vue'
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
  // console.log('开始加载历史记录...', { page, limit })
      // console.log('用户token:', userState.token ? '存在' : '不存在')
      // console.log('API_SERVER_URL:', API_SERVER_URL)
  
  if (!userState.token) {
    // console.error('用户未登录，无法加载历史记录')
    error.value = '请先登录'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const url = `${API_SERVER_URL}/api/image-history?page=${page}&limit=${limit}`
    // console.log('请求URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userState.token}`,
        'Content-Type': 'application/json'
      }
    })

    // console.log('响应状态:', response.status)
        // console.log('响应头:', response.headers)
    
    const data = await response.json()
    // console.log('响应数据:', data)

    if (data.status === 'success') {
      historyItems.value = data.data.items || []
      Object.assign(pagination, data.data.pagination || {})
      // console.log('历史记录加载成功:', historyItems.value.length, '条记录')
      
      // 检查每个图片URL的有效性
      historyItems.value.forEach((item, index) => {
        // console.log(`第${index + 1}条记录:`, {
        //   id: item.id,
        //   prompt: item.prompt?.substring(0, 30) + '...',
        //   display_url: item.display_url,
        //   created_at: item.created_at
        // })
        
        // 检查图片URL是否有效
        if (!item.display_url || item.display_url.trim() === '') {
          // console.warn(`第${index + 1}条记录的图片URL为空`)
        } else if (!item.display_url.startsWith('http') && !item.display_url.startsWith('/') && !item.display_url.startsWith('data:')) {
          // console.warn(`第${index + 1}条记录的图片URL格式可能有问题:`, item.display_url)
        }
      })
    } else {
      // console.error('API返回错误:', data.message)
      error.value = data.message || '加载历史记录失败'
    }
  } catch (err) {
    // console.error('加载历史记录失败:', err)
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
 * 获取完整的图片URL
 * @param {string} displayUrl - 后端返回的display_url
 * @returns {string} 完整的图片URL
 */
const getImageUrl = (displayUrl) => {
  if (!displayUrl) return ''
  
  // 如果是data URL或完整URL，直接返回
  if (displayUrl.startsWith('data:') || displayUrl.startsWith('http')) {
    return displayUrl
  }
  
  // 如果是相对路径，拼接服务器URL
  if (displayUrl.startsWith('/')) {
    return `${API_SERVER_URL}${displayUrl}`
  }
  
  return displayUrl
}

/**
 * 处理图片或标题点击事件
 * @param {Object} item - 历史记录项
 */
const handleTitleClick = (item) => {
  const imageUrl = getImageUrl(item.display_url)
  if (!imageUrl) {
    ElNotification({
      title: '无法预览',
      message: '无法加载此图片，请重新生成',
      type: 'error',
      duration: 3000
    })
    return
  }
  
  // 验证图片是否可以加载
  const img = new Image()
  img.onload = () => {
    // 图片加载成功，触发对应图片的预览
    const imageElement = document.querySelector(`[src="${imageUrl}"]`)
    if (imageElement && imageElement.click) {
      imageElement.click()
    }
  }
  img.onerror = () => {
    ElNotification({
      title: '无法预览',
      message: '无法加载此图片，请重新生成',
      type: 'error',
      duration: 3000
    })
  }
  img.src = imageUrl
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
    
    // 安全检查document.body是否存在
    if (document.body) {
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // console.error('document.body不存在，无法下载图片')
      alert('下载失败：DOM未准备就绪')
      return
    }
    
    window.URL.revokeObjectURL(url)
  } catch (err) {
    // console.error('下载图片失败:', err)
    alert('下载失败，请稍后重试')
  }
}

/**
 * 确认删除图片
 * @param {Object} item - 历史记录项
 */
const confirmDeleteImage = (item) => {
  const confirmed = confirm(`确定要删除这张图片吗？\n\n提示词：${item.prompt}\n\n删除后将无法恢复！`)
  
  if (confirmed) {
    deleteImage(item.id)
  }
}

/**
 * 删除图片
 * @param {number} imageId - 图片ID
 */
const deleteImage = async (imageId) => {
  if (!userState.token) {
    alert('请先登录')
    return
  }

  try {
    const response = await fetch(`${API_SERVER_URL}/api/image-history/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userState.token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (data.status === 'success') {
      // 从列表中移除已删除的项目
      historyItems.value = historyItems.value.filter(item => item.id !== imageId)
      
      // 更新分页信息
      pagination.total = Math.max(0, pagination.total - 1)
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit)
      
      // 如果当前页没有数据且不是第一页，则跳转到上一页
      if (historyItems.value.length === 0 && pagination.page > 1) {
        changePage(pagination.page - 1)
      } else if (historyItems.value.length === 0 && pagination.page === 1) {
        // 如果是第一页且没有数据，重新加载
        loadHistory(1, pagination.limit)
      }
      
      alert('图片删除成功')
    } else {
      alert(data.message || '删除失败，请稍后重试')
    }
  } catch (error) {
    // console.error('删除图片失败:', error)
    alert('删除失败，请稍后重试')
  }
}

/**
 * 处理图片加载错误
 * @param {Event} event - 错误事件
 */
const handleImageError = (event) => {
  // console.error('图片加载失败:', event.target.src)
  
  // 尝试使用public目录下的默认图片
  const defaultImage = '/default-avatar.png'
  
  // 如果已经是默认图片还失败，则显示占位符
  if (event.target.src.includes('default-avatar.png')) {
    // console.error('默认图片也加载失败，使用占位符')
    event.target.style.display = 'none'
    
    // 创建占位符元素
    const placeholder = document.createElement('div')
    placeholder.className = 'image-placeholder'
    placeholder.innerHTML = '图片'
    placeholder.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--border-color);
      color: var(--text-secondary);
      font-size: 14px;
      border-radius: 6px;
    `
    
    // 替换图片元素
    if (event.target.parentNode) {
      event.target.parentNode.appendChild(placeholder)
    } else {
      // console.error('无法找到父节点，无法添加占位符')
    }
  } else {
    // console.log('尝试使用默认图片:', defaultImage)
    event.target.src = defaultImage
  }
}

/**
 * 组件挂载时加载数据
 */
onMounted(() => {
  // console.log('HistoryModal mounted, loading history...')
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
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
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
  cursor: zoom-in;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-secondary);
}

.image-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
  padding: 8px;
}

.image-error span {
  margin-top: 4px;
  line-height: 1.2;
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
  cursor: pointer;
  transition: all 0.2s ease;
}

.item-info:hover {
  color: var(--accent-color);
}

.item-info:hover .prompt-text {
  color: var(--accent-color);
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
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
  white-space: nowrap;
}



.download-button {
  background: #28a745;
  color: white;
}

.download-button:hover {
  background: #218838;
  transform: scale(1.1);
}

.delete-button {
  background: #dc3545;
  color: white;
}

.delete-button:hover {
  background: #c82333;
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

/* 小屏幕手机优化 */
@media (max-width: 480px) {
  .history-modal {
    width: 98%;
    max-height: 90vh;
    border-radius: 12px;
  }

  .modal-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .modal-title {
    font-size: 1rem;
    margin: 0;
  }

  .close-button {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .modal-content {
    padding: 12px;
  }

  .history-item {
    padding: 10px;
    border-radius: 8px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .image-preview {
    width: 100%;
    height: 120px;
    border-radius: 6px;
  }

  .item-info {
    width: 100%;
  }

  .prompt-text {
    font-size: 0.8rem;
    line-height: 1.3;
    -webkit-line-clamp: 2;
  }

  .created-time {
    font-size: 0.7rem;
  }

  .item-actions {
    width: 100%;
    gap: 4px;
    flex-wrap: wrap;
  }

  .action-button {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 70px;
    min-height: 36px;
    border-radius: 6px;
    flex: 1;
  }

  .pagination {
    flex-direction: column;
    gap: 8px;
  }

  .page-button {
    padding: 10px 16px;
    font-size: 14px;
  }

  .page-info {
    font-size: 12px;
  }

  /* 优化空状态 */
  .empty-container {
    padding: 20px;
  }

  .empty-message {
    font-size: 16px;
  }

  .empty-hint {
    font-size: 12px;
  }
}

/* 中等屏幕手机和小平板优化 */
@media (max-width: 768px) {
  .history-modal {
    width: 95%;
    max-height: 85vh;
  }
  
  .modal-header {
    padding: 15px 20px;
  }
  
  .modal-title {
    font-size: 1.1rem;
  }
  
  .close-button {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .modal-content {
    padding: 15px;
  }
  
  .history-item {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .image-preview {
    width: 100%;
    height: 180px;
  }
  
  .item-info {
    width: 100%;
  }
  
  .prompt-text {
    font-size: 0.85rem;
  }
  
  .created-time {
    font-size: 0.75rem;
  }
  
  .item-actions {
    width: 100%;
    justify-content: center;
    gap: 8px;
  }
  
  .action-button {
    padding: 8px 12px;
    font-size: 13px;
    min-width: 65px;
    min-height: 40px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
}
</style>