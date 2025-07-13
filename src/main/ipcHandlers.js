import { Notification, dialog } from "electron";
import mammoth from "mammoth"; // 用于解析 docx 文件，便于课程表导入
import * as chrono from "chrono-node"; // 用于自然语言日期解析，提升用户输入体验
import logger from "./logger.js"; // 统一日志管理，便于问题追踪

/**
 * 初始化主进程的 IPC 事件处理器，负责主进程与渲染进程的数据和操作交互。
 * 
 * 为什么这样做：
 * - 通过集中管理 IPC 事件，确保主进程与渲染进程的数据同步和状态一致，避免分散处理导致的维护困难。
 * - 统一处理应用数据（分类、事件）、用户设置、窗口操作、通知、文件导入、自然语言解析等功能，便于扩展和调试。
 * - 在数据为空或异常时自动加载默认数据，保证应用稳定运行，提升用户体验。
 * - 日志系统贯穿各处理流程，方便定位问题和分析用户行为。
 * 
 * 参数说明：
 * @param {object} ipcMain - Electron 主进程 IPC 模块，负责事件监听和处理。
 * @param {object} sqliteStore - SQLite 数据库实例，持久化存储应用数据和设置。
 * @param {string} mainDirname - 应用主目录路径，部分文件操作需要。
 * @param {object} BrowserWindow - Electron 窗口管理模块，支持窗口相关操作。
 */
export function initializeIpcHandlers(
  ipcMain,
  sqliteStore,
  mainDirname,
  BrowserWindow
) {
  logger.info("Initializing IPC handlers");

  // ================= 应用数据（分类和事件）存储 IPC ==================
  /**
   * 加载应用数据（分类和事件）。
   */
  ipcMain.handle("load-app-data", async () => {
    logger.ipc("load-app-data", "receive", { action: "loading_app_data" });

    try {
      // 从 SQLite 数据库获取分类和事件数据
      let categories = sqliteStore.getCategories();
      let appEvents = sqliteStore.getEvents();

      // 检查是否需要加载默认分类 (如果 'categories' 不存在或是空数组)
      const needsDefaultCategories =
        !categories || (Array.isArray(categories) && categories.length === 0);
      // 检查是否需要加载默认事件 (如果 'appEvents' 不存在或是空数组)
      const needsDefaultEvents =
        !appEvents || (Array.isArray(appEvents) && appEvents.length === 0);

      // 如果需要加载默认分类或默认事件
      if (needsDefaultCategories || needsDefaultEvents) {
        if (needsDefaultCategories) {
          logger.info("Loading default categories");
          categories = [
            { id: 1, name: "Work", color: "#e63946", active: true },
            { id: 2, name: "Personal", color: "#f8961e", active: true },
            { id: 3, name: "Family", color: "#fcbf49", active: true },
            { id: 4, name: "Health", color: "#2a9d8f", active: true },
            { id: 5, name: "Other", color: "#43aa8b", active: true },
          ];
          sqliteStore.setCategories(categories);
          logger.info("Loaded default categories (hardcoded)");
        }

        if (needsDefaultEvents) {
          logger.info("Initializing default events as empty array");
          appEvents = []; // 默认事件为空数组
          sqliteStore.setEvents(appEvents);
          logger.info(
            "Initialized default events as an empty array (hardcoded)"
          );
        }
      }

      // 确保所有事件的 start 和 end 属性是 ISO 字符串格式
      // 这对于 FullCalendar 等库是必要的，并且保证了数据的一致性
      const processedEvents = appEvents.map((event) => ({
        ...event,
        start:
          typeof event.start === "string"
            ? event.start
            : new Date(event.start).toISOString(),
        end:
          typeof event.end === "string"
            ? event.end
            : new Date(event.end).toISOString(),
      }));

      logger.ipc("load-app-data", "send", {
        action: "app_data_loaded",
        categoriesCount: categories.length,
        eventsCount: processedEvents.length,
      });

      // 返回加载的分类和处理后的事件
      return { categories, events: processedEvents };
    } catch (error) {
      logger.error("Failed to load app data", error);
      // 返回默认数据以防止应用崩溃
      return {
        categories: [
          { id: 1, name: "Work", color: "#e63946", active: true },
          { id: 2, name: "Personal", color: "#f8961e", active: true },
          { id: 3, name: "Family", color: "#fcbf49", active: true },
          { id: 4, name: "Health", color: "#2a9d8f", active: true },
          { id: 5, name: "Other", color: "#43aa8b", active: true },
        ],
        events: [],
      };
    }
  });

  /**
   * 保存应用数据（分类和事件）。
   */
  ipcMain.handle("save-app-data", async (event, data) => {
    logger.ipc("save-app-data", "receive", {
      action: "saving_app_data",
      hasCategories: !!data?.categories,
      hasEvents: !!data?.events,
      categoriesCount: data?.categories?.length || 0,
      eventsCount: data?.events?.length || 0,
    });

    try {
      const { categories, events } = data; // 从传入的数据中解构分类和事件

      if (categories) {
        logger.database("UPDATE", "categories", { count: categories.length });
        sqliteStore.setCategories(categories); // 保存分类数据
      }

      if (events) {
        // 序列化事件数据，确保日期是 ISO 字符串
        const serializableEvents = events.map((e) => ({
          ...e,
          start: new Date(e.start).toISOString(), // 转换为 ISO 字符串
          end: new Date(e.end).toISOString(), // 转换为 ISO 字符串
        }));

        logger.database("UPDATE", "events", {
          count: serializableEvents.length,
        });
        sqliteStore.setEvents(serializableEvents); // 保存事件数据
      }

      logger.ipc("save-app-data", "send", {
        action: "app_data_saved",
        success: true,
      });
    } catch (error) {
      logger.error("Failed to save app data", error);
      throw error; // 重新抛出错误，让调用方处理
    }
  });

  // ================= 设置数据存储 IPC ==================
  /**
   * 加载用户设置。
   */
  ipcMain.handle("load-settings", async () => {
    logger.ipc("load-settings", "receive", { action: "loading_settings" });

    try {
      // 从 SQLite 数据库获取用户设置
      let userSettings = sqliteStore.getSettings();

      // 如果用户设置不存在或为空对象，则尝试加载默认设置
      if (!userSettings || Object.keys(userSettings).length === 0) {
        logger.info("No user settings found, loading default settings");

        // 写死默认设置
        userSettings = {
          themeMode: "light",
          fontSize: "medium",
          iconStyle: "default",
          notifications: true,
          hour24: false,
          showLunar: false,
          weekStart: "0",
          language: "zh-CN",
          hasWelcomeBeenShown: false,
        };
        sqliteStore.setSettings(userSettings); // 将默认设置存入 SQLite 数据库
        logger.info(
          "Loaded default settings (hardcoded) and saved to user config"
        );
      }

      logger.ipc("load-settings", "send", {
        action: "settings_loaded",
        settingsCount: Object.keys(userSettings).length,
      });

      return userSettings; // 返回加载的设置
    } catch (error) {
      logger.error("Failed to load settings", error);
      // 返回默认设置以防止应用崩溃
      return {
        themeMode: "light",
        fontSize: "medium",
        iconStyle: "default",
        notifications: true,
        hour24: false,
        showLunar: false,
        weekStart: "0",
        language: "zh-CN",
        hasWelcomeBeenShown: false,
      };
    }
  });

  /**
   * 保存用户设置。
   */
  ipcMain.handle("save-settings", async (event, settings) => {
    logger.ipc("save-settings", "receive", {
      action: "saving_settings",
      settingsCount: Object.keys(settings || {}).length,
    });

    const win = BrowserWindow.getAllWindows()[0];
    try {
      sqliteStore.setSettings(settings); // 保存用户设置

      logger.ipc("save-settings", "send", {
        action: "settings_saved",
        success: true,
      });

      return { success: true }; // 返回成功状态
    } catch (error) {
      console.error("Error saving settings to user config:", error);
      const msg = `设置保存失败: ${error.message}`;
      if (win) win.webContents.send("show-info-message", msg);
      return { success: false, error: error.message }; // 返回失败状态和错误信息
    }
  });

  // ================= 监听窗口操作事件 ==================
  /**
   * 最小化窗口。
   */
  ipcMain.on("window-minimize", () => {
    logger.ipc("window-minimize", "receive", { action: "minimize_window" });
    const win = BrowserWindow.getFocusedWindow(); // 获取当前聚焦的窗口
    if (win) {
      win.minimize(); // 最小化窗口
      logger.user("window_minimize", { windowId: win.id });
    } else {
      logger.warn("No focused window found for minimize operation");
    }
  });

  /**
   * 最大化或还原窗口。
   */
  ipcMain.on("window-maximize", () => {
    logger.ipc("window-maximize", "receive", {
      action: "maximize_toggle_window",
    });
    const win = BrowserWindow.getFocusedWindow(); // 获取当前聚焦的窗口
    if (win) {
      if (win.isMaximized()) {
        // 检查窗口是否已最大化
        win.unmaximize(); // 还原窗口
        logger.user("window_unmaximize", { windowId: win.id });
      } else {
        win.maximize(); // 最大化窗口
        logger.user("window_maximize", { windowId: win.id });
      }
    } else {
      logger.warn("No focused window found for maximize operation");
    }
  });

  /**
   * 关闭窗口。
   */
  ipcMain.on("window-close", () => {
    logger.ipc("window-close", "receive", { action: "close_window" });
    const win = BrowserWindow.getFocusedWindow(); // 获取当前聚焦的窗口
    if (win) {
      logger.user("window_close", { windowId: win.id });
      win.close(); // 关闭窗口
    } else {
      logger.warn("No focused window found for close operation");
    }
  });

  // ================= 系统通知处理 ==================
  /**
   * 展示系统通知。
   */
  ipcMain.handle("notify", (event, { title, body }) => {
    logger.ipc("notify", "receive", {
      action: "show_notification",
      title: title?.substring(0, 50), // 限制日志中的标题长度
      hasBody: !!body,
    });

    try {
      const notification = new Notification({ title, body, silent: false });
      notification.show();

      notification.on("click", () => {
        logger.user("notification_click", { title: title?.substring(0, 50) });
        const win = BrowserWindow.getAllWindows()[0]; // 获取第一个窗口
        if (win) {
          win.show(); // 点击通知时显示窗口
        }
      });

      setTimeout(() => {
        notification.close();
        logger.debug("Notification auto-closed after 5 seconds");
      }, 5000); // 5秒后自动关闭

      logger.user("notification_shown", { title: title?.substring(0, 50) });
    } catch (error) {
      logger.error("Failed to show notification", error);
    }
  });

  // ================= 课程表导入处理 ==================
  /**
   * 导入课程表文件（docx）。
   */
  ipcMain.handle("import-schedule", async () => {
    const win = BrowserWindow.getAllWindows()[0];
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "All Files", extensions: ["*"] }],
    });

    const filePath = filePaths[0];

    // 检查文件扩展名
    const fileExtension = filePath.split(".").pop().toLowerCase();
    if (fileExtension !== "docx") {
      // 如果不是docx格式，打开浏览器跳转到转换网站
      try {
        await shell.openExternal("https://cloudconvert.com/");
        const msg =
          "只支持.docx格式的文件。已为您打开CloudConvert网站，您可以在此将其他格式转换为.docx格式。";
        if (win) win.webContents.send("show-info-message", msg);
        return { success: false };
      } catch (error) {
        const msg =
          "只支持.docx格式的文件。请将文件转换为.docx格式后重试。您可以访问 https://cloudconvert.com/ 进行格式转换。";
        if (win) win.webContents.send("show-info-message", msg);
        return { success: false };
      }
    }

    try {
      const { value: html } = await mammoth.convertToHtml({ path: filePath });

      const tableMatch = html.match(/<table.*?>([\s\S]*?)<\/table>/);
      if (!tableMatch) {
        const msg = "在文档中未找到表格";
        if (win) win.webContents.send("show-info-message", msg);
        return { success: false };
      }

      const tableHtml = tableMatch[1];
      const rowsHtml = tableHtml.match(/<tr.*?>([\s\S]*?)<\/tr>/g) || [];
      if (rowsHtml.length < 2) {
        const msg = "表格内容过少，无法解析";
        if (win) win.webContents.send("show-info-message", msg);
        return { success: false };
      }

      const grid = [];
      const timeSlotsInfo = []; // 存储每行的时间信息 { start, end }
      const dayHeaders = []; // 存储表头的星期信息

      // 1. 构建表格网格并解析时间/星期信息
      rowsHtml.forEach((rowHtml, rowIndex) => {
        if (!grid[rowIndex]) grid[rowIndex] = [];
        const cellsHtml =
          rowHtml.match(/<td.*?>(?:<p>)?([\s\S]*?)(?:<\/p>)?<\/td>/g) || [];
        let gridColIndex = 0;

        cellsHtml.forEach((cellHtml) => {
          while (grid[rowIndex][gridColIndex]) {
            gridColIndex++;
          }

          const rowspan = parseInt(
            (cellHtml.match(/rowspan="(\d+)"/) || [])[1] || "1",
            10
          );
          const colspan = parseInt(
            (cellHtml.match(/colspan="(\d+)"/) || [])[1] || "1",
            10
          );
          const cellText = cellHtml
            .replace(/<.*?>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          for (let rLoop = 0; rLoop < rowspan; rLoop++) {
            for (let cLoop = 0; cLoop < colspan; cLoop++) {
              if (!grid[rowIndex + rLoop]) grid[rowIndex + rLoop] = [];
              // 在网格中存储原始的 rowspan 信息
              grid[rowIndex + rLoop][gridColIndex + cLoop] = {
                text: cellText,
                isPlaceholder: rLoop > 0 || cLoop > 0,
                // 存储原始的 rowspan
                rowspan: rLoop === 0 && cLoop === 0 ? rowspan : 0,
              };
            }
          }
          gridColIndex += colspan;

          // 解析第一列的时间段
          if (gridColIndex === 1 && rowIndex > 0) {
            const timeMatch = cellText.match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);
            if (timeMatch) {
              timeSlotsInfo[rowIndex] = {
                start: timeMatch[1],
                end: timeMatch[2],
              };
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
      // const occupiedSlots = new Set(); // 已移除：不再需要跟踪占用的时间段

      for (let r = 1; r < grid.length; r++) {
        for (let c = 1; c < (grid[r] || []).length; c++) {
          const cellKey = `${r},${c}`;
          const currentCell = grid[r][c];
          if (
            !currentCell ||
            currentCell.isPlaceholder ||
            processedCells.has(cellKey) ||
            !currentCell.text
          ) {
            continue;
          }

          // 直接使用存储的 rowspan，不再手动计算
          const rowSpanCount = currentCell.rowspan || 1;

          // 标记所有被占用的单元格
          for (let i = 0; i < rowSpanCount; i++) {
            processedCells.add(`${r + i},${c}`);
          }

          const startTimeInfo = timeSlotsInfo[r];
          const endTimeInfo = timeSlotsInfo[r + rowSpanCount - 1];

          // 通过查找第一行的表头来确定星期几
          const dayHeaderCell = grid[0][c];
          const dayHeaderText = dayHeaderCell ? dayHeaderCell.text : "";
          const dayMap = {
            一: 1,
            二: 2,
            三: 3,
            四: 4,
            五: 5,
            六: 6,
            日: 7,
            天: 7,
          };
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
            // 解析课程名称中的周数范围
            let courseText = grid[r][c].text;
            let startWeek = 1; // 默认开始周
            let endWeek = 18; // 默认结束周 (与渲染器逻辑一致)

            // 匹配 "1-8周", "1-8每周", "(1-8周)" 等格式
            const weekRangeMatch = courseText.match(
              /\(?(\d+)-(\d+)\s*(周|每周)\)?/
            );
            if (weekRangeMatch) {
              startWeek = parseInt(weekRangeMatch[1], 10);
              endWeek = parseInt(weekRangeMatch[2], 10);
              // 清理课程名称，移除周数信息
              courseText = courseText.replace(weekRangeMatch[0], "").trim();
            }

            // 解析课程信息：格式为 "学历(课程类别)课程名称/老师/校园地点-教学楼号-教室号(座位数)/人数"
            let finalCourseName = courseText;
            let classRoom = "";
            let courseCategory = "";
            let teacher = "";

            // 首先移除右括号之前的所有内容（包括学历和课程类别部分）
            const cleanedCourseText = courseText.replace(/^.*?\)/, "");

            // 提取课程类别、课程名称、老师和教室号
            const courseMatch = cleanedCourseText.match(
              /([^\/]+)\/([^\/]+)\/[^-]*-[^-]*-([^(]+)/
            );
            if (courseMatch) {
              const courseName = courseMatch[1].trim(); // 课程名称
              teacher = courseMatch[2].trim(); // 老师
              classRoom = courseMatch[3].trim(); // 教室号
              finalCourseName = `${courseName}`;
              // 由于我们移除了括号部分，无法从清理后的文本中获取课程类别
              // 可以考虑从原始文本中提取
              const categoryMatch = courseText.match(/\(([^)]+)\)/);
              if (categoryMatch) {
                courseCategory = categoryMatch[1].trim();
              }
            } else {
              // 如果无法匹配预期格式，尝试简单清理
              finalCourseName = cleanedCourseText.replace(/^\s*\/|\/\s*$/g, "").trim();
            }

            // 已移除防止重复的逻辑，以允许同一时间段有多个课程
            schedule.push({
              courseName: finalCourseName,
              classRoom: classRoom,
              courseCategory: courseCategory, // 课程类别
              teacher: teacher, // 老师
              dayOfWeek: dayOfWeek,
              startTime: startTimeInfo.start,
              endTime: endTimeInfo.end,
              startWeek: startWeek, // 传递开始周
              endWeek: endWeek, // 传递结束周
            });
          }
        }
      }

      if (schedule.length === 0) {
        const msg = "表格为空或无法解析课程内容";
        if (win) win.webContents.send("show-info-message", msg);
        return { success: false };
      }

      return { success: true, schedule };
    } catch (error) {
      console.error("解析课程文件失败:", error);
      const msg = `解析失败: ${error.message}`;
      if (win) win.webContents.send("show-info-message", msg);
      return { success: false };
    }
  });

  // ================= 自然语言处理 ==================
  /**
   * 处理自然语言文本，解析日期和事件。
   */
  ipcMain.handle("process-natural-language", async (event, text) => {
    const win = BrowserWindow.getAllWindows()[0];
    try {
      // 修改：使用 chrono.zh.parse 来支持中文日期解析
      const results = chrono.zh.parse(text);

      if (results.length === 0) {
        const msg = "无法识别出有效的日期和时间。";
        if (win) win.webContents.send("show-info-message", msg);
        return { success: false, message: msg };
      }

      // 使用第一个解析结果
      const result = results[0];

      // 提取标题：从原始文本中移除日期部分
      const title = text
        .replace(result.text, "")
        .trim()
        .replace(/[:：]$/, "")
        .trim();

      if (!title) {
        const msg = "无法识别出事件标题。";
        if (win) win.webContents.send("show-info-message", msg);
        return { success: false, message: msg };
      }

      const eventData = {
        title: title,
        start: result.start.date(),
        // 如果 chrono-node 提供了结束日期，则使用它，否则默认为开始时间后一小时
        end: result.end
          ? result.end.date()
          : new Date(result.start.date().getTime() + 60 * 60 * 1000),
      };

      return { success: true, event: eventData };
    } catch (error) {
      console.error("NLP processing failed:", error);
      const msg = "处理文本时发生内部错误。";
      if (win) win.webContents.send("show-info-message", msg);
      return { success: false, message: msg };
    }
  });


  // ================= 日志处理 IPC ==================
  /**
   * 处理渲染进程日志。
   */
  ipcMain.handle("send-log", async (event, logData) => {
    try {
      const { level, message, meta } = logData;

      // 添加渲染进程标识
      const rendererMeta = {
        ...meta,
        source: "renderer",
        processType: "renderer",
      };

      // 根据日志级别调用相应的日志方法
      switch (level.toLowerCase()) {
        case "debug":
          logger.debug(message, rendererMeta);
          break;
        case "info":
          logger.info(message, rendererMeta);
          break;
        case "warn":
          logger.warn(message, rendererMeta);
          break;
        case "error":
          logger.error(message, rendererMeta);
          break;
        default:
          logger.info(message, rendererMeta);
      }
    } catch (error) {
      logger.error("Failed to process renderer log", error);
    }
  });

  logger.info("All IPC handlers initialized successfully");
}
