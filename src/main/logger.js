/**
 * @description 日志系统模块
 * @description 基于 winston 实现的业界规范日志系统，支持日志轮转和多级别日志
 */
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

class Logger {
  constructor() {
    // 获取用户数据目录
    const userDataPath = app.getPath('userData');
    const logsDir = path.join(userDataPath, 'logs');
    
    // 确保日志目录存在
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // 定义日志格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // 如果有额外的元数据，添加到日志中
        if (Object.keys(meta).length > 0) {
          log += ` | Meta: ${JSON.stringify(meta)}`;
        }
        
        // 如果有错误堆栈，添加到日志中
        if (stack) {
          log += `\nStack: ${stack}`;
        }
        
        return log;
      })
    );

    // 配置日志轮转文件传输器
    const fileRotateTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'timeflow-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
      level: 'info'
    });

    // 配置错误日志文件传输器
    const errorFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'timeflow-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
      level: 'error'
    });

    // 配置控制台传输器（仅在开发模式下）
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'HH:mm:ss'
        }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    });

    // 创建 winston logger 实例
    this.logger = winston.createLogger({
      level: 'debug',
      format: logFormat,
      transports: [
        fileRotateTransport,
        errorFileTransport,
        consoleTransport
      ],
      // 处理未捕获的异常
      exceptionHandlers: [
        new DailyRotateFile({
          filename: path.join(logsDir, 'timeflow-exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat
        })
      ],
      // 处理未处理的 Promise 拒绝
      rejectionHandlers: [
        new DailyRotateFile({
          filename: path.join(logsDir, 'timeflow-rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat
        })
      ],
      exitOnError: false
    });

    // 监听轮转事件
    fileRotateTransport.on('rotate', (oldFilename, newFilename) => {
      this.logger.info('Log file rotated', { 
        oldFilename, 
        newFilename,
        action: 'log_rotation'
      });
    });

    // 记录日志系统初始化
    this.logger.info('Logger system initialized successfully', {
      logsDir,
      action: 'logger_init'
    });
  }

  /**
   * 记录调试信息
   * @param {string} message - 日志消息
   * @param {object} meta - 额外的元数据
   */
  debug(message, meta = {}) {
    this.logger.debug(message, { ...meta, pid: process.pid });
  }

  /**
   * 记录普通信息
   * @param {string} message - 日志消息
   * @param {object} meta - 额外的元数据
   */
  info(message, meta = {}) {
    this.logger.info(message, { ...meta, pid: process.pid });
  }

  /**
   * 记录警告信息
   * @param {string} message - 日志消息
   * @param {object} meta - 额外的元数据
   */
  warn(message, meta = {}) {
    this.logger.warn(message, { ...meta, pid: process.pid });
  }

  /**
   * 记录错误信息
   * @param {string} message - 日志消息
   * @param {Error|object} error - 错误对象或额外的元数据
   */
  error(message, error = {}) {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: error.message,
        stack: error.stack,
        pid: process.pid
      });
    } else {
      this.logger.error(message, { ...error, pid: process.pid });
    }
  }

  /**
   * 记录致命错误
   * @param {string} message - 日志消息
   * @param {Error|object} error - 错误对象或额外的元数据
   */
  fatal(message, error = {}) {
    if (error instanceof Error) {
      this.logger.error(`[FATAL] ${message}`, {
        error: error.message,
        stack: error.stack,
        pid: process.pid,
        level: 'fatal'
      });
    } else {
      this.logger.error(`[FATAL] ${message}`, { ...error, pid: process.pid, level: 'fatal' });
    }
  }

  /**
   * 记录数据库操作
   * @param {string} operation - 操作类型
   * @param {string} table - 表名
   * @param {object} meta - 额外的元数据
   */
  database(operation, table, meta = {}) {
    this.logger.info(`Database operation: ${operation} on ${table}`, {
      ...meta,
      category: 'database',
      operation,
      table,
      pid: process.pid
    });
  }

  /**
   * 记录 IPC 通信
   * @param {string} channel - IPC 通道名
   * @param {string} direction - 方向 (send/receive)
   * @param {object} meta - 额外的元数据
   */
  ipc(channel, direction, meta = {}) {
    this.logger.debug(`IPC ${direction}: ${channel}`, {
      ...meta,
      category: 'ipc',
      channel,
      direction,
      pid: process.pid
    });
  }

  /**
   * 记录用户操作
   * @param {string} action - 用户操作
   * @param {object} meta - 额外的元数据
   */
  user(action, meta = {}) {
    this.logger.info(`User action: ${action}`, {
      ...meta,
      category: 'user_action',
      action,
      pid: process.pid
    });
  }

  /**
   * 记录性能指标
   * @param {string} metric - 性能指标名称
   * @param {number} value - 指标值
   * @param {object} meta - 额外的元数据
   */
  performance(metric, value, meta = {}) {
    this.logger.info(`Performance metric: ${metric} = ${value}`, {
      ...meta,
      category: 'performance',
      metric,
      value,
      pid: process.pid
    });
  }

  /**
   * 获取 winston logger 实例
   * @returns {winston.Logger}
   */
  getLogger() {
    return this.logger;
  }
}

// 创建单例实例
const logger = new Logger();

export default logger;
