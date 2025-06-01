import fs from "fs";
import path from "path";
import { Notification } from "electron";

const mapJsonEventTypeToEnumString = (typeNumber) => {
  switch (typeNumber) {
    case 0: return "todo";
    case 1: return "calendar";
    case 2: return "both";
    default: return "calendar"; // 默认为日历事件
  }
};
/**
 * 初始化应用的 IPC (Inter-Process Communication) 处理程序。
 * 
 * @param {object} ipcMain - Electron 的 IPC 主进程模块，用于在主进程和渲染进程之间进行异步通信。
 * @param {object} appDataStore - 用于存储应用核心数据（如分类和事件）的 `electron-store` 实例。
 * @param {object} settingsConfigStore - 用于存储用户设置配置的 `electron-store` 实例。
 * @param {string} mainDirname - 应用的主目录路径 (通常是 `__dirname` 的值)。
 * @param {object} BrowserWindow - Electron 的 BrowserWindow 模块，用于创建和控制浏览器窗口。
 * 
 * @description
 * 此函数负责设置所有与主进程相关的 IPC 事件监听器。这些监听器处理来自渲染进程的请求，
 * 包括加载和保存应用数据（分类、事件）和用户设置。此外，它还管理窗口的基本操作，
 * 如最小化、最大化和关闭窗口。在初始化过程中，如果检测到用户数据或设置为空，
 * 函数会尝试从预定义的 JSON 文件加载默认数据。
 */
export function initializeIpcHandlers(ipcMain, appDataStore, settingsConfigStore, mainDirname, BrowserWindow) {
  // ================= 应用数据（分类和事件）存储 IPC ==================

  /**
   * @description 
   * 处理 'load-app-data' IPC 事件。
   * 当渲染进程请求加载应用数据（分类和事件）时，此处理程序被调用。
   * 它首先尝试从 `appDataStore` 加载现有数据。如果数据不存在或为空，
   * 它会尝试从 `src/stores/dev/event_data.json` 文件加载默认数据。
   * 加载后，事件的日期会被标准化为 ISO 字符串格式。
   * @returns {Promise<object>} 一个包含 `categories` 和 `events` 的对象。
   */
  ipcMain.handle('load-app-data', async () => {
    // 从 electron-store 获取分类和事件数据
    let categories = appDataStore.get('appCategories');
    let appEvents = appDataStore.get('appEvents');

    // 检查是否需要加载默认分类 (如果 'categories' 不存在或是空数组)
    const needsDefaultCategories = !categories || (Array.isArray(categories) && categories.length === 0);
    // 检查是否需要加载默认事件 (如果 'appEvents' 不存在或是空数组)
    const needsDefaultEvents = !appEvents || (Array.isArray(appEvents) && appEvents.length === 0);

    // 如果需要加载默认分类或默认事件
    if (needsDefaultCategories || needsDefaultEvents) {
      try {
        const defaultDataPath = path.join(mainDirname, 'src', 'stores', 'dev', 'event_data.json');
        if (fs.existsSync(defaultDataPath)) {
          const rawData = fs.readFileSync(defaultDataPath);
          const defaultData = JSON.parse(rawData.toString());

          if (needsDefaultCategories) {
            categories = Array.isArray(defaultData.appCategories) ? defaultData.appCategories : [];
            appDataStore.set('appCategories', categories);
            console.log("Loaded default categories from default_app_data.json");
          }

          if (needsDefaultEvents) {
            const rawEvents = Array.isArray(defaultData.appEvents) ? defaultData.appEvents : [];
            appEvents = rawEvents.map(item => ({
              id: item.id,
              title: item.title,
              start: new Date(item.start).toISOString(),
              end: new Date(item.end).toISOString(),
              description: item.description || "",
              categoryId: item.categoryId, // 修复：确保使用正确的分类 ID
              categoryColor: item.categoryColor || "#43aa8b",
              allDay: item.allDay || false,
              eventType: mapJsonEventTypeToEnumString(item.type),
              completed: item.completed || false,
            }));
            appDataStore.set('appEvents', appEvents);
            console.log("Loaded default events from default_app_data.json");
          }
        } else {
          console.warn("default_app_data.json not found. Initializing with empty data.");
          if (needsDefaultCategories) categories = [];
          if (needsDefaultEvents) appEvents = [];
        }
      } catch (error) {
        console.error("Error loading default data from default_app_data.json:", error);
        if (needsDefaultCategories) categories = [];
        if (needsDefaultEvents) appEvents = [];
      }
    }

    // 确保所有事件的 start 和 end 属性是 ISO 字符串格式
    // 这对于 FullCalendar 等库是必要的，并且保证了数据的一致性
    const processedEvents = appEvents.map(event => ({
      ...event,
      start: typeof event.start === 'string' ? event.start : new Date(event.start).toISOString(),
      end: typeof event.end === 'string' ? event.end : new Date(event.end).toISOString(),
    }));

    // 返回加载的分类和处理后的事件
    return { categories, events: processedEvents };
  });

  // 保存应用数据 (分类和事件)
  /**
   * @description
   * 处理 'save-app-data' IPC 事件。
   * 当渲染进程请求保存应用数据（分类和事件）时，此处理程序被调用。
   * 它接收包含 `categories` 和 `events` 的对象，并将它们保存到 `appDataStore`。
   * 事件的日期在保存前会被转换为 ISO 字符串格式，以确保数据存储的一致性。
   * @param {object} event - Electron IPC 事件对象 (未使用)。
   * @param {object} data - 包含 `categories` 和 `events` 数组的对象。
   * @returns {Promise<void>} 保存操作完成后解析的 Promise。
   */
  ipcMain.handle('save-app-data', async (event, data) => {
    const { categories, events } = data; // 从传入的数据中解构分类和事件
    if (categories) {
      appDataStore.set('appCategories', categories); // 保存分类数据
    }
    if (events) {
      // 序列化事件数据，确保日期是 ISO 字符串
      const serializableEvents = events.map(e => ({
        ...e,
        start: new Date(e.start).toISOString(), // 转换为 ISO 字符串
        end: new Date(e.end).toISOString(),   // 转换为 ISO 字符串
      }));
      appDataStore.set('appEvents', serializableEvents); // 保存事件数据
    }
  });

  // ================= 设置数据存储 IPC ==================

  // 加载设置
  /**
   * @description
   * 处理 'load-settings' IPC 事件。
   * 当渲染进程请求加载用户设置时，此处理程序被调用。
   * 它首先尝试从 `settingsConfigStore` 加载现有用户设置。如果设置不存在或为空对象，
   * 它会尝试从 `src/stores/dev/settings_data.json` 文件加载默认设置。
   * 加载的设置（无论是用户保存的还是默认的）随后返回给渲染进程。
   * @returns {Promise<object>} 用户的设置对象。
   */
  ipcMain.handle('load-settings', async () => {
    // 从 electron-store 获取用户设置
    let userSettings = settingsConfigStore.get('userSettings');

    // 如果用户设置不存在或为空对象，则尝试加载默认设置
    if (!userSettings || Object.keys(userSettings).length === 0) {
      try {
        // 构建默认设置文件的路径
        const defaultSettingsPath = path.join(mainDirname, 'src', 'stores', 'dev', 'settings_data.json');
        // 检查默认设置文件是否存在
        if (fs.existsSync(defaultSettingsPath)) {
          const rawData = fs.readFileSync(defaultSettingsPath); // 读取原始数据
          userSettings = JSON.parse(rawData.toString()); // 解析 JSON 数据
          settingsConfigStore.set('userSettings', userSettings); // 将默认设置存入 electron-store
          console.log("Loaded default settings from settings_data.json and saved to user config.");
        } else {
          // 如果默认设置文件不存在
          console.warn("Default settings_data.json not found. User settings will be empty or default.");
          userSettings = {}; // 初始化为空对象
        }
      } catch (error) {
        // 处理加载默认设置时发生的错误
        console.error("Error loading default settings from settings_data.json:", error);
        userSettings = {}; // 发生错误时，初始化为空对象
      }
    }
    return userSettings; // 返回加载的设置
  });

  // 保存设置
  /**
   * @description
   * 处理 'save-settings' IPC 事件。
   * 当渲染进程请求保存用户设置时，此处理程序被调用。
   * 它接收设置对象，并将其保存到 `settingsConfigStore`。
   * @param {object} event - Electron IPC 事件对象 (未使用)。
   * @param {object} settings - 要保存的用户设置对象。
   * @returns {Promise<object>} 一个包含 `success` (布尔值) 和可选 `error` (字符串) 的对象，指示操作结果。
   */
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      settingsConfigStore.set('userSettings', settings); // 保存用户设置
      return { success: true }; // 返回成功状态
    } catch (error) {
      console.error("Error saving settings to user config:", error);
      return { success: false, error: error.message }; // 返回失败状态和错误信息
    }
  });

  // ================= 监听窗口操作事件 ==================
  // 最小化窗口
  ipcMain.on("window-minimize", () => {
    const win = BrowserWindow.getFocusedWindow(); // 获取当前聚焦的窗口
    if (win) {
      win.minimize(); // 最小化窗口
    }
  });

  // 最大化/还原窗口
  ipcMain.on("window-maximize", () => {
    const win = BrowserWindow.getFocusedWindow(); // 获取当前聚焦的窗口
    if (win) {
      if (win.isMaximized()) { // 检查窗口是否已最大化
        win.unmaximize(); // 还原窗口
      } else {
        win.maximize(); // 最大化窗口
      }
    }
  });

  // 关闭窗口
  ipcMain.on("window-close", () => {
    const win = BrowserWindow.getFocusedWindow(); // 获取当前聚焦的窗口
    if (win) {
      win.close(); // 关闭窗口
    }
  });

  // 新增：系统通知处理
  ipcMain.handle('notify', (event, { title, body }) => {
    const notification = new Notification({ title, body, silent: false });
    notification.show();
    notification.on('click', () => {
      const win = BrowserWindow.getAllWindows()[0]; // 获取第一个窗口
      if (win) {
        win.show(); // 点击通知时显示窗口
      }
    });
    setTimeout(() => notification.close(), 5000); // 5秒后自动关闭
  });
}
