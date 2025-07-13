/**
 * @file main.js
 * @description Electron 主进程入口，负责应用生命周期管理、窗口创建、主进程与渲染进程的数据交互初始化等核心逻辑。
 * 
 * 为什么这样做：
 * - 通过集中管理主进程入口，确保应用启动、窗口管理、异常处理等流程一致且可维护。
 * - 使用 SQLite 持久化存储，提升数据可靠性，便于多平台部署和数据迁移。
 * - 统一初始化 IPC 处理器，确保主进程与渲染进程的数据和操作交互安全、规范。
 * - 针对不同平台（如 Windows）做兼容性处理，提升用户体验和系统集成度。
 * - 全面接入日志系统，便于问题追踪、性能分析和用户行为统计。
 * - 通过监听 Electron 生命周期事件和 Node.js 异常，最大程度保证应用稳定性和可恢复性。
 */

import { app, BrowserWindow } from "electron/main";
import { ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import WindowState from "electron-win-state";
import SQLiteStore from "./database.js"; // 持久化存储应用数据
import { initializeIpcHandlers } from "./ipcHandlers.js"; // 初始化主进程与渲染进程的通信
import logger from "./logger.js"; // 日志系统，贯穿主进程各环节

// 获取当前文件路径，便于资源定位和跨平台兼容
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Windows 平台下设置通知标题为应用名称，提升系统集成度
if (process.platform === "win32") {
  app.setAppUserModelId(app.name);
  logger.info("Application user model ID set for Windows platform", {
    platform: process.platform,
    appName: app.name,
  });
}

// 创建主窗口，统一窗口状态管理，支持多平台和多分辨率
const createWindow = () => {
  logger.info("Starting window creation process");

  // 使用窗口状态管理器，自动记忆窗口大小和位置
  const winState = new WindowState.default({
    defaultWidth: 1200,
    defaultHeight: 800,
  });

  logger.debug("Window state manager created", {
    defaultWidth: 1200,
    defaultHeight: 800,
  });

  // 创建主窗口，配置安全选项和资源路径
  const win = new BrowserWindow({
    ...winState.winOptions,
    minWidth: 900,
    minHeight: 700,
    icon: path.join(__dirname, "../../public/icon.png"),
    frame: false,
    autohideMenu: true,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"), // 预加载脚本，安全暴露主进程 API
      contextIsolation: true, // 启用上下文隔离，提升安全性
      nodeIntegration: false, // 禁用 Node 集成，防止前端越权访问
    },
  });

  logger.info("BrowserWindow created successfully", {
    minWidth: 900,
    minHeight: 700,
    contextIsolation: true,
    nodeIntegration: false,
  });

  // 统一管理窗口状态，自动保存和恢复
  winState.manage(win);

  // 根据开发/生产模式加载不同页面，提升开发效率和生产稳定性
  if (isDev) {
    logger.info("Loading development server", { url: "http://localhost:5173" });
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "../../dist/index.html");
    logger.info("Loading production build", { indexPath });
    win.loadFile(indexPath);
  }

  // 监听窗口事件，便于调试和行为分析
  win.on("ready-to-show", () => {
    logger.info("Window is ready to show");
  });

  win.on("closed", () => {
    logger.info("Window closed");
  });

  win.on("minimize", () => {
    logger.debug("Window minimized");
  });

  win.on("maximize", () => {
    logger.debug("Window maximized");
  });

  win.on("unmaximize", () => {
    logger.debug("Window unmaximized");
  });
};

// 初始化 SQLite 存储，保证数据持久化和一致性
logger.info("Initializing SQLite store");
const sqliteStore = new SQLiteStore();

// 初始化 IPC 处理器，统一主进程与渲染进程的数据和操作交互
logger.info("Initializing IPC handlers");
initializeIpcHandlers(ipcMain, sqliteStore, __dirname, BrowserWindow);

// Electron 完成初始化后创建主窗口，避免白屏和加载延迟
app.whenReady().then(() => {
  logger.info("Electron app is ready", {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    arch: process.arch,
  });

  createWindow();

  app.on("activate", () => {
    logger.debug("App activated");
    if (BrowserWindow.getAllWindows().length === 0) {
      logger.info("No windows found, creating new window");
      createWindow();
    }
  });
});

// 监听所有窗口关闭事件，非 macOS 平台自动退出应用
app.on("window-all-closed", () => {
  logger.info("All windows closed");
  if (process.platform !== "darwin") {
    logger.info("Quitting application");
    app.quit();
  }
});

// 监听应用退出相关事件，便于资源释放和日志记录
app.on("before-quit", () => {
  logger.info("Application is about to quit");
});

app.on("will-quit", () => {
  logger.info("Application will quit");
});

// 捕获未处理异常，防止应用崩溃并记录详细日志
process.on("uncaughtException", (error) => {
  logger.fatal("Uncaught exception in main process", error);
});

// 捕获未处理的 Promise 拒绝，提升健壮性和可维护性
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection in main process", {
    reason: reason?.toString() || "Unknown reason",
    promise: promise?.toString() || "Unknown promise",
  });
});
