/**
 * @description: Electron 主进程, 负责创建窗口和加载页面,一般不需要修改
 */
import { app, BrowserWindow } from "electron/main";
import { ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import WindowState from "electron-win-state";

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ================= 监听窗口操作事件 ==================
// 最小化窗口
ipcMain.on("window-minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.minimize();
  }
});

// 最大化/还原窗口
ipcMain.on("window-maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

// 关闭窗口
ipcMain.on("window-close", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.close();
  }
});
