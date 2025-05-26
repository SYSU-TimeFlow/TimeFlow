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
    win.webContents.openDevTools();
  } else {
    // 在生产模式下加载vite打包后的文件
    win.loadFile(path.join(__dirname, "dist/index.html"));
  }
};

// 修改：初始化 electron-store 用于应用数据（分类和事件）
const appDataStore = new Store({ name: "events_data" });

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

// 修改：================= 应用数据（分类和事件）存储 IPC ==================

// 事件类型映射 (从 event.json 的 type 数字到 EventType 枚举字符串)
const mapJsonEventTypeToEnumString = (typeNumber) => {
  switch (typeNumber) {
    case 0: return "todo";
    case 1: return "calendar";
    case 2: return "both";
    default: return "calendar"; // 默认为日历事件
  }
};

// 修改：加载应用数据 (分类和事件)
ipcMain.handle('load-app-data', async () => {
  let categories = appDataStore.get('appCategories');
  let appEvents = appDataStore.get('appEvents');

  // 检查是否需要从默认文件加载数据
  const needsDefaultCategories = !categories || (Array.isArray(categories) && categories.length === 0);
  const needsDefaultEvents = !appEvents || (Array.isArray(appEvents) && appEvents.length === 0);

  if (needsDefaultCategories || needsDefaultEvents) {
    try {
      const defaultDataPath = path.join(__dirname, 'src', 'stores', 'first_load_for_dev', 'event_data.json');
      if (fs.existsSync(defaultDataPath)) {
        const rawData = fs.readFileSync(defaultDataPath);
        const defaultData = JSON.parse(rawData.toString());

        if (needsDefaultCategories) {
          categories = defaultData.appCategories || [];
          appDataStore.set('appCategories', categories);
          console.log("Loaded default categories from default_app_data.json");
        }

        if (needsDefaultEvents) {
          const rawEvents = defaultData.appEvents || [];
          appEvents = rawEvents.map(item => ({
            id: item.id,
            title: item.title,
            start: new Date(item.start).toISOString(),
            end: new Date(item.end).toISOString(),
            description: item.description || "",
            categoryId: item.priority !== undefined ? item.priority : 5, // 'priority' in JSON maps to 'categoryId'
            categoryColor: item.color || "#43aa8b", // Ensure color is derived correctly
            allDay: item.allDay || false,
            eventType: mapJsonEventTypeToEnumString(item.type),
            completed: item.completed || false,
          }));
          appDataStore.set('appEvents', appEvents);
          console.log("Loaded default events from default_app_data.json");
        }
      } else {
        console.warn("default_app_data.json not found. Initializing with empty data.");
        if (needsDefaultCategories) {
          categories = [];
          appDataStore.set('appCategories', []);
        }
        if (needsDefaultEvents) {
          appEvents = [];
          appDataStore.set('appEvents', []);
        }
      }
    } catch (error) {
      console.error("Error loading default data from default_app_data.json:", error);
      if (needsDefaultCategories) {
        categories = [];
        appDataStore.set('appCategories', []);
      }
      if (needsDefaultEvents) {
        appEvents = [];
        appDataStore.set('appEvents', []);
      }
    }
  }
  
  // 确保返回的数据中日期是 ISO 字符串
  const processedEvents = appEvents.map(event => ({
    ...event,
    start: typeof event.start === 'string' ? event.start : new Date(event.start).toISOString(),
    end: typeof event.end === 'string' ? event.end : new Date(event.end).toISOString(),
  }));

  return { categories, events: processedEvents };
});

// 修改：保存应用数据 (分类和事件)
ipcMain.handle('save-app-data', async (event, data) => {
  const { categories, events } = data;
  if (categories) {
    appDataStore.set('appCategories', categories);
  }
  if (events) {
    const serializableEvents = events.map(e => ({
      ...e,
      start: new Date(e.start).toISOString(),
      end: new Date(e.end).toISOString(),
    }));
    appDataStore.set('appEvents', serializableEvents);
  }
});
