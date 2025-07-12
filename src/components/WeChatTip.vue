<template>
  <div v-if="showTip" class="wechat-tip">
    <div class="tip-content">
      <el-icon class="tip-icon"><InfoFilled /></el-icon>
      <div class="tip-text">
        <p class="tip-title">微信浏览器提示</p>
        <p class="tip-desc">为了更好的使用体验，建议在浏览器中打开</p>
      </div>
      <el-button 
        type="text" 
        class="close-btn"
        @click="closeTip"
      >
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { InfoFilled, Close } from '@element-plus/icons-vue'
import { isWeChatBrowser } from '@/utils/wechatCompat'

export default {
  name: 'WeChatTip',
  components: {
    InfoFilled,
    Close
  },
  setup() {
    const showTip = ref(false)
    
    const closeTip = () => {
      showTip.value = false
      // 记住用户的选择，24小时内不再显示
      localStorage.setItem('wechat-tip-closed', Date.now().toString())
    }
    
    onMounted(() => {
      if (isWeChatBrowser()) {
        // 检查是否在24小时内关闭过提示
        const lastClosed = localStorage.getItem('wechat-tip-closed')
        if (!lastClosed || (Date.now() - parseInt(lastClosed)) > 24 * 60 * 60 * 1000) {
          showTip.value = true
        }
      }
    })
    
    return {
      showTip,
      closeTip
    }
  }
}
</script>

<style scoped>
.wechat-tip {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease-out;
}

.tip-content {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  gap: 12px;
}

.tip-icon {
  font-size: 20px;
  color: #ffd700;
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
  min-width: 0;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px 0;
  line-height: 1.2;
}

.tip-desc {
  font-size: 12px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.2;
}

.close-btn {
  color: white !important;
  padding: 4px !important;
  min-height: auto !important;
  flex-shrink: 0;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .wechat-tip {
    padding: 10px 12px;
  }
  
  .tip-content {
    gap: 8px;
  }
  
  .tip-icon {
    font-size: 18px;
  }
  
  .tip-title {
    font-size: 13px;
  }
  
  .tip-desc {
    font-size: 11px;
  }
}

/* 微信浏览器特殊处理 */
.wechat-browser .wechat-tip {
  /* 确保在微信浏览器中正确显示 */
  position: fixed;
  top: env(safe-area-inset-top, 0);
}
</style>