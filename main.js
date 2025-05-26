/**
 * @description: Electron 主进程, 负责创建窗口和加载页面,一般不需要修改
 */
import { app, BrowserWindow } from "electron/main";
import { ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import WindowState from "electron-win-state";
import Store from "electron-store"; // 新增：导入 electron-store
import fs from "fs"; // 新增：导入 fs

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

// 新增：初始化 electron-store 用于事件
const eventsStore = new Store({ name: "events_data" }); // 使用不同的名称以避免与可能的旧设置冲突

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

// 新增：================= 事件数据存储 IPC ==================

// 事件类型映射 (从 event.json 的 type 数字到 EventType 枚举字符串)
const mapJsonEventTypeToEnumString = (typeNumber) => {
  switch (typeNumber) {
    case 0: return "todo";
    case 1: return "calendar";
    case 2: return "both";
    default: return "calendar"; // 默认为日历事件
  }
};

// 加载事件
ipcMain.handle('load-events', async () => {
  let storedEvents = eventsStore.get('appEvents');
  if (!storedEvents || (Array.isArray(storedEvents) && storedEvents.length === 0)) {
    // 如果 electron-store 为空或事件数组为空，则从 event.json 加载
    try {
      const eventJsonPath = path.join(__dirname, 'src', 'stores', 'first_load_for_dev', 'event.json');
      if (fs.existsSync(eventJsonPath)) {
        const rawData = fs.readFileSync(eventJsonPath);
        const jsonData = JSON.parse(rawData.toString());
        
        storedEvents = jsonData.map(item => ({
          id: item.id,
          title: item.title,
          // 确保 start 和 end 是 ISO 字符串格式
          start: new Date(item.start).toISOString(),
          end: new Date(item.end).toISOString(),
          description: item.description || "",
          // 从 event.json 的 priority 映射到 categoryId，color 映射到 categoryColor
          categoryId: item.priority !== undefined ? item.priority : 5, // 假设 priority 可以映射到 categoryId
          categoryColor: item.color || "#43aa8b", // 使用 JSON 中的颜色
          allDay: item.allDay || false,
          eventType: mapJsonEventTypeToEnumString(item.type), // 映射 type 数字到字符串
          completed: item.completed || false,
        }));
        eventsStore.set('appEvents', storedEvents); // 将从 JSON 加载的数据存入 store
      } else {
        console.warn("event.json not found, starting with empty events list.");
        storedEvents = [];
        eventsStore.set('appEvents', []); // 确保 store 中也设置为空数组
      }
    } catch (error) {
      console.error("Error loading events from event.json:", error);
      storedEvents = [];
      eventsStore.set('appEvents', []); // 出错时也确保 store 中为空数组
    }
  }
  // 确保返回的数据中日期是 ISO 字符串
  return storedEvents.map(event => ({
    ...event,
    start: typeof event.start === 'string' ? event.start : new Date(event.start).toISOString(),
    end: typeof event.end === 'string' ? event.end : new Date(event.end).toISOString(),
  }));
});

// 保存事件
ipcMain.handle('save-events', async (event, eventsData) => {
  // 在保存前，确保 Date 对象转换为 ISO 字符串 (如果渲染器发送的是 Date 对象)
  // Pinia store 通常会发送序列化好的数据，但以防万一
  const serializableEvents = eventsData.map(e => ({
    ...e,
    start: new Date(e.start).toISOString(),
    end: new Date(e.end).toISOString(),
  }));
  eventsStore.set('appEvents', serializableEvents);
});
