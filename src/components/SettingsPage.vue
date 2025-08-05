<template>
  <div class="app-container">
    <!-- 背景层 -->
    <div class="app-background"></div>
    <div class="mouse-glow"></div>

    <div class="content-container">
      <!-- 设置页面头部 -->
      <header class="app-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="app-title">{{ t('settings.title') }}</h1>
            <p class="app-subtitle">{{ t('settings.subtitle') }}</p>
          </div>
          
          <div class="header-actions">
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
        </div>
      </header>

      <!-- 设置内容区域 -->
      <div class="app-sections">
        <glassmorphic-card variant="primary" :showGlow="true" class="settings-card">
          <div class="settings-content">
            <!-- 个人偏好设置 -->
            <div class="settings-section">
              <h3 class="section-title">{{ t('settings.personalPreferences') }}</h3>
              <div class="settings-group">
                <!-- 主题设置 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.themeMode') }}</span>
                    <span class="label-desc">{{ t('settings.themeModeDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-radio-group v-model="settings.theme" @change="handleThemeChange">
                      <el-radio value="auto">{{ t('settings.themeAuto') }}</el-radio>
                      <el-radio value="light">{{ t('settings.themeLight') }}</el-radio>
                      <el-radio value="dark">{{ t('settings.themeDark') }}</el-radio>
                    </el-radio-group>
                  </div>
                </div>

                <!-- 语言设置 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.language') }}</span>
                    <span class="label-desc">{{ t('settings.languageDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-select v-model="settings.language" @change="handleLanguageChange">
                      <el-option
                        v-for="(info, code) in getSupportedLanguages()"
                        :key="code"
                        :label="info.nativeName"
                        :value="code"
                      />
                    </el-select>
                  </div>
                </div>

                <!-- 自动保存设置 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.autoSave') }}</span>
                    <span class="label-desc">{{ t('settings.autoSaveDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-switch v-model="settings.autoSave" @change="handleAutoSaveChange" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片生成设置 -->
            <div class="settings-section">
              <h3 class="section-title">{{ t('settings.imageGeneration') }}</h3>
              <div class="settings-group">
                <!-- 默认尺寸 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.defaultSize') }}</span>
                    <span class="label-desc">{{ t('settings.defaultSizeDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-select v-model="settings.defaultSize" @change="handleDefaultSizeChange">
                      <el-option label="1280×1280 (Square)" value="1280x1280" />
                      <el-option label="1024×1024 (Square)" value="1024x1024" />
                      <el-option label="1280×1024 (Landscape)" value="1280x1024" />
                      <el-option label="1024×1280 (Portrait)" value="1024x1280" />
                    </el-select>
                  </div>
                </div>

                <!-- 默认生成数量 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.defaultCount') }}</span>
                    <span class="label-desc">{{ t('settings.defaultCountDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-input-number
                      v-model="settings.defaultCount"
                      :min="1"
                      :max="4"
                      @change="handleDefaultCountChange" />
                  </div>
                </div>

                <!-- 默认模型 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.defaultModel') }}</span>
                    <span class="label-desc">{{ t('settings.defaultModelDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-select v-model="settings.defaultModel" @change="handleDefaultModelChange">
                      <el-option label="Kwai-Kolors/Kolors" value="Kwai-Kolors/Kolors" />
                      <el-option label="black-forest-labs/FLUX.1-schnell" value="black-forest-labs/FLUX.1-schnell" />
                    </el-select>
                  </div>
                </div>

                <!-- 高级参数 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.showAdvanced') }}</span>
                    <span class="label-desc">{{ t('settings.showAdvancedDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-switch v-model="settings.showAdvanced" @change="handleShowAdvancedChange" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 通知设置 -->
            <div class="settings-section">
              <h3 class="section-title">{{ t('settings.notifications') }}</h3>
              <div class="settings-group">
                <!-- 生成完成通知 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.notifyOnComplete') }}</span>
                    <span class="label-desc">{{ t('settings.notifyOnCompleteDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-switch v-model="settings.notifyOnComplete" @change="handleNotifyCompleteChange" />
                  </div>
                </div>

                <!-- 系统消息通知 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.systemNotify') }}</span>
                    <span class="label-desc">{{ t('settings.systemNotifyDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-switch v-model="settings.systemNotify" @change="handleSystemNotifyChange" />
                  </div>
                </div>

                <!-- 测试通知 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.testNotification') }}</span>
                    <span class="label-desc">{{ t('settings.testNotificationDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-button @click="handleTestNotification" size="small">
                      {{ t('settings.sendTestNotification') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 隐私设置 -->
            <div class="settings-section">
              <h3 class="section-title">{{ t('settings.privacy') }}</h3>
              <div class="settings-group">
                <!-- 历史记录保存 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.saveHistory') }}</span>
                    <span class="label-desc">{{ t('settings.saveHistoryDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-switch v-model="settings.saveHistory" @change="handleSaveHistoryChange" />
                  </div>
                </div>

                <!-- 数据清理 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <span class="label-text">{{ t('settings.clearData') }}</span>
                    <span class="label-desc">{{ t('settings.clearDataDesc') }}</span>
                  </div>
                  <div class="setting-control">
                    <el-button type="danger" plain @click="handleClearData">
                      {{ t('settings.clearDataButton') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="settings-actions">
              <el-button
                type="primary"
                :loading="saving"
                @click="handleSaveSettings"
                class="save-btn">
                <div class="btn-content">
                  <el-icon v-if="!saving"><Check /></el-icon>
                  <span>{{ saving ? t('settings.saving') : t('settings.saveSettings') }}</span>
                </div>
              </el-button>

              <el-button
                @click="handleResetSettings"
                class="reset-btn">
                <div class="btn-content">
                  <el-icon><RefreshLeft /></el-icon>
                  <span>{{ t('settings.resetToDefault') }}</span>
                </div>
              </el-button>

              <el-button
                @click="handleBack"
                class="back-btn">
                <div class="btn-content">
                  <el-icon><ArrowLeft /></el-icon>
                  <span>{{ t('common.back') }}</span>
                </div>
              </el-button>
            </div>
          </div>
        </glassmorphic-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, RefreshLeft, ArrowLeft } from '@element-plus/icons-vue'
import { settingsState, settingsActions, defaultSettings } from '@/utils/settingsStore'
import { notificationService } from '@/utils/notificationService'
import { useI18n } from '@/utils/i18nService'

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
const emit = defineEmits(['back', 'toggleTheme'])

// 响应式数据
const saving = ref(false)

// 使用全局设置状态
const settings = settingsState

// 使用全局设置操作
const { loadSettings, saveSettings, resetSettings, updateSetting, clearAllData } = settingsActions

// 使用国际化
const { t, setLocale, getSupportedLanguages } = useI18n()

// 处理主题切换
const handleToggleTheme = () => {
  emit('toggleTheme')
}

// 设置变更处理函数
const handleThemeChange = (value) => {
  updateSetting('theme', value)
  applyThemeSettings(value)
  ElMessage.success(t('settings.themeUpdated'))
}

const handleLanguageChange = (value) => {
  updateSetting('language', value)
  applyLanguageSettings(value)
  ElMessage.success(t('settings.languageUpdated'))
}

const handleAutoSaveChange = (value) => {
  updateSetting('autoSave', value)
  ElMessage.success(value ? t('settings.autoSaveEnabled') : t('settings.autoSaveDisabled'))
}

const handleDefaultSizeChange = (value) => {
  updateSetting('defaultSize', value)
  ElMessage.success(t('settings.defaultSizeUpdated'))
}

const handleDefaultCountChange = (value) => {
  updateSetting('defaultCount', value)
  ElMessage.success(t('settings.defaultCountUpdated'))
}

const handleDefaultModelChange = (value) => {
  updateSetting('defaultModel', value)
  ElMessage.success(t('settings.defaultModelUpdated'))
}

const handleShowAdvancedChange = (value) => {
  updateSetting('showAdvanced', value)
  ElMessage.success(value ? t('settings.advancedShown') : t('settings.advancedHidden'))
}

const handleNotifyCompleteChange = async (value) => {
  updateSetting('notifyOnComplete', value)

  if (value) {
    // 开启通知时检查权限
    const hasPermission = await notificationService.checkPermission()
    if (hasPermission) {
      ElMessage.success(t('settings.notificationEnabled'))
      // 发送测试通知
      await notificationService.sendTestNotification()
    } else {
      ElMessage.warning(t('settings.notificationPermissionDenied'))
    }
  } else {
    ElMessage.success(t('settings.notificationDisabled'))
  }
}

const handleSystemNotifyChange = async (value) => {
  updateSetting('systemNotify', value)

  if (value) {
    // 开启通知时检查权限
    const hasPermission = await notificationService.checkPermission()
    if (hasPermission) {
      ElMessage.success(t('settings.notificationEnabled'))
      // 发送测试通知
      await notificationService.notifySystemMessage(t('settings.notificationEnabled'), 'success')
    } else {
      ElMessage.warning(t('settings.notificationPermissionDenied'))
    }
  } else {
    ElMessage.success(t('settings.notificationDisabled'))
  }
}

const handleSaveHistoryChange = (value) => {
  updateSetting('saveHistory', value)
  ElMessage.success(value ? t('settings.historyEnabled') : t('settings.historyDisabled'))
}

// 应用主题设置
const applyThemeSettings = (themeValue) => {
  if (themeValue === 'auto') {
    // 跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    emit('toggleTheme', prefersDark)
  } else {
    // 手动设置主题
    document.documentElement.setAttribute('data-theme', themeValue)
    emit('toggleTheme', themeValue === 'dark')
  }
}

// 应用语言设置
const applyLanguageSettings = (languageValue) => {
  // 切换国际化语言
  const success = setLocale(languageValue)

  if (success) {
    // 设置HTML lang属性
    document.documentElement.setAttribute('lang', languageValue)

    // 更新页面标题
    document.title = t('app.title')

    console.log(`Language switched to: ${languageValue}`)
  } else {
    console.warn(`Failed to switch language to: ${languageValue}`)
  }
}

// 检查浏览器通知权限
const checkNotificationPermission = async () => {
  return await notificationService.checkPermission()
}

// 发送测试通知
const sendTestNotification = async (title, body) => {
  return await notificationService.sendTestNotification()
}

// 处理测试通知按钮点击
const handleTestNotification = async () => {
  try {
    const hasPermission = await checkNotificationPermission()

    if (!hasPermission) {
      ElMessage.warning(t('settings.notificationPermissionDenied'))
      return
    }

    const success = await sendTestNotification()

    if (success) {
      ElMessage.success(t('settings.testNotificationSent'))
    } else {
      ElMessage.error(t('settings.testNotificationFailed'))
    }
  } catch (error) {
    console.error('发送测试通知时发生错误:', error)
    ElMessage.error(t('settings.testNotificationFailed'))
  }
}

// 清除数据
const handleClearData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有本地缓存和临时数据，包括：\n• 图片生成历史记录\n• 临时文件缓存\n• 用户偏好设置（除登录信息外）\n\n是否继续？',
      '确认清除数据',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      }
    )

    // 显示清除进度
    const loadingMessage = ElMessage({
      message: '正在清除数据...',
      type: 'info',
      duration: 0,
      showClose: false
    })

    try {
      // 模拟清除过程
      await new Promise(resolve => setTimeout(resolve, 1500))

      const success = clearAllData()
      loadingMessage.close()

      if (success) {
        ElMessage.success('数据清除完成！页面将在3秒后刷新')
        // 3秒后刷新页面以应用清除后的状态
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        ElMessage.error('数据清除失败，请重试')
      }
    } catch (error) {
      loadingMessage.close()
      ElMessage.error('清除过程中发生错误')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 保存设置
const handleSaveSettings = async () => {
  saving.value = true

  try {
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 800))

    const success = saveSettings()
    if (success) {
      ElMessage.success('设置保存成功！')

      // 应用所有设置
      applyAllSettings()
    } else {
      ElMessage.error('保存设置失败，请重试')
    }
  } catch (error) {
    console.error('保存设置时发生错误:', error)
    ElMessage.error('保存设置失败，请重试')
  } finally {
    saving.value = false
  }
}

// 恢复默认设置
const handleResetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将恢复所有设置为默认值，包括：\n• 主题模式\n• 语言设置\n• 图片生成参数\n• 通知设置\n• 隐私设置\n\n是否继续？',
      '确认重置设置',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      }
    )

    resetSettings()
    applyAllSettings()
    ElMessage.success('设置已恢复为默认值！')
  } catch (error) {
    // 用户取消操作
  }
}

// 应用所有设置
const applyAllSettings = () => {
  // 应用主题设置
  applyThemeSettings(settings.theme)

  // 应用语言设置
  applyLanguageSettings(settings.language)

  // 如果开启了通知，请求权限
  if (settings.notifyOnComplete || settings.systemNotify) {
    checkNotificationPermission()
  }
}

// 返回
const handleBack = () => {
  emit('back')
}

// 组件挂载时确保设置已加载
onMounted(async () => {
  // 确保设置已加载
  loadSettings()

  // 应用当前设置
  applyAllSettings()

  // 如果通知功能开启，检查权限
  if (settings.notifyOnComplete || settings.systemNotify) {
    const hasPermission = await checkNotificationPermission()
    if (!hasPermission) {
      ElMessage.warning('通知权限未授予，通知功能可能无法正常工作')
    }
  }

  // 监听系统主题变化（如果设置为跟随系统）
  if (settings.theme === 'auto') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e) => {
      if (settings.theme === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
        emit('toggleTheme', e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // 组件卸载时清理监听器
    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    })
  }
})
</script>

<style scoped>
/* 使用与主页面一致的样式 */
.app-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  overflow-y: auto;
  min-height: 100vh;
  width: 100%;
}

/* 背景渐变 */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -2;
  background: linear-gradient(
    135deg,
    #e8f4ff 0%,
    #e0f1ff 20%,
    #d8edff 40%,
    #d0eaff 60%,
    #c8e6ff 80%,
    #c0e3ff 100%
  );
  transition: all 0.3s ease;
}

/* 暗色主题背景 */
:root[data-theme='dark'] .app-background {
  background: linear-gradient(
    135deg,
    #1a1f25 0%,
    #23292f 20%,
    #2c333a 40%,
    #353d45 60%,
    #3e4750 80%,
    #47515b 100%
  );
}

.mouse-glow {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.7;
  mix-blend-mode: multiply;
  transition: background 0.15s ease;
}

/* 亮色主题下的光晕 */
:root[data-theme='light'] .mouse-glow {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.12) 0%,
    transparent 50%
  );
}

/* 暗色主题下的光晕 */
:root[data-theme='dark'] .mouse-glow {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.12) 0%,
    transparent 50%
  );
  mix-blend-mode: soft-light;
}

.content-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 0 10px 0;
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  flex: 1;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.theme-toggle {
  display: flex;
  align-items: center;
}

.theme-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: var(--text-color);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.theme-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.theme-icon.is-dark {
  transform: rotate(180deg);
}

.app-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.settings-card {
  width: 100%;
  max-width: none;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 30px;
}

.settings-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.settings-section:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 25px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 2px;
  margin-right: 8px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 25px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  min-height: 70px;
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 8px;
}

.label-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
  text-align: left;
  margin: 0;
}

.label-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
  opacity: 0.8;
  text-align: left;
  margin: 0;
}

.setting-control {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  min-width: 200px;
  padding-top: 4px;
}

.settings-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding-top: 35px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 30px;
}

.save-btn,
.reset-btn,
.back-btn {
  min-width: 140px;
  height: 48px;
  border-radius: 24px;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.save-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border-color: transparent;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(83, 82, 237, 0.3);
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
}

.reset-btn {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  transform: translateY(-2px);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-container {
    padding: 15px 10px;
  }

  .app-header {
    padding: 20px 0 15px 0;
    text-align: center;
  }

  .header-content {
    flex-direction: column;
    gap: 20px;
  }

  .app-title {
    font-size: 2rem;
  }

  .app-subtitle {
    font-size: 1rem;
  }

  .settings-content {
    padding: 20px;
  }

  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    padding: 15px;
    min-height: auto;
  }

  .setting-control {
    min-width: auto;
    justify-content: flex-start;
  }

  .settings-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .save-btn,
  .reset-btn,
  .back-btn {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 12px 8px;
  }

  .app-title {
    font-size: 1.8rem;
  }

  .settings-content {
    padding: 15px;
  }

  .settings-section {
    padding: 20px;
  }

  .section-title {
    font-size: 1.2rem;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-radio-group) {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

:deep(.el-radio) {
  margin-right: 0;
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  height: auto;
  line-height: 1.4;
}

:deep(.el-radio:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-radio.is-checked) {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-color: transparent;
  color: white;
}

:deep(.el-radio__input) {
  display: none;
}

:deep(.el-radio__label) {
  padding-left: 0;
  font-size: 0.9rem;
}

:deep(.el-select) {
  width: 200px;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: none;
}

:deep(.el-select .el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(83, 82, 237, 0.2);
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-input-number .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: none;
}

:deep(.el-input-number .el-input__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-switch) {
  --el-switch-on-color: var(--primary-color);
  --el-switch-off-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-button) {
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--danger.is-plain) {
  color: #ff6b6b;
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  backdrop-filter: blur(10px);
}

:deep(.el-button--danger.is-plain:hover) {
  background: rgba(255, 107, 107, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.2);
}

/* 下拉菜单样式 */
:deep(.el-select-dropdown) {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

:deep(.el-select-dropdown__item) {
  color: var(--text-color);
  background: transparent;
  padding: 8px 16px;
}

:deep(.el-select-dropdown__item:hover) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-select-dropdown__item.selected) {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
}

/* 输入框文字颜色 */
:deep(.el-input__inner) {
  color: var(--text-color);
  background: transparent;
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-secondary);
}
</style>
