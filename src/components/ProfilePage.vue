<template>
  <div class="profile-container">
    <div class="profile-card-wrapper">
      <glassmorphic-card variant="primary" :showGlow="true">
        <div class="profile-header">
          <h2 class="profile-title">个人中心</h2>
          
          <div class="theme-toggle">
            <button
              @click="handleToggleTheme"
              class="theme-btn"
              :title="isDarkMode ? '切换到亮色模式' : '切换到暗色模式'">
              <i class="theme-icon" :class="{ 'is-dark': isDarkMode }">
                {{ isDarkMode ? '🌙' : '☀️' }}
              </i>
            </button>
          </div>
        </div>

        <div class="profile-content">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <div class="avatar-display">
              <div class="avatar-wrapper">
                <img 
                  :src="currentAvatar" 
                  :alt="userInfo?.username || '用户头像'"
                  class="avatar-image"
                  @error="handleAvatarError" />
                <div class="avatar-overlay" @click="triggerFileInput">
                  <i class="upload-icon">📷</i>
                  <span>更换头像</span>
                </div>
              </div>
            </div>
            
            <input 
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              @change="handleAvatarChange"
              style="display: none" />
              
            <div class="avatar-tips">
              <span>支持 JPG、PNG 格式，文件大小不超过 2MB</span>
            </div>
          </div>

          <!-- 用户信息区域 -->
          <div class="user-info-section">
            <el-form 
              :model="profileForm" 
              :rules="rules"
              ref="profileFormRef"
              label-position="top"
              class="profile-form">
              
              <el-form-item prop="username" label="用户名">
                <el-input
                  v-model="profileForm.username"
                  placeholder="请输入用户名"
                  prefix-icon="User"
                  :disabled="true" />
              </el-form-item>

              <el-form-item prop="email" label="邮箱">
                <el-input
                  v-model="profileForm.email"
                  placeholder="请输入邮箱"
                  prefix-icon="Message"
                  :disabled="true" />
              </el-form-item>

              <el-form-item prop="nickname" label="昵称">
                <el-input
                  v-model="profileForm.nickname"
                  placeholder="请输入昵称"
                  prefix-icon="User" />
              </el-form-item>

              <div class="form-actions">
                <el-button 
                  type="primary"
                  :loading="updating"
                  @click="handleUpdateProfile"
                  class="update-btn">
                  <div class="btn-content">
                    <el-icon v-if="!updating"><EditPen /></el-icon>
                    <span>{{ updating ? '保存中...' : '保存修改' }}</span>
                  </div>
                </el-button>
                
                <el-button 
                  @click="handleBack"
                  class="back-btn">
                  <div class="btn-content">
                    <el-icon><ArrowLeft /></el-icon>
                    <span>返回</span>
                  </div>
                </el-button>
              </div>
            </el-form>
          </div>
        </div>
      </glassmorphic-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import { ElMessage, ElLoading } from 'element-plus'
import { EditPen, ArrowLeft } from '@element-plus/icons-vue'
import { userState, userActions } from '@/utils/userStore'
import { API_SERVER_URL } from '@/utils/urlutils'
import { userAPI } from '@/utils/apiservice'

// 接收从父组件传来的props
const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: true,
  },
  toggleTheme: {
    type: Function,
    required: true,
  },
})

// 定义事件
const emit = defineEmits(['back'])

// 响应式数据
const fileInputRef = ref(null)
const profileFormRef = ref(null)
const updating = ref(false)
const uploadingAvatar = ref(false)
const currentAvatar = ref('')

// 表单数据
const profileForm = reactive({
  username: '',
  email: '',
  nickname: '',
})

// 用户信息
const userInfo = computed(() => userState.userInfo)

// 默认头像
const defaultAvatarUrl = computed(() => {
  return '/default-avatar.png'
})

// 表单验证规则
const rules = {
  nickname: [
    { max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' },
  ],
}

// 初始化用户信息
const initUserInfo = async () => {
  // 首先尝试获取最新的用户信息
  await refreshUserProfile()
  
  if (userInfo.value) {
    profileForm.username = userInfo.value.username || ''
    profileForm.email = userInfo.value.email || ''
    profileForm.nickname = userInfo.value.nickname || userInfo.value.username || ''
    
    // 设置头像URL
    updateAvatarUrl()
  }
}

// 更新头像URL的统一方法
const updateAvatarUrl = () => {
  if (userInfo.value?.avatar_url || userInfo.value?.avatarUrl) {
    // 优先使用avatar_url，如果没有则使用avatarUrl
    const avatarPath = userInfo.value.avatar_url || userInfo.value.avatarUrl
    
    // 如果已经是完整URL，直接使用
    if (avatarPath.startsWith('http')) {
      currentAvatar.value = avatarPath
    } else {
      // 否则拼接完整URL
      currentAvatar.value = `${API_SERVER_URL}${avatarPath}`
    }
  } else {
    currentAvatar.value = defaultAvatarUrl.value
  }
}

// 刷新用户资料信息
const refreshUserProfile = async () => {
  try {
    const result = await userActions.getUserProfile()
    if (result.success) {
      // 更新头像URL
      updateAvatarUrl()
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
  }
}

// 处理主题切换
const handleToggleTheme = () => {
  props.toggleTheme()
}

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理头像文件选择
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('请选择 JPG 或 PNG 格式的图片')
    return
  }

  // 验证文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  // 预览头像
  const reader = new FileReader()
  reader.onload = (e) => {
    currentAvatar.value = e.target.result
  }
  reader.readAsDataURL(file)

  // 上传头像
  await uploadAvatar(file)
}

// 上传头像
const uploadAvatar = async (file) => {
  uploadingAvatar.value = true
  
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await userAPI.uploadAvatar(formData)
    const result = response.data

    if (result.status === 'success') {
      ElMessage.success('头像更新成功')
      
      // 更新用户信息中的头像URL
      if (userState.userInfo) {
        // 使用后端返回的头像URL，优先使用avatar_url字段
        userState.userInfo.avatar_url = result.data.avatar_url || result.data.avatarUrl
        userState.userInfo.avatarUrl = result.data.avatar_url || result.data.avatarUrl
        
        // 更新本地存储
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('user_info', JSON.stringify(userState.userInfo))
        
        // 更新当前显示的头像
        updateAvatarUrl()
      }
    } else {
      throw new Error(result.message || '头像上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    
    let errorMessage = '头像上传失败，请重试'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    ElMessage.error(errorMessage)
    
    // 恢复原头像
    updateAvatarUrl()
  } finally {
    uploadingAvatar.value = false
    // 清空文件输入框
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 处理头像加载错误
const handleAvatarError = () => {
  currentAvatar.value = defaultAvatarUrl.value
}

// 更新个人信息
const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return

  try {
    const valid = await profileFormRef.value.validate()
    if (!valid) return

    updating.value = true

    // 这里可以添加更新个人信息的API调用
    // 目前只更新昵称，因为用户名和邮箱通常不允许修改
    const updateData = {
      nickname: profileForm.nickname,
    }

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('个人信息更新成功')
    
    // 更新本地用户信息
    if (userState.userInfo) {
      userState.userInfo.nickname = profileForm.nickname
      
      // 更新本地存储
      const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
      storage.setItem('user_info', JSON.stringify(userState.userInfo))
    }
  } catch (error) {
    console.error('更新个人信息失败:', error)
    ElMessage.error('更新失败，请重试')
  } finally {
    updating.value = false
  }
}

// 返回主页面
const handleBack = () => {
  emit('back')
}

// 组件挂载时初始化
onMounted(async () => {
  await initUserInfo()
})
</script>

<style scoped>
.profile-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.profile-card-wrapper {
  width: 100%;
  max-width: 500px;
  padding: 20px;
  animation: fadeIn 0.6s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.profile-title {
  color: var(--text-color, #fff);
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  flex: 1;
}

/* 主题切换按钮样式 */
.theme-toggle {
  position: absolute;
  top: 0;
  right: 0;
}

.theme-btn {
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-btn:hover {
  transform: rotate(15deg);
  background: var(--primary-color);
  color: white;
}

.theme-icon {
  font-size: 20px;
  line-height: 1;
}

.theme-icon.is-dark {
  transform: rotate(-15deg);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 头像区域样式 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-display {
  display: flex;
  justify-content: center;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid var(--border-color-translucent, rgba(255, 255, 255, 0.3));
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  gap: 5px;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.upload-icon {
  font-size: 24px;
}

.avatar-tips {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

/* 用户信息区域样式 */
.user-info-section {
  width: 100%;
}

.profile-form {
  width: 100%;
}

.profile-form :deep(.el-form-item__label) {
  color: var(--text-color, #fff);
  font-weight: 500;
  margin-bottom: 8px;
}

.profile-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.profile-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.profile-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.profile-form :deep(.el-input__inner) {
  color: var(--text-color, #fff);
  background: transparent;
}

.profile-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.profile-form :deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.6);
}

.profile-form :deep(.el-input.is-disabled .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.profile-form :deep(.el-input.is-disabled .el-input__inner) {
  color: rgba(255, 255, 255, 0.5);
}

/* 按钮样式 */
.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.update-btn {
  flex: 1;
  height: 50px;
  font-size: 16px;
  letter-spacing: 1px;
  background-image: linear-gradient(
    to right,
    var(--secondary-color),
    var(--primary-color)
  );
  border: none;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.update-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.update-btn:hover:not(:disabled)::before {
  left: 100%;
}

.update-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(83, 82, 237, 0.4);
}

.back-btn {
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color, #fff);
  font-size: 16px;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  padding: 0 20px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 10px;
  }
  
  .profile-card-wrapper {
    max-width: 100%;
  }
  
  .profile-title {
    font-size: 24px;
  }
  
  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .profile-card-wrapper {
    padding: 10px;
  }
  
  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>