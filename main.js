// import { app, BrowserWindow } from "electron";
// import WinState from "electron-win-state";
const { app, BrowserWindow } = require("electron"); // Electron 的主进程
const WinState = require("electron-win-state").default; // 保持窗口状态的库
const path = require("path"); // Node.js 的路径模块

// 主窗口（包含位置保持和大小保持）
const createWindow = () => {
  const win = WinState.createBrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // 预加载的js
      preload: path.resolve(__dirname, "./preload/index.js"), // 预加载脚本
    },
  });

  //   win.loadFile("index.html");
  win.loadURL("http://localhost:5173");

  // Open the DevTools.
  win.webContents.openDevTools();
  // 可能有错误提示，但是可以忽略的，是浏览器控制台的问题

  console.log("Window created");
};

app.whenReady().then(() => {
  createWindow();

    app.on("activate", () => {
        // 在 macOS 上，单击 Dock 图标时重新创建窗口
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
  // 在 Windows 和 Linux 上，关闭所有窗口时退出应用
  if (process.platform !== "darwin") app.quit();

  console.log("All windows closed");
});
