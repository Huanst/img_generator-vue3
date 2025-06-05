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
          <el-form-item label="头像 (可选)" prop="avatar">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleAvatarChange"
              :before-upload="beforeAvatarUpload"
              accept="image/jpeg,image/png,image/gif,image/webp">
              <img
                v-if="avatarPreviewUrl"
                :src="avatarPreviewUrl"
                class="avatar-preview" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              <div class="el-upload__tip">
                点击上传头像，支持 jpg/png/gif/webp 格式，大小不超过5MB
              </div>
            </el-upload>
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
import { ref, reactive, onMounted } from 'vue'
import { User, Lock, Message, UserFilled, Plus } from '@element-plus/icons-vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import { ElMessage } from 'element-plus'
import apiClient from '../utils/apiClient'

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

// 加载状态
const loading = ref(false)

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatarFile: null,
})

// 头像预览
const avatarPreviewUrl = ref('')

// 处理头像选择前的验证
const beforeAvatarUpload = file => {
  // 检查文件类型
  const isValidType = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ].includes(file.type)
  if (!isValidType) {
    ElMessage.error('头像只能是 JPG/PNG/GIF/WEBP 格式!')
    return false
  }

  // 检查文件大小
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('头像大小不能超过 5MB!')
    return false
  }

  return true
}

// 处理头像选择
const handleAvatarChange = uploadFile => {
  if (uploadFile.raw) {
    // 检查文件大小和类型
    if (beforeAvatarUpload(uploadFile.raw)) {
      registerForm.avatarFile = uploadFile.raw
      avatarPreviewUrl.value = URL.createObjectURL(uploadFile.raw)
    }
  }
}

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

// 处理注册逻辑
const handleRegister = () => {
  if (!registerFormRef.value) return

  registerFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true

      // 创建表单数据对象
      const formData = new FormData()
      formData.append('username', registerForm.username)
      formData.append('email', registerForm.email)
      formData.append('password', registerForm.password)
      if (registerForm.avatarFile) {
        formData.append('avatar', registerForm.avatarFile)
      }

      // 发送注册请求
      apiClient
        .post('/auth/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(response => {
          loading.value = false
          if (response.data.status === 'success') {
            ElMessage({
              type: 'success',
              message: response.data.message || '注册成功，请登录',
              duration: 2000,
            })

            // 发送注册成功事件
            emit('register-success', {
              username: registerForm.username,
              email: registerForm.email,
              avatarUrl: response.data.data?.avatarUrl || null,
            })

            // 延迟跳转到登录页
            setTimeout(() => {
              goToLogin()
            }, 1500)
          } else {
            ElMessage({
              type: 'error',
              message: response.data.message || '注册失败，请重试',
              duration: 3000,
            })
          }
        })
        .catch(error => {
          loading.value = false
          console.error('注册请求错误:', error)

          let errorMessage = '注册失败，请重试'

          if (error.response) {
            // 服务器响应了错误状态码
            console.error('错误状态码:', error.response.status)
            console.error('错误响应数据:', error.response.data)

            // 根据错误状态码和消息提供更具体的错误信息
            switch (error.response.status) {
              case 400:
                errorMessage = '请求参数不正确，请检查表单信息'
                break
              case 409:
                if (
                  error.response.data.message &&
                  error.response.data.message.includes('用户名已存在')
                ) {
                  errorMessage = '用户名已被使用，请更换用户名'
                } else if (
                  error.response.data.message &&
                  error.response.data.message.includes('邮箱已被注册')
                ) {
                  errorMessage = '邮箱已被注册，请使用其他邮箱'
                } else {
                  errorMessage = '用户名或邮箱已被注册'
                }
                break
              case 413:
                errorMessage = '上传的文件太大'
                break
              case 415:
                errorMessage = '不支持的文件类型'
                break
              case 500:
                errorMessage = '服务器内部错误，请稍后再试'
                break
              default:
                errorMessage = error.response.data.message || errorMessage
            }
          } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('请求已发送但没有收到响应:', error.request)
            errorMessage = '无法连接到服务器，请检查网络连接'
          } else {
            // 设置请求时发生错误
            console.error('请求错误:', error.message)
            errorMessage = '请求发送失败，请稍后再试'
          }

          ElMessage({
            type: 'error',
            message: errorMessage,
            duration: 4000,
          })
        })
    }
  })
}

// 跳转到登录页面
const goToLogin = () => {
  emit('login')
}

// 清理头像预览的 URL 对象
onMounted(() => {
  return () => {
    if (avatarPreviewUrl.value) {
      URL.revokeObjectURL(avatarPreviewUrl.value)
    }
  }
})
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

.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--border-color, rgba(255, 255, 255, 0.2));
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 120px;
  height: 120px;
  text-align: center;
  background: rgba(0, 0, 0, 0.1);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 83, 82, 237), 0.1);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: var(--text-secondary, #ccc);
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

.el-upload__tip {
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  margin-top: 10px;
  text-align: center;
  width: 100%;
  max-width: 280px;
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

@media (max-width: 600px) {
  .register-card-wrapper {
    padding: 10px;
  }
}
</style>
