/**
 * @description: Electron 主进程, 负责创建窗口和加载页面,一般不需要修改
 */
import { app, BrowserWindow } from "electron/main";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建窗口函数
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // 根据 模式 加载不同的页面
  if (isDev) {
    // 在开发模式下加载本地服务器
    win.loadURL("http://localhost:5173");
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
