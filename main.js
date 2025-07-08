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

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.platform === "win32") {
  // Windows 平台下设置通知标题为应用名称，即 TimeFlow
  app.setAppUserModelId(app.name);
}

// 创建窗口函数
const createWindow = () => {
  // 创建窗口状态管理器
  const winState = new WindowState.default({
    defaultWidth: 1200,
    defaultHeight: 800,
  });

  const win = new BrowserWindow({
    ...winState.winOptions,
    minWidth: 900,
    minHeight: 700,
    icon: path.join(__dirname, "./assets/icon.png"), 
    frame: false,
    autohideMenu: true,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"), // 确保路径正确
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node 集成以提高安全性
    },
  });

  // 监听窗口状态变化
  winState.manage(win);

  // 根据 模式 加载不同的页面
  if (isDev) {
    // 在开发模式下加载本地服务器
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  } else {
    // 在生产模式下加载vite打包后的文件
    win.loadFile(path.join(__dirname, "dist/index.html"));
  }
};

// 修改：初始化 SQLite 存储
const sqliteStore = new SQLiteStore();

// 新增：初始化 IPC 数据处理器
initializeIpcHandlers(
  ipcMain,
  sqliteStore,
  __dirname,
  BrowserWindow
);

// 当 Electron 完成初始化时创建窗口（防止白屏等待加载初始化）
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 监听窗口关闭事件
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
