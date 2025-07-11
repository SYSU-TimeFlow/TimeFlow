/**
 * @description 渲染进程日志客户端
 * @description 为前端提供日志记录功能，通过 IPC 将日志发送到主进程
 */

class RendererLogger {
  constructor() {
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      FATAL: 4,
    };

    // 当前日志级别（开发模式显示所有，生产模式只显示 INFO 及以上）
    this.currentLevel =
      process.env.NODE_ENV === "development"
        ? this.levels.DEBUG
        : this.levels.INFO;
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {object} meta - 额外的元数据
   * @returns {object} 格式化后的日志对象
   */
  formatMessage(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: {
        ...meta,
        url:
          typeof window !== "undefined" && window.location
            ? window.location.href
            : "test-environment",
        userAgent:
          typeof navigator !== "undefined"
            ? navigator.userAgent
            : "test-environment",
        processType: "renderer",
      },
    };
  }

  /**
   * 检查是否应该记录指定级别的日志
   * @param {string} level - 日志级别
   * @returns {boolean}
   */
  shouldLog(level) {
    return this.levels[level.toUpperCase()] >= this.currentLevel;
  }

  /**
   * 发送日志到主进程
   * @param {object} logData - 日志数据
   */
  async sendToMain(logData) {
    try {
      if (
        typeof window !== "undefined" &&
        window.electronAPI &&
        window.electronAPI.sendLog
      ) {
        await window.electronAPI.sendLog(logData);
      }
    } catch (error) {
      console.error("Failed to send log to main process:", error);
    }
  }

  /**
   * 记录调试信息
   * @param {string} message - 日志消息
   * @param {object} meta - 额外的元数据
   */
  debug(message, meta = {}) {
    if (!this.shouldLog("DEBUG")) return;

    const logData = this.formatMessage("debug", message, meta);
    console.debug(`[DEBUG] ${message}`, meta);
    this.sendToMain(logData);
  }

  /**
   * 记录普通信息
   * @param {string} message - 日志消息
   * @param {object} meta - 额外的元数据
   */
  info(message, meta = {}) {
    if (!this.shouldLog("INFO")) return;

    const logData = this.formatMessage("info", message, meta);
    console.info(`[INFO] ${message}`, meta);
    this.sendToMain(logData);
  }

  /**
   * 记录警告信息
   * @param {string} message - 日志消息
   * @param {object} meta - 额外的元数据
   */
  warn(message, meta = {}) {
    if (!this.shouldLog("WARN")) return;

    const logData = this.formatMessage("warn", message, meta);
    console.warn(`[WARN] ${message}`, meta);
    this.sendToMain(logData);
  }

  /**
   * 记录错误信息
   * @param {string} message - 日志消息
   * @param {Error|object} error - 错误对象或额外的元数据
   */
  error(message, error = {}) {
    if (!this.shouldLog("ERROR")) return;

    let meta = {};
    if (error instanceof Error) {
      meta = {
        error: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else {
      meta = error;
    }

    const logData = this.formatMessage("error", message, meta);
    console.error(`[ERROR] ${message}`, meta);
    this.sendToMain(logData);
  }

  /**
   * 记录致命错误
   * @param {string} message - 日志消息
   * @param {Error|object} error - 错误对象或额外的元数据
   */
  fatal(message, error = {}) {
    let meta = {};
    if (error instanceof Error) {
      meta = {
        error: error.message,
        stack: error.stack,
        name: error.name,
        level: "fatal",
      };
    } else {
      meta = { ...error, level: "fatal" };
    }

    const logData = this.formatMessage("error", `[FATAL] ${message}`, meta);
    console.error(`[FATAL] ${message}`, meta);
    this.sendToMain(logData);
  }

  /**
   * 记录用户操作
   * @param {string} action - 用户操作
   * @param {object} meta - 额外的元数据
   */
  user(action, meta = {}) {
    this.info(`User action: ${action}`, {
      ...meta,
      category: "user_action",
      action,
    });
  }

  /**
   * 记录路由变化
   * @param {string} from - 来源路由
   * @param {string} to - 目标路由
   * @param {object} meta - 额外的元数据
   */
  navigation(from, to, meta = {}) {
    this.info(`Navigation: ${from} -> ${to}`, {
      ...meta,
      category: "navigation",
      from,
      to,
    });
  }

  /**
   * 记录 API 调用
   * @param {string} api - API 名称
   * @param {object} meta - 额外的元数据
   */
  api(api, meta = {}) {
    this.debug(`API call: ${api}`, {
      ...meta,
      category: "api",
      api,
    });
  }

  /**
   * 记录性能指标
   * @param {string} metric - 性能指标名称
   * @param {number} value - 指标值
   * @param {object} meta - 额外的元数据
   */
  performance(metric, value, meta = {}) {
    this.info(`Performance metric: ${metric} = ${value}`, {
      ...meta,
      category: "performance",
      metric,
      value,
    });
  }

  /**
   * 记录组件生命周期
   * @param {string} component - 组件名称
   * @param {string} lifecycle - 生命周期事件
   * @param {object} meta - 额外的元数据
   */
  component(component, lifecycle, meta = {}) {
    this.debug(`Component ${component}: ${lifecycle}`, {
      ...meta,
      category: "component",
      component,
      lifecycle,
    });
  }
}

// 创建全局日志实例
const logger = new RendererLogger();

// 捕获全局错误 (仅在浏览器环境)
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("error", (event) => {
    logger.error("Global error caught", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // 捕获未处理的 Promise 拒绝
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: event.reason?.toString() || "Unknown reason",
      promise: event.promise?.toString() || "Unknown promise",
    });
  });
}

export default logger;
