import fs from "fs";
import path from "path";
import { Notification, dialog } from "electron";
// 修正：使用命名导入从 'docx' 库导入所需模块
import { Document, Packer, Table } from "docx";
import mammoth from "mammoth"; // 新增：导入 mammoth 库用于解析

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
 * @param {object} sqliteStore - SQLite 数据库存储实例，用于存储应用数据和设置。
 * @param {string} mainDirname - 应用的主目录路径 (通常是 `__dirname` 的值)。
 * @param {object} BrowserWindow - Electron 的 BrowserWindow 模块，用于创建和控制浏览器窗口。
 * 
 * @description
 * 此函数负责设置所有与主进程相关的 IPC 事件监听器。这些监听器处理来自渲染进程的请求，
 * 包括加载和保存应用数据（分类、事件）和用户设置。此外，它还管理窗口的基本操作，
 * 如最小化、最大化和关闭窗口。在初始化过程中，如果检测到用户数据或设置为空，
 * 函数会尝试从预定义的默认数据加载。
 */
export function initializeIpcHandlers(ipcMain, sqliteStore, mainDirname, BrowserWindow) {
  // ================= 应用数据（分类和事件）存储 IPC ==================

  /**
   * @description 
   * 处理 'load-app-data' IPC 事件。
   * 当渲染进程请求加载应用数据（分类和事件）时，此处理程序被调用。
   * 它首先尝试从 SQLite 数据库加载现有数据。如果数据不存在或为空，
   * 它会加载默认数据并保存到数据库。
   * 加载后，事件的日期会被标准化为 ISO 字符串格式。
   * @returns {Promise<object>} 一个包含 `categories` 和 `events` 的对象。
   */
  ipcMain.handle('load-app-data', async () => {
    // 从 SQLite 数据库获取分类和事件数据
    let categories = sqliteStore.getCategories();
    let appEvents = sqliteStore.getEvents();

    // 检查是否需要加载默认分类 (如果 'categories' 不存在或是空数组)
    const needsDefaultCategories = !categories || (Array.isArray(categories) && categories.length === 0);
    // 检查是否需要加载默认事件 (如果 'appEvents' 不存在或是空数组)
    const needsDefaultEvents = !appEvents || (Array.isArray(appEvents) && appEvents.length === 0);

    // 如果需要加载默认分类或默认事件
    if (needsDefaultCategories || needsDefaultEvents) {
      if (needsDefaultCategories) {
      categories = [
        { id: 1, name: "工作", color: "#e63946", active: true },
        { id: 2, name: "个人", color: "#f8961e", active: true },
        { id: 3, name: "家庭", color: "#fcbf49", active: true },
        { id: 4, name: "健康", color: "#2a9d8f", active: true },
        { id: 5, name: "其他", color: "#43aa8b", active: true },
      ];
      sqliteStore.setCategories(categories);
      console.log("Loaded default categories (hardcoded).");
      }

      if (needsDefaultEvents) {
      appEvents = []; // 默认事件为空数组
      sqliteStore.setEvents(appEvents);
      console.log("Initialized default events as an empty array (hardcoded).");
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
   * 它接收包含 `categories` 和 `events` 的对象，并将它们保存到 SQLite 数据库。
   * 事件的日期在保存前会被转换为 ISO 字符串格式，以确保数据存储的一致性。
   * @param {object} event - Electron IPC 事件对象 (未使用)。
   * @param {object} data - 包含 `categories` 和 `events` 数组的对象。
   * @returns {Promise<void>} 保存操作完成后解析的 Promise。
   */
  ipcMain.handle('save-app-data', async (event, data) => {
    const { categories, events } = data; // 从传入的数据中解构分类和事件
    if (categories) {
      sqliteStore.setCategories(categories); // 保存分类数据
    }
    if (events) {
      // 序列化事件数据，确保日期是 ISO 字符串
      const serializableEvents = events.map(e => ({
        ...e,
        start: new Date(e.start).toISOString(), // 转换为 ISO 字符串
        end: new Date(e.end).toISOString(),   // 转换为 ISO 字符串
      }));
      sqliteStore.setEvents(serializableEvents); // 保存事件数据
    }
  });

  // ================= 设置数据存储 IPC ==================

  // 加载设置
  /**
   * @description
   * 处理 'load-settings' IPC 事件。
   * 当渲染进程请求加载用户设置时，此处理程序被调用。
   * 它首先尝试从 SQLite 数据库加载现有用户设置。如果设置不存在或为空对象，
   * 它会加载默认设置并保存到数据库。
   * 加载的设置（无论是用户保存的还是默认的）随后返回给渲染进程。
   * @returns {Promise<object>} 用户的设置对象。
   */
  ipcMain.handle('load-settings', async () => {
    // 从 SQLite 数据库获取用户设置
    let userSettings = sqliteStore.getSettings();

    // 如果用户设置不存在或为空对象，则尝试加载默认设置
    if (!userSettings || Object.keys(userSettings).length === 0) {
      // 写死默认设置
      userSettings = {
      themeMode: "light",
      fontSize: "medium",
      iconStyle: "default",
      notifications: true,
      hour24: false,
      showLunar: false,
      weekStart: "0",
      language: "zh-CN"
      };
      sqliteStore.setSettings(userSettings); // 将默认设置存入 SQLite 数据库
      console.log("Loaded default settings (hardcoded) and saved to user config.");
    }
    return userSettings; // 返回加载的设置
  });

  // 保存设置
  /**
   * @description
   * 处理 'save-settings' IPC 事件。
   * 当渲染进程请求保存用户设置时，此处理程序被调用。
   * 它接收设置对象，并将其保存到 SQLite 数据库。
   * @param {object} event - Electron IPC 事件对象 (未使用)。
   * @param {object} settings - 要保存的用户设置对象。
   * @returns {Promise<object>} 一个包含 `success` (布尔值) 和可选 `error` (字符串) 的对象，指示操作结果。
   */
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      sqliteStore.setSettings(settings); // 保存用户设置
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

  // 新增：处理课程表导入
  ipcMain.handle('import-schedule', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Word Documents', extensions: ['docx'] }],
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, message: '用户取消了文件选择' };
    }

    const filePath = filePaths[0];

    try {
      // 使用 mammoth 将 docx 转换为 HTML，以便解析表格
      const { value: html } = await mammoth.convertToHtml({ path: filePath });

      // 这是一个非常基础的HTML表格解析，可能需要根据实际的DOCX结构调整
      // 它查找第一个<table>, 然后提取所有<tr>和<td>
      const tableMatch = html.match(/<table.*?>([\s\S]*?)<\/table>/);
      if (!tableMatch) {
        return { success: false, message: '在文档中未找到表格' };
      }

      const tableHtml = tableMatch[1];
      const rowsHtml = tableHtml.match(/<tr.*?>([\s\S]*?)<\/tr>/g) || [];
      
      const schedule = [];
      const timeSlots = [
        { start: '08:00', end: '09:40' }, // 第1-2节
        { start: '10:00', end: '11:40' }, // 第3-4节
        { start: '14:00', end: '15:40' }, // 第5-6节
        { start: '16:00', end: '17:40' }, // 第7-8节
        { start: '19:00', end: '20:40' }, // 第9-10节
      ];

      // 从第二行开始解析 (第一行为标题)
      for (let i = 1; i < rowsHtml.length; i++) {
        const timeSlot = timeSlots[i - 1];
        if (!timeSlot) continue;

        const cellsHtml = rowsHtml[i].match(/<td.*?>([\s\S]*?)<\/td>/g) || [];
        
        // 从第二列开始解析 (第一列为节次)
        for (let j = 1; j < cellsHtml.length; j++) {
          // 移除HTML标签并清理文本
          const cellText = cellsHtml[j].replace(/<.*?>/g, '').trim();
          if (cellText) {
            schedule.push({
              courseName: cellText,
              dayOfWeek: j, // 1:周一, 2:周二, ..., 7:周日
              startTime: timeSlot.start,
              endTime: timeSlot.end,
            });
          }
        }
      }

      if (schedule.length === 0) {
        return { success: false, message: '表格为空或无法解析课程内容' };
      }

      return { success: true, schedule };
    } catch (error) {
      console.error('解析课程表文件失败:', error);
      return { success: false, message: `解析失败: ${error.message}` };
    }
  });
}
