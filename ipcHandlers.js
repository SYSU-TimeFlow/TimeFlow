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
      if (needsDefaultCategories) {
      categories = [
        { id: 1, name: "工作", color: "#e63946", active: true },
        { id: 2, name: "个人", color: "#f8961e", active: true },
        { id: 3, name: "家庭", color: "#fcbf49", active: true },
        { id: 4, name: "健康", color: "#2a9d8f", active: true },
        { id: 5, name: "其他", color: "#43aa8b", active: true },
      ];
      appDataStore.set('appCategories', categories);
      console.log("Loaded default categories (hardcoded).");
      }

      if (needsDefaultEvents) {
      appEvents = []; // 默认事件为空数组
      appDataStore.set('appEvents', appEvents);
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
      settingsConfigStore.set('userSettings', userSettings); // 将默认设置存入 electron-store
      console.log("Loaded default settings (hardcoded) and saved to user config.");
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
      const { value: html } = await mammoth.convertToHtml({ path: filePath });

      const tableMatch = html.match(/<table.*?>([\s\S]*?)<\/table>/);
      if (!tableMatch) {
        return { success: false, message: '在文档中未找到表格' };
      }

      const tableHtml = tableMatch[1];
      const rowsHtml = tableHtml.match(/<tr.*?>([\s\S]*?)<\/tr>/g) || [];
      if (rowsHtml.length < 2) {
        return { success: false, message: '表格内容过少，无法解析' };
      }

      const grid = [];
      const timeSlotsInfo = []; // 存储每行的时间信息 { start, end }
      const dayHeaders = []; // 存储表头的星期信息

      // 1. 构建表格网格并解析时间/星期信息
      rowsHtml.forEach((rowHtml, rowIndex) => {
        if (!grid[rowIndex]) grid[rowIndex] = [];
        const cellsHtml = rowHtml.match(/<td.*?>(?:<p>)?([\s\S]*?)(?:<\/p>)?<\/td>/g) || [];
        let gridColIndex = 0;

        cellsHtml.forEach((cellHtml) => {
          while (grid[rowIndex][gridColIndex]) {
            gridColIndex++;
          }

          const rowspan = parseInt((cellHtml.match(/rowspan="(\d+)"/) || [])[1] || '1', 10);
          const colspan = parseInt((cellHtml.match(/colspan="(\d+)"/) || [])[1] || '1', 10);
          const cellText = cellHtml.replace(/<.*?>/g, ' ').replace(/\s+/g, ' ').trim();

          for (let r = 0; r < rowspan; r++) {
            for (let c = 0; c < colspan; c++) {
              if (!grid[rowIndex + r]) grid[rowIndex + r] = [];
              grid[rowIndex + r][gridColIndex + c] = { text: cellText, isPlaceholder: r > 0 || c > 0 };
            }
          }
          gridColIndex += colspan;

          // 解析第一列的时间段
          if (gridColIndex === 1 && rowIndex > 0) {
            const timeMatch = cellText.match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);
            if (timeMatch) {
              timeSlotsInfo[rowIndex] = { start: timeMatch[1], end: timeMatch[2] };
            } else {
              timeSlotsInfo[rowIndex] = null; // 无效时间格式
            }
          }
          // 解析第一行的星期
          if (rowIndex === 0 && gridColIndex > 1) {
            dayHeaders[gridColIndex - 1] = cellText;
          }
        });
      });

      // 2. 从网格中提取课程
      const schedule = [];
      const processedCells = new Set();
      const occupiedSlots = new Set(); // 新增：用于跟踪已被占用的时间段

      for (let r = 1; r < grid.length; r++) {
        for (let c = 1; c < (grid[r] || []).length; c++) {
          const cellKey = `${r},${c}`;
          if (!grid[r][c] || grid[r][c].isPlaceholder || processedCells.has(cellKey) || !grid[r][c].text) {
            continue;
          }
          processedCells.add(cellKey);

          // 确定课程跨越的行数
          let rowSpanCount = 1;
          while (r + rowSpanCount < grid.length && grid[r + rowSpanCount][c] && grid[r + rowSpanCount][c].isPlaceholder) {
            processedCells.add(`${r + rowSpanCount},${c}`);
            rowSpanCount++;
          }

          const startTimeInfo = timeSlotsInfo[r];
          const endTimeInfo = timeSlotsInfo[r + rowSpanCount - 1];
          
          // 修正：通过查找第一行的表头来确定星期几
          const dayHeaderCell = grid[0][c];
          const dayHeaderText = dayHeaderCell ? dayHeaderCell.text : '';
          const dayMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7 };
          let dayOfWeek = -1;
          for (const key in dayMap) {
            if (dayHeaderText.includes(key)) {
              dayOfWeek = dayMap[key];
              break;
            }
          }

          // 如果无法从表头解析出星期，则跳过此课程
          if (dayOfWeek === -1) {
            continue;
          }

          if (startTimeInfo && endTimeInfo) {
            const slotKey = `${dayOfWeek}-${startTimeInfo.start}-${endTimeInfo.end}`; // 创建时间段的唯一标识

            // 检查此时间段是否已被占用
            if (occupiedSlots.has(slotKey)) {
              continue; // 如果已占用，则跳过此课程，只保留第一个
            }

            // 标记时间段为已占用并添加课程
            occupiedSlots.add(slotKey);
            schedule.push({
              courseName: grid[r][c].text,
              dayOfWeek: dayOfWeek,
              startTime: startTimeInfo.start,
              endTime: endTimeInfo.end,
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
