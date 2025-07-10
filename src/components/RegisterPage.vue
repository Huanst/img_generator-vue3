<template>
  <div class="register-container">
    <div class="register-card-wrapper">
      <glassmorphic-card variant="primary" :showGlow="true">
        <div class="register-header">
          <h2 class="register-title">用户注册</h2>

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

        <el-form
          :model="registerForm"
          :rules="rules"
          ref="registerFormRef"
          label-position="top"
          @submit.prevent="handleRegister">


          <!-- 头像上传 -->
          <el-form-item label="头像">
            <div class="avatar-upload">
              <div class="avatar-preview" @click="triggerFileInput">
                <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" class="avatar-img" />
                <div v-else class="avatar-placeholder">
                  <el-icon class="avatar-icon"><Plus /></el-icon>
                  <span class="upload-text">点击上传头像</span>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleAvatarChange"
                style="display: none" />
              <div class="avatar-tips">
                <span>支持 JPG、PNG 格式，文件大小不超过 2MB</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item prop="username" label="用户名">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名 (3-20个字符)"
              prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="email" label="邮箱">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入有效的邮箱地址"
              prefix-icon="Message" />
          </el-form-item>

          <el-form-item prop="password" label="密码">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码 (6-20个字符)"
              prefix-icon="Lock"
              show-password />
          </el-form-item>

          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              show-password />
          </el-form-item>

          <div class="form-actions">
            <el-button
              type="primary"
              :loading="loading"
              @click="handleRegister"
              class="register-btn">
              <div class="btn-content">
                <el-icon v-if="!loading"><UserFilled /></el-icon>
                <span>{{ loading ? '注册中...' : '立即注册' }}</span>
              </div>
            </el-button>
          </div>

          <div class="login-link">
            <span>已有账号?</span>
            <el-button link type="primary" @click="goToLogin"
              >返回登录</el-button
            >
          </div>
        </el-form>
      </glassmorphic-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock, Message, UserFilled, Plus } from '@element-plus/icons-vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import { ElMessage } from 'element-plus'
import { userActions } from '../utils/userStore.js'
import { authAPI, userAPI } from '../utils/apiservice.js'

// 接收从父组件传来的isDarkMode和toggleTheme
const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['toggleTheme', 'register-success', 'login'])

// 表单引用
const registerFormRef = ref(null)
const fileInput = ref(null)

// 加载状态
const loading = ref(false)

// 头像相关状态
const avatarFile = ref(null)
const avatarPreview = ref('')

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})



// 密码确认验证器
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 邮箱验证器
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  if (value === '') {
    callback(new Error('请输入邮箱'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

// 用户名验证器
const validateUsername = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3 || value.length > 20) {
    callback(new Error('用户名长度应为3-20个字符'))
  } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
    callback(new Error('用户名只能包含字母、数字、下划线和中文'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [{ required: true, trigger: 'blur', validator: validateUsername }],
  email: [{ required: true, trigger: 'blur', validator: validateEmail }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, trigger: 'blur', validator: validateConfirmPassword },
  ],
}

// 处理主题切换
const handleToggleTheme = () => {
  emit('toggleTheme')
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理头像文件变化
const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // 验证文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 2MB')
    return
  }

  // 保存文件对象
  avatarFile.value = file

  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// 处理注册逻辑
const handleRegister = async () => {
  if (!registerFormRef.value) return

  registerFormRef.value.validate(async valid => {
    if (valid) {
      loading.value = true

      try {
        // 先注册用户（不包含头像）
        const registerData = {
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        }

        const registerResponse = await authAPI.register(registerData)
        const registerResult = registerResponse.data
        
        if (registerResult.success) {
          // 如果有头像文件，单独上传头像
          if (avatarFile.value) {
            try {
              // 先登录获取token
              const loginResponse = await authAPI.login({
                username: registerForm.username,
                password: registerForm.password
              })
              
              const loginResult = loginResponse.data
              
              if (loginResult.success) {
                // 保存token到本地存储
                localStorage.setItem('auth_token', loginResult.token)
                
                // 上传头像
                const avatarFormData = new FormData()
                avatarFormData.append('avatar', avatarFile.value)
                
                await userAPI.uploadAvatar(avatarFormData)
                
                console.log('头像上传成功')
              }
            } catch (avatarError) {
              console.warn('头像上传失败:', avatarError)
            }
          }
          
          loading.value = false
          ElMessage.success('注册成功！')
          
          // 发送注册成功事件
          emit('register-success', {
            username: registerForm.username,
            email: registerForm.email,
          })

          // 延迟跳转到登录页
          setTimeout(() => {
            goToLogin()
          }, 1500)
        } else {
          loading.value = false
          ElMessage.error(registerResult.message || '注册失败，请重试')
        }
      } catch (error) {
        loading.value = false
        console.error('注册请求失败:', error)
        
        // 处理具体的错误信息
        if (error.response && error.response.data) {
          ElMessage.error(error.response.data.message || '注册失败，请重试')
        } else {
          ElMessage.error('网络错误，请检查连接后重试')
        }
      }
    }
  })
}

// 跳转到登录页面
const goToLogin = () => {
  emit('login')
}


</script>

<style scoped>
.register-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-card-wrapper {
  width: 100%;
  max-width: 450px;
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

.register-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.register-title {
  color: var(--text-color, #fff);
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  flex: 1;
}



.form-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.register-btn {
  width: 100%;
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

.register-btn::before {
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

.register-btn:hover:not(:disabled)::before {
  left: 100%;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(83, 82, 237, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-link {
  margin-top: 30px;
  text-align: center;
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

/* 头像上传样式 */
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.avatar-preview:hover {
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.1);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
}

.avatar-icon {
  font-size: 24px;
}

.upload-text {
  font-size: 12px;
  text-align: center;
}

.avatar-tips {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

@media (max-width: 600px) {
  .register-card-wrapper {
    padding: 10px;
  }
  
  .avatar-preview {
    width: 80px;
    height: 80px;
  }
}
</style>
