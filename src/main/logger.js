/**
 * @file logger.js
 * @description 日志系统模块，基于 winston 实现，支持多级别日志、日志轮转、异常和拒绝处理，贯穿整个应用主进程。
 * 
 * 为什么这样做：
 * - 采用业界标准的 winston 日志库，保证日志格式规范、易于扩展和维护。
 * - 日志文件按天轮转，自动归档，防止单文件过大，便于长期运维和问题追踪。
 * - 日志分级（debug/info/warn/error/fatal），便于开发、测试和生产环境下快速定位问题。
 * - 所有日志均带有时间戳、进程号和可选元数据，方便多用户和多进程场景下分析。
 * - 支持异常和 Promise 拒绝自动捕获，最大程度减少因未处理错误导致的应用崩溃。
 * - 控制台输出仅在开发模式下启用，提升开发效率，避免生产环境日志泄露。
 * - 提供数据库、IPC、用户行为、性能等专用日志方法，便于业务模块细粒度追踪。
 * - 单例模式，保证全局日志统一入口，避免多实例导致日志混乱。
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { app } from "electron";
import fs from "fs";

class Logger {
  constructor() {
    // 获取用户数据目录，日志文件随用户账户迁移，提升安全性
    const userDataPath = app.getPath("userData");
    const logsDir = path.join(userDataPath, "logs");

    // 自动创建日志目录，保证日志写入不报错
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // 定义统一日志格式，包含时间戳、级别、消息、元数据和堆栈
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` | Meta: ${JSON.stringify(meta)}`;
        }
        if (stack) {
          log += `\nStack: ${stack}`;
        }
        return log;
      })
    );

    // 日志轮转：普通日志和错误日志分开，便于快速定位问题
    const fileRotateTransport = new DailyRotateFile({
      filename: path.join(logsDir, "timeflow-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: logFormat,
      level: "info",
    });

    const errorFileTransport = new DailyRotateFile({
      filename: path.join(logsDir, "timeflow-error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      format: logFormat,
      level: "error",
    });

    // 控制台输出仅在开发模式下启用，便于调试
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: "HH:mm:ss",
        }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
      level: process.env.NODE_ENV === "development" ? "debug" : "info",
    });

    // 创建 winston logger 实例，统一管理所有日志
    this.logger = winston.createLogger({
      level: "debug",
      format: logFormat,
      transports: [fileRotateTransport, errorFileTransport, consoleTransport],
      // 自动捕获未处理异常和 Promise 拒绝，提升健壮性
      exceptionHandlers: [
        new DailyRotateFile({
          filename: path.join(logsDir, "timeflow-exceptions-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "30d",
          format: logFormat,
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: path.join(logsDir, "timeflow-rejections-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "30d",
          format: logFormat,
        }),
      ],
      exitOnError: false,
    });

    // 监听日志轮转事件，便于归档和监控
    fileRotateTransport.on("rotate", (oldFilename, newFilename) => {
      this.logger.info("Log file rotated", {
        oldFilename,
        newFilename,
        action: "log_rotation",
      });
    });

    // 记录日志系统初始化，便于运维排查
    this.logger.info("Logger system initialized successfully", {
      logsDir,
      action: "logger_init",
    });
  }

  /**
   * 记录调试信息，便于开发和问题定位
   */
  debug(message, meta = {}) {
    this.logger.debug(message, { ...meta, pid: process.pid });
  }

  /**
   * 记录普通信息，业务流程和状态变更
   */
  info(message, meta = {}) {
    this.logger.info(message, { ...meta, pid: process.pid });
  }

  /**
   * 记录警告信息，异常但不致命的问题
   */
  warn(message, meta = {}) {
    this.logger.warn(message, { ...meta, pid: process.pid });
  }

  /**
   * 记录错误信息，捕获异常和错误对象
   */
  error(message, error = {}) {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: error.message,
        stack: error.stack,
        pid: process.pid,
      });
    } else {
      this.logger.error(message, { ...error, pid: process.pid });
    }
  }

  /**
   * 记录致命错误，标记为 fatal，便于快速检索
   */
  fatal(message, error = {}) {
    if (error instanceof Error) {
      this.logger.error(`[FATAL] ${message}`, {
        error: error.message,
        stack: error.stack,
        pid: process.pid,
        level: "fatal",
      });
    } else {
      this.logger.error(`[FATAL] ${message}`, {
        ...error,
        pid: process.pid,
        level: "fatal",
      });
    }
  }

  /**
   * 记录数据库操作，便于数据流追踪和问题定位
   */
  database(operation, table, meta = {}) {
    this.logger.info(`Database operation: ${operation} on ${table}`, {
      ...meta,
      category: "database",
      operation,
      table,
      pid: process.pid,
    });
  }

  /**
   * 记录 IPC 通信，主进程与渲染进程交互
   */
  ipc(channel, direction, meta = {}) {
    this.logger.debug(`IPC ${direction}: ${channel}`, {
      ...meta,
      category: "ipc",
      channel,
      direction,
      pid: process.pid,
    });
  }

  /**
   * 记录用户操作，便于行为分析和统计
   */
  user(action, meta = {}) {
    this.logger.info(`User action: ${action}`, {
      ...meta,
      category: "user_action",
      action,
      pid: process.pid,
    });
  }

  /**
   * 记录性能指标，便于性能监控和优化
   */
  performance(metric, value, meta = {}) {
    this.logger.info(`Performance metric: ${metric} = ${value}`, {
      ...meta,
      category: "performance",
      metric,
      value,
      pid: process.pid,
    });
  }

  /**
   * 获取 winston logger 实例，便于扩展和自定义
   */
  getLogger() {
    return this.logger;
  }
}

// 创建单例实例，保证全局日志统一入口
const logger = new Logger();

export default logger;
