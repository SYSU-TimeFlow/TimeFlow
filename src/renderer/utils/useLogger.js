/**
 * @description Vue 日志组合式 API
 * @description 提供给 Vue 组件使用的日志功能
 */
import { ref, onMounted, onUnmounted } from 'vue'
import logger from './logger.js'

/**
 * 组件日志钩子
 * @param {string} componentName - 组件名称
 * @returns {object} 日志相关的方法和响应式数据
 */
export function useLogger(componentName = 'Unknown') {
  const loggerInstance = logger;
  const errorCount = ref(0);
  const lastError = ref(null);

  // 组件挂载时记录日志
  onMounted(() => {
    loggerInstance.component(componentName, 'mounted');
  });

  // 组件卸载时记录日志
  onUnmounted(() => {
    loggerInstance.component(componentName, 'unmounted');
  });

  /**
   * 记录组件内的用户操作
   * @param {string} action - 操作名称
   * @param {object} meta - 额外信息
   */
  const logUserAction = (action, meta = {}) => {
    loggerInstance.user(action, {
      ...meta,
      component: componentName
    });
  };

  /**
   * 记录组件内的 API 调用
   * @param {string} api - API 名称
   * @param {object} meta - 额外信息
   */
  const logApiCall = (api, meta = {}) => {
    loggerInstance.api(api, {
      ...meta,
      component: componentName
    });
  };

  /**
   * 记录组件错误
   * @param {string} message - 错误消息
   * @param {Error|object} error - 错误对象或额外信息
   */
  const logError = (message, error = {}) => {
    errorCount.value++;
    lastError.value = { message, error, timestamp: new Date() };
    
    loggerInstance.error(message, {
      ...(error instanceof Error ? { error: error.message, stack: error.stack } : error),
      component: componentName,
      errorCount: errorCount.value
    });
  };

  /**
   * 记录组件信息
   * @param {string} message - 信息消息
   * @param {object} meta - 额外信息
   */
  const logInfo = (message, meta = {}) => {
    loggerInstance.info(message, {
      ...meta,
      component: componentName
    });
  };

  /**
   * 记录组件调试信息
   * @param {string} message - 调试消息
   * @param {object} meta - 额外信息
   */
  const logDebug = (message, meta = {}) => {
    loggerInstance.debug(message, {
      ...meta,
      component: componentName
    });
  };

  /**
   * 记录组件警告
   * @param {string} message - 警告消息
   * @param {object} meta - 额外信息
   */
  const logWarning = (message, meta = {}) => {
    loggerInstance.warn(message, {
      ...meta,
      component: componentName
    });
  };

  /**
   * 记录性能指标
   * @param {string} metric - 性能指标名称
   * @param {number} value - 指标值
   * @param {object} meta - 额外信息
   */
  const logPerformance = (metric, value, meta = {}) => {
    loggerInstance.performance(metric, value, {
      ...meta,
      component: componentName
    });
  };

  /**
   * 创建计时器用于性能测量
   * @param {string} name - 计时器名称
   * @returns {function} 停止计时器的函数
   */
  const startTimer = (name) => {
    const startTime = performance.now();
    logDebug(`Timer started: ${name}`);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      logPerformance(name, Math.round(duration), { unit: 'ms' });
      return duration;
    };
  };

  /**
   * 创建异步操作跟踪器
   * @param {string} operationName - 操作名称
   * @returns {object} 包含开始、成功、失败方法的对象
   */
  const createAsyncTracker = (operationName) => {
    const startTime = performance.now();
    
    return {
      start: (meta = {}) => {
        logInfo(`Starting async operation: ${operationName}`, meta);
      },
      
      success: (result, meta = {}) => {
        const duration = performance.now() - startTime;
        logInfo(`Async operation completed: ${operationName}`, {
          ...meta,
          duration: Math.round(duration),
          success: true
        });
        logPerformance(`${operationName}_duration`, Math.round(duration), { unit: 'ms' });
      },
      
      error: (error, meta = {}) => {
        const duration = performance.now() - startTime;
        logError(`Async operation failed: ${operationName}`, {
          ...(error instanceof Error ? { error: error.message, stack: error.stack } : { error }),
          ...meta,
          duration: Math.round(duration),
          success: false
        });
      }
    };
  };

  return {
    // 基础日志方法
    logUserAction,
    logApiCall,
    logError,
    logInfo,
    logDebug,
    logWarning,
    logPerformance,
    
    // 高级功能
    startTimer,
    createAsyncTracker,
    
    // 响应式数据
    errorCount,
    lastError,
    
    // 原始 logger 实例
    logger: loggerInstance
  };
}

/**
 * 全局错误处理组合式 API
 * @returns {object} 错误处理相关的方法
 */
export function useErrorHandler() {
  /**
   * 安全执行异步操作
   * @param {function} asyncFn - 异步函数
   * @param {object} options - 选项
   * @returns {Promise} 执行结果
   */
  const safeAsync = async (asyncFn, options = {}) => {
    const { 
      errorMessage = 'Async operation failed',
      onError = null,
      onSuccess = null,
      componentName = 'Unknown'
    } = options;

    try {
      const result = await asyncFn();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      logger.error(errorMessage, {
        error: error.message,
        stack: error.stack,
        component: componentName
      });
      
      if (onError) onError(error);
      throw error;
    }
  };

  /**
   * 安全执行同步操作
   * @param {function} syncFn - 同步函数
   * @param {object} options - 选项
   * @returns {any} 执行结果
   */
  const safeSync = (syncFn, options = {}) => {
    const { 
      errorMessage = 'Sync operation failed',
      onError = null,
      onSuccess = null,
      componentName = 'Unknown'
    } = options;

    try {
      const result = syncFn();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      logger.error(errorMessage, {
        error: error.message,
        stack: error.stack,
        component: componentName
      });
      
      if (onError) onError(error);
      throw error;
    }
  };

  return {
    safeAsync,
    safeSync
  };
}

export default useLogger;
