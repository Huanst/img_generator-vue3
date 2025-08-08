/**
 * 全局错误处理工具
 * 用于统一处理前端JavaScript错误
 */

import { ElMessage } from 'element-plus'

/**
 * 全局错误处理器
 */
export class GlobalErrorHandler {
  /**
   * 初始化全局错误处理
   */
  static init() {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise拒绝:', event.reason);
      event.preventDefault();
      this.showUserFriendlyError(event.reason);
    });
    
    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.error('全局JavaScript错误:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
      
      this.showUserFriendlyError(event.error || event.message);
    });
    
    console.log('✅ 全局错误处理已初始化');
  }
  
  /**
   * 显示用户友好的错误信息
   */
  static showUserFriendlyError(error) {
    let message = '操作失败，请重试';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error && error.message) {
      message = error.message;
    }
    
    // 过滤技术错误
    const technicalErrors = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Script error',
      'Network Error'
    ];
    
    const shouldShow = !technicalErrors.some(techError => 
      message.includes(techError)
    );
    
    if (shouldShow && !message.includes('成功')) {
      ElMessage({
        type: 'error',
        message: message,
        duration: 3000,
        showClose: true
      });
    }
  }
  
  /**
   * 安全执行异步操作
   */
  static async safeExecute(asyncFn, errorContext = '操作') {
    try {
      return await asyncFn();
    } catch (error) {
      console.error(`${errorContext}失败:`, error);
      this.showUserFriendlyError(`${errorContext}失败: ${error.message || '未知错误'}`);
      throw error;
    }
  }
}

export default GlobalErrorHandler;
