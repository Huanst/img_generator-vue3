<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ImageGenerator from './components/ImageGenerator.vue'
import ResultDisplay from './components/ResultDisplay.vue'

const generatedImages = ref([])
const errorMessage = ref('')
const isDarkMode = ref(true) // 默认使用深色模式

// 检测系统主题偏好
const detectSystemTheme = () => {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  ) {
    isDarkMode.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    isDarkMode.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
}

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.setAttribute(
    'data-theme',
    isDarkMode.value ? 'dark' : 'light'
  )
}

// 监听系统主题变化
const setupThemeListener = () => {
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    colorSchemeQuery.addEventListener('change', e => {
      isDarkMode.value = e.matches
      document.documentElement.setAttribute(
        'data-theme',
        e.matches ? 'dark' : 'light'
      )
    })
  }
}

// 全局错误处理
const handleGlobalError = event => {
  console.error('全局错误:', event.error || event.message || '未知错误')
  if (event.error && event.error.message) {
    errorMessage.value = `浏览器错误: ${event.error.message}`
  }
}

// 全局Promise错误处理
const handleUnhandledRejection = event => {
  console.error('未处理的Promise错误:', event.reason)
  if (event.reason && event.reason.message) {
    errorMessage.value = `Promise错误: ${event.reason.message}`
  }
}

// 监听全局错误
onMounted(() => {
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  // 检查浏览器兼容性
  if (!window.fetch) {
    console.error('浏览器不支持Fetch API')
    errorMessage.value = '您的浏览器不支持现代Web功能，请升级您的浏览器'
  }

  // 检查剪贴板API可用性
  if (!navigator.clipboard) {
    console.warn('浏览器不支持剪贴板API，复制功能可能不可用')
  }

  // 初始化主题设置
  detectSystemTheme()
  setupThemeListener()
})

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
})

const handleImagesGenerated = data => {
  generatedImages.value = data.data || []
  scrollToResults()
}

const handleError = error => {
  errorMessage.value = error.message || '生成图像时发生错误，请稍后再试'
}

const scrollToResults = () => {
  if (generatedImages.value.length) {
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-section')
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
  }
}
</script>

<template>
  <div class="app-container">
    <div class="tech-background">
      <div class="tech-grid"></div>
      <div class="tech-circles"></div>
    </div>

    <div class="content-container">
      <header class="app-header">
        <div class="logo-container">
          <div class="logo-icon">AI</div>
        </div>
        <h1>AI 图像生成器</h1>
        <p class="app-subtitle">基于人工智能的高质量图像合成工具</p>

        <!-- 主题切换按钮 -->
        <div class="theme-toggle">
          <button
            @click="toggleTheme"
            class="theme-btn"
            :title="isDarkMode ? '切换到亮色模式' : '切换到暗色模式'">
            <i class="theme-icon" :class="{ 'is-dark': isDarkMode }">
              {{ isDarkMode ? '🌙' : '☀️' }}
            </i>
          </button>
        </div>
      </header>

      <main class="app-main">
        <transition name="fade">
          <el-alert
            v-if="errorMessage"
            :title="errorMessage"
            type="error"
            show-icon
            class="error-alert"
            @close="errorMessage = ''" />
        </transition>

        <div class="app-sections">
          <div class="generator-section">
            <image-generator
              @images-generated="handleImagesGenerated"
              @error="handleError" />
          </div>

          <div class="results-section" v-if="generatedImages.length">
            <result-display :images="generatedImages" />
          </div>
        </div>
      </main>

      <footer class="app-footer">
        <p>
          <a
            href="http://www.beian.miit.gov.cn"
            target="_blank"
            class="beian-link"
            >滇ICP备2025050068号-1</a
          >
        </p>
        <!-- <p class="footer-powered">
          基于 <span class="highlight">SiliconFlow API</span> 提供技术支持
        </p> -->
      </footer>
    </div>
  </div>
</template>

<style>
:root {
  --primary-color: #5352ed;
  --secondary-color: #3498db;
  --accent-color: #00c9ff;
  --background-dark: #10101e;
  --card-bg: rgba(255, 255, 255, 0.07);
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-radius: 16px;
  --transition-speed: 0.3s;
  --max-content-width: 1200px;
}

/* 添加亮色模式变量 */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    --primary-color: #4646d9;
    --secondary-color: #2980b9;
    --accent-color: #0078cc;
    --background-dark: #f0f4f8;
    --card-bg: rgba(255, 255, 255, 0.75);
    --text-color: #1a1a2e;
    --text-secondary: rgba(0, 0, 0, 0.65);
    --border-color: rgba(0, 0, 0, 0.1);
  }
}

/* 暗色模式变量 - 手动设置时使用 */
:root[data-theme='dark'] {
  --primary-color: #5352ed;
  --secondary-color: #3498db;
  --accent-color: #00c9ff;
  --background-dark: #10101e;
  --card-bg: rgba(255, 255, 255, 0.07);
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
}

/* 亮色模式变量 - 手动设置时使用 */
:root[data-theme='light'] {
  --primary-color: #4646d9;
  --secondary-color: #2980b9;
  --accent-color: #0078cc;
  --background-dark: #f0f4f8;
  --card-bg: rgba(255, 255, 255, 0.75);
  --text-color: #1a1a2e;
  --text-secondary: rgba(0, 0, 0, 0.65);
  --border-color: rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  overflow-x: hidden; /* 防止横向滚动 */
  overscroll-behavior: none; /* 防止回弹和连锁滚动 */
}

body {
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: var(--text-color);
  background-color: var(--background-dark);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center; /* 整体内容水平居中 */
  justify-content: flex-start;
  -webkit-font-smoothing: antialiased; /* 字体渲染优化 */
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  overflow-y: auto; /* 确保body是主滚动容器 */
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
}

.app-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: visible; /* 不设置滚动，允许内容流动 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tech-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    var(--background-dark) 0%,
    color-mix(in srgb, var(--background-dark) 80%, var(--primary-color) 20%)
      100%
  );
  z-index: -3;
}

.tech-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(
      rgba(var(--text-color, 26, 32, 66), 0.05) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(var(--text-color, 26, 32, 66), 0.05) 1px,
      transparent 1px
    );
  background-size: 40px 40px;
  z-index: -2;
}

.tech-circles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 15% 10%,
      rgba(var(--primary-color, 83, 82, 237), 0.12) 0%,
      transparent 30%
    ),
    radial-gradient(
      circle at 85% 30%,
      rgba(var(--accent-color, 0, 201, 255), 0.12) 0%,
      transparent 30%
    ),
    radial-gradient(
      circle at 10% 60%,
      rgba(var(--accent-color, 0, 201, 255), 0.07) 0%,
      transparent 30%
    ),
    radial-gradient(
      circle at 90% 90%,
      rgba(var(--primary-color, 83, 82, 237), 0.12) 0%,
      transparent 30%
    );
  z-index: -1;
}

.content-container {
  width: 100%;
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center; /* 内容水平居中 */
  flex: 1;
}

.app-header {
  position: relative;
  padding-top: 30px;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: var(--max-content-width);
  z-index: 1;
}

.logo-container {
  margin: 0 auto 20px;
  width: 70px;
  height: 70px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--secondary-color),
    var(--primary-color)
  );
  box-shadow: 0 10px 20px rgba(83, 82, 237, 0.3);
}

.logo-icon {
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: 0px;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(
    to right,
    var(--secondary-color),
    var(--accent-color)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.app-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
}

.app-main {
  flex: 1;
  margin-bottom: 40px;
  width: 100%;
}

.app-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}

.error-alert {
  margin-bottom: 20px;
  width: 100%;
}

.app-footer {
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* background-color: rgba(0, 0, 0, 0.2); */
}

.footer-powered {
  margin-top: 5px;
  font-size: 0.85rem;
}

.highlight {
  color: var(--accent-color);
  font-weight: 500;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-header {
    padding-top: 20px;
    margin-bottom: 20px;
  }

  .logo-container {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }

  .logo-icon {
    font-size: 24px;
  }

  .app-header h1 {
    font-size: 1.8rem;
  }

  .app-subtitle {
    font-size: 0.95rem;
  }

  .content-container {
    padding: 15px 10px;
  }

  .app-sections {
    gap: 20px;
  }

  .app-main {
    margin-bottom: 20px;
  }

  .app-footer {
    padding: 15px 0;
  }
}

@media (min-width: 1024px) {
  .app-sections {
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
  }

  .generator-section {
    flex: 1;
    max-width: 50%;
    padding-right: 15px;
    display: flex;
    justify-content: flex-end;
  }

  .results-section {
    flex: 1;
    max-width: 50%;
    padding-left: 15px;
    display: flex;
    justify-content: flex-start;
  }

  .generator-section > *,
  .results-section > * {
    width: 100%;
    max-width: 600px;
  }
}

.beian-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s;
  display: inline-block;
  padding: 5px 0;
}

.beian-link:hover {
  color: var(--accent-color);
}

/* 添加主题切换按钮样式 */
.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
}

.theme-btn {
  background: var(--card-bg);
  border: 1px solid rgba(var(--text-color), 0.1);
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
</style>
