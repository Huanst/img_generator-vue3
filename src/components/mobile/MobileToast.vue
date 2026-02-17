<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" :class="['mobile-toast', `toast-${type}`]">
        <div class="toast-icon">
          <component :is="iconComponent" />
        </div>
        <div class="toast-message">{{ message }}</div>
        <button v-if="closable" class="toast-close" @click="handleClose">
          ×
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { SuccessFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info', // success, error, info
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  closable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const iconComponent = computed(() => {
  const icons = {
    success: SuccessFilled,
    error: CircleCloseFilled,
    info: InfoFilled
  }
  return icons[props.type] || icons.info
})

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.mobile-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 90%;
  min-width: 200px;
}

.toast-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* 不同类型的样式 */
.toast-success {
  background: rgba(40, 167, 69, 0.95);
}

.toast-error {
  background: rgba(220, 53, 69, 0.95);
}

.toast-info {
  background: rgba(23, 162, 184, 0.95);
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-toast {
    top: 10px;
    padding: 10px 16px;
    font-size: 13px;
    max-width: 95%;
  }
  
  .toast-icon {
    font-size: 16px;
  }
}

/* 适配安全区域 */
@supports (padding-top: env(safe-area-inset-top)) {
  .mobile-toast {
    top: calc(20px + env(safe-area-inset-top));
  }
  
  @media (max-width: 768px) {
    .mobile-toast {
      top: calc(10px + env(safe-area-inset-top));
    }
  }
}
</style>
