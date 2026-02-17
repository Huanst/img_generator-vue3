<template>
  <Teleport to="body">
    <Transition name="bottom-sheet-overlay">
      <div v-if="visible" class="bottom-sheet-overlay" @click="handleOverlayClick">
        <Transition name="bottom-sheet">
          <div
            v-if="visible"
            ref="sheetRef"
            class="bottom-sheet"
            @click.stop
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchCancel">
            <!-- 拖动指示器 -->
            <div class="sheet-handle">
              <div class="handle-bar"></div>
            </div>

            <!-- 内容区域 -->
            <div class="sheet-content">
              <slot></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  },
  swipeToClose: {
    type: Boolean,
    default: true
  },
  closeThreshold: {
    type: Number,
    default: 100 // 下拉多少像素关闭
  }
})

const emit = defineEmits(['update:visible', 'close'])

const sheetRef = ref(null)
let startY = 0
let currentY = 0
let isDragging = false

/**
 * 处理遮罩点击
 */
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    closeSheet()
  }
}

/**
 * 关闭抽屉
 */
const closeSheet = () => {
  emit('update:visible', false)
  emit('close')
}

/**
 * 处理触摸开始
 */
const handleTouchStart = (e) => {
  if (!props.swipeToClose) return
  
  startY = e.touches[0].clientY
  currentY = startY
  isDragging = true
}

/**
 * 处理触摸移动
 */
const handleTouchMove = (e) => {
  if (!isDragging || !props.swipeToClose) return
  
  currentY = e.touches[0].clientY
  const diff = currentY - startY
  
  // 只允许向下拖动
  if (diff > 0 && sheetRef.value) {
    sheetRef.value.style.transform = `translateY(${diff}px)`
  }
}

/**
 * 处理触摸结束
 */
const handleTouchEnd = () => {
  if (!isDragging || !props.swipeToClose) return
  
  const diff = currentY - startY
  
  if (sheetRef.value) {
    // 如果下拉距离超过阈值，关闭抽屉
    if (diff > props.closeThreshold) {
      closeSheet()
    }
    
    // 重置位置
    sheetRef.value.style.transform = ''
  }
  
  isDragging = false
}

/**
 * 处理触摸取消
 */
const handleTouchCancel = () => {
  if (sheetRef.value) {
    sheetRef.value.style.transform = ''
  }
  isDragging = false
}

// 监听visible变化，重置拖动状态
watch(() => props.visible, (newVal) => {
  if (!newVal && sheetRef.value) {
    sheetRef.value.style.transform = ''
    isDragging = false
  }
})
</script>

<style scoped>
.bottom-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2500;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
  max-height: 80vh;
  background: var(--card-bg, #fff);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.sheet-handle {
  padding: 12px 0 8px;
  display: flex;
  justify-content: center;
  cursor: grab;
}

.sheet-handle:active {
  cursor: grabbing;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: var(--border-color, rgba(0, 0, 0, 0.2));
  border-radius: 2px;
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

/* 遮罩动画 */
.bottom-sheet-overlay-enter-active,
.bottom-sheet-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.bottom-sheet-overlay-enter-from,
.bottom-sheet-overlay-leave-to {
  opacity: 0;
}

/* 抽屉动画 */
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: transform 0.3s ease;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  transform: translateY(100%);
}

/* 浅色模式 */
:root[data-theme='light'] .bottom-sheet {
  background: #fff;
}

:root[data-theme='light'] .handle-bar {
  background: rgba(0, 0, 0, 0.15);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .bottom-sheet {
    max-height: 85vh;
  }
  
  .sheet-content {
    padding: 0 16px 16px;
  }
}
</style>
