/**
 * @description: Electron 主进程, 负责创建窗口和加载页面,一般不需要修改
 */
import { app, BrowserWindow } from "electron/main";
import { ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import WindowState from "electron-win-state";
import SQLiteStore from "./database.js"; // 替换：导入 SQLite 存储
import { initializeIpcHandlers } from "./ipcHandlers.js"; // 导入 IPC 处理模块（最大化最小化关闭、读取本地存储）
import logger from "./logger.js"; // 导入日志系统

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.platform === "win32") {
  // Windows 平台下设置通知标题为应用名称，即 TimeFlow
  app.setAppUserModelId(app.name);
  logger.info("Application user model ID set for Windows platform", {
    platform: process.platform,
    appName: app.name,
  });
}

// 创建窗口函数
const createWindow = () => {
  logger.info("Starting window creation process");

  // 创建窗口状态管理器
  const winState = new WindowState.default({
    defaultWidth: 1200,
    defaultHeight: 800,
  });

  logger.debug("Window state manager created", {
    defaultWidth: 1200,
    defaultHeight: 800,
  });

  const win = new BrowserWindow({
    ...winState.winOptions,
    minWidth: 900,
    minHeight: 700,
    icon: path.join(__dirname, "../../public/icon.png"),
    frame: false,
    autohideMenu: true,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"), // 确保路径正确
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node 集成以提高安全性
    },
  });

  logger.info("BrowserWindow created successfully", {
    minWidth: 900,
    minHeight: 700,
    contextIsolation: true,
    nodeIntegration: false,
  });

  // 监听窗口状态变化
  winState.manage(win);

  // 根据 模式 加载不同的页面
  if (isDev) {
    // 在开发模式下加载本地服务器
    logger.info("Loading development server", { url: "http://localhost:5173" });
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  } else {
    // 在生产模式下加载vite打包后的文件
    const indexPath = path.join(__dirname, "../../dist/index.html");
    logger.info("Loading production build", { indexPath });
    win.loadFile(indexPath);
  }

  // 监听窗口事件
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

// 修改：初始化 SQLite 存储
logger.info("Initializing SQLite store");
const sqliteStore = new SQLiteStore();

// 新增：初始化 IPC 数据处理器
logger.info("Initializing IPC handlers");
initializeIpcHandlers(ipcMain, sqliteStore, __dirname, BrowserWindow);

// 当 Electron 完成初始化时创建窗口（防止白屏等待加载初始化）
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

// 监听窗口关闭事件
app.on("window-all-closed", () => {
  logger.info("All windows closed");
  if (process.platform !== "darwin") {
    logger.info("Quitting application");
    app.quit();
  }
});

// 监听应用退出事件
app.on("before-quit", () => {
  logger.info("Application is about to quit");
});

app.on("will-quit", () => {
  logger.info("Application will quit");
});

// 处理未捕获的异常
process.on("uncaughtException", (error) => {
  logger.fatal("Uncaught exception in main process", error);
});

// 处理未处理的 Promise 拒绝
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection in main process", {
    reason: reason?.toString() || "Unknown reason",
    promise: promise?.toString() || "Unknown promise",
  });
});
