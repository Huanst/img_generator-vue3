<template>
  <div class="mobile-detect-test">
    <div class="test-card">
      <h2>📱 移动端检测测试</h2>
      
      <div class="test-section">
        <h3>设备信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">设备类型:</span>
            <span class="value" :class="{ mobile: isMobile, desktop: !isMobile }">
              {{ isMobile ? '📱 移动端' : '💻 桌面端' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">屏幕宽度:</span>
            <span class="value">{{ screenWidth }}px</span>
          </div>
          <div class="info-item">
            <span class="label">断点:</span>
            <span class="value">768px</span>
          </div>
          <div class="info-item">
            <span class="label">状态:</span>
            <span class="value status" :class="{ active: isMobile }">
              {{ isMobile ? '✅ 移动端模式激活' : '⚪ 桌面端模式' }}
            </span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>CSS 变量测试</h3>
        <div class="css-vars">
          <div class="var-item">
            <code>--mobile-bottom-nav-height</code>
            <div class="var-demo nav-height-demo"></div>
          </div>
          <div class="var-item">
            <code>--mobile-touch-target-size</code>
            <div class="var-demo touch-target-demo"></div>
          </div>
          <div class="var-item">
            <code>--mobile-padding</code>
            <div class="var-demo padding-demo">内容区域</div>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>响应式测试</h3>
        <p class="instruction">
          💡 调整浏览器窗口宽度，观察设备类型的变化：
        </p>
        <ul class="test-list">
          <li>宽度 &lt; 768px → 移动端模式</li>
          <li>宽度 ≥ 768px → 桌面端模式</li>
          <li>实时更新，无需刷新页面</li>
        </ul>
      </div>

      <div class="test-section">
        <h3>Provide/Inject 测试</h3>
        <div class="inject-test">
          <p>✅ isMobile 已通过 provide 传递</p>
          <p>✅ screenWidth 已通过 provide 传递</p>
          <p class="success">子组件可以通过 inject 获取这些值</p>
        </div>
      </div>

      <div class="test-section">
        <h3>LocalStorage 持久化</h3>
        <div class="storage-test">
          <button @click="checkStorage" class="test-btn">
            检查 LocalStorage
          </button>
          <pre v-if="storageData" class="storage-data">{{ storageData }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue'

// 从 App.vue 注入的值
const isMobile = inject('isMobile')
const screenWidth = inject('screenWidth')

const storageData = ref(null)

const checkStorage = () => {
  try {
    const stored = localStorage.getItem('mobile-ui-preference')
    if (stored) {
      const data = JSON.parse(stored)
      storageData.value = JSON.stringify(data, null, 2)
    } else {
      storageData.value = '暂无存储数据'
    }
  } catch (error) {
    storageData.value = '读取失败: ' + error.message
  }
}
</script>

<style scoped>
.mobile-detect-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-card {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

h2 {
  color: var(--text-color);
  margin-bottom: 24px;
  font-size: 24px;
}

h3 {
  color: var(--text-color);
  margin-bottom: 16px;
  font-size: 18px;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 8px;
}

.test-section {
  margin-bottom: 32px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: var(--text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.value.mobile {
  color: var(--primary-color);
}

.value.desktop {
  color: var(--secondary-color);
}

.value.status.active {
  color: #4caf50;
}

.css-vars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.var-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
}

.var-item code {
  display: block;
  color: var(--accent-color);
  font-size: 14px;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
}

.var-demo {
  background: rgba(83, 82, 237, 0.2);
  border: 2px dashed var(--primary-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
}

.nav-height-demo {
  height: var(--mobile-bottom-nav-height, 60px);
}

.touch-target-demo {
  width: var(--mobile-touch-target-size, 44px);
  height: var(--mobile-touch-target-size, 44px);
}

.padding-demo {
  padding: var(--mobile-padding, 16px);
}

.instruction {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 12px;
}

.test-list {
  list-style: none;
  padding: 0;
}

.test-list li {
  color: var(--text-color);
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
}

.test-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--primary-color);
}

.inject-test {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.inject-test p {
  color: var(--text-color);
  margin: 8px 0;
}

.inject-test .success {
  color: #4caf50;
  font-weight: 600;
  margin-top: 12px;
}

.storage-test {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s;
}

.test-btn:hover {
  transform: translateY(-2px);
}

.storage-data {
  background: rgba(0, 0, 0, 0.3);
  color: #4caf50;
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-detect-test {
    padding: 12px;
  }

  .test-card {
    padding: 16px;
  }

  h2 {
    font-size: 20px;
  }

  h3 {
    font-size: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
