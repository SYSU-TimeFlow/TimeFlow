/**
 * @description IPC 处理器模块的单元测试
 * 本文件包含对 IPC 处理器各种功能的测试用例，包括应用数据加载/保存、
 * 设置管理、窗口操作和系统通知等功能。
 * 
 * 测试使用 vitest 测试框架，并模拟了 electron 相关模块的行为。
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { initializeIpcHandlers } from "../../src/main/ipcHandlers.js";

// Mock dependencies
const mockIpcMain = {
  handle: vi.fn(),
  on: vi.fn(),
};

const mockSqliteStore = {
  getCategories: vi.fn(),
  getEvents: vi.fn(),
  setCategories: vi.fn(),
  setEvents: vi.fn(),
  getSettings: vi.fn(),
  setSettings: vi.fn(),
};

const mockBrowserWindow = {
  getFocusedWindow: vi.fn(),
  getAllWindows: vi.fn(),
};

const mockWindow = {
  minimize: vi.fn(),
  maximize: vi.fn(),
  unmaximize: vi.fn(),
  isMaximized: vi.fn(),
  close: vi.fn(),
  show: vi.fn(),
};

const mockNotification = {
  show: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
};

vi.mock("electron", () => ({
  Notification: vi.fn(() => mockNotification),
}));

describe("IPC Handlers", () => {
  const mainDirname = "/test/app";
  let handlers: { [key: string]: Function } = {};
  let eventHandlers: { [key: string]: Function } = {};

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = {};
    eventHandlers = {};

    // Mock ipcMain.handle to capture handlers
    mockIpcMain.handle.mockImplementation((event: string, handler: Function) => {
      handlers[event] = handler;
    });

    // Mock ipcMain.on to capture event handlers
    mockIpcMain.on.mockImplementation((event: string, handler: Function) => {
      eventHandlers[event] = handler;
    });

    mockBrowserWindow.getFocusedWindow.mockReturnValue(mockWindow);
    mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);

    initializeIpcHandlers(mockIpcMain, mockSqliteStore, mainDirname, mockBrowserWindow);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("App Data Management", () => {
    describe("load-app-data handler", () => {
      it("should load existing categories and events from store", async () => {
        const mockCategories = [
          { id: 1, name: "Work", color: "#e63946", active: true },
          { id: 2, name: "Personal", color: "#f8961e", active: true },
        ];
        const mockEvents = [
          {
            id: 1,
            title: "Test Event",
            start: "2025-05-18T10:00:00.000Z",
            end: "2025-05-18T11:00:00.000Z",
            eventType: "calendar",
          },
        ];

        mockSqliteStore.getCategories.mockReturnValue(mockCategories);
        mockSqliteStore.getEvents.mockReturnValue(mockEvents);

        const result = await handlers["load-app-data"]();

        expect(mockSqliteStore.getCategories).toHaveBeenCalled();
        expect(mockSqliteStore.getEvents).toHaveBeenCalled();
        expect(result).toEqual({
          categories: mockCategories,
          events: mockEvents,
        });
      });

      it("should load default categories when none exist", async () => {
        mockSqliteStore.getCategories.mockReturnValue([]);
        mockSqliteStore.getEvents.mockReturnValue([]);

        const result = await handlers["load-app-data"]();

        expect(mockSqliteStore.setCategories).toHaveBeenCalledWith([
          { id: 1, name: "Work", color: "#e63946", active: true },
          { id: 2, name: "Personal", color: "#f8961e", active: true },
          { id: 3, name: "Family", color: "#fcbf49", active: true },
          { id: 4, name: "Health", color: "#2a9d8f", active: true },
          { id: 5, name: "Other", color: "#43aa8b", active: true },
        ]);
        expect(mockSqliteStore.setEvents).toHaveBeenCalledWith([]);
        expect(result.categories).toHaveLength(5);
      });

      it("should load default events when none exist", async () => {
        mockSqliteStore.getCategories.mockReturnValue([
          { id: 1, name: "Work", color: "#e63946", active: true },
        ]);
        mockSqliteStore.getEvents.mockReturnValue(null);

        const result = await handlers["load-app-data"]();

        expect(mockSqliteStore.setEvents).toHaveBeenCalledWith([]);
        expect(result.events).toEqual([]);
      });

      it("should process event dates to ISO string format", async () => {
        const mockEvents = [
          {
            id: 1,
            title: "Test Event",
            start: new Date("2025-05-18T10:00:00.000Z"),
            end: new Date("2025-05-18T11:00:00.000Z"),
          },
        ];

        mockSqliteStore.getCategories.mockReturnValue([]);
        mockSqliteStore.getEvents.mockReturnValue(mockEvents);

        const result = await handlers["load-app-data"]();

        expect(result.events[0].start).toBe("2025-05-18T10:00:00.000Z");
        expect(result.events[0].end).toBe("2025-05-18T11:00:00.000Z");
      });
    });

    describe("save-app-data handler", () => {
      it("should save categories and events to store", async () => {
        const testData = {
          categories: [
            { id: 1, name: "Work", color: "#e63946", active: true },
          ],
          events: [
            {
              id: 1,
              title: "Test Event",
              start: "2025-05-18T10:00:00.000Z",
              end: "2025-05-18T11:00:00.000Z",
            },
          ],
        };

        await handlers["save-app-data"](null, testData);

        expect(mockSqliteStore.setCategories).toHaveBeenCalledWith(testData.categories);
        expect(mockSqliteStore.setEvents).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              title: "Test Event",
              start: "2025-05-18T10:00:00.000Z",
              end: "2025-05-18T11:00:00.000Z",
            }),
          ])
        );
      });

      it("should handle missing categories or events", async () => {
        const testDataOnlyCategories = {
          categories: [{ id: 1, name: "Work", color: "#e63946", active: true }],
        };

        await handlers["save-app-data"](null, testDataOnlyCategories);

        expect(mockSqliteStore.setCategories).toHaveBeenCalled();
        expect(mockSqliteStore.setEvents).not.toHaveBeenCalled();

        const testDataOnlyEvents = {
          events: [
            {
              id: 1,
              title: "Test Event",
              start: "2025-05-18T10:00:00.000Z",
              end: "2025-05-18T11:00:00.000Z",
            },
          ],
        };

        await handlers["save-app-data"](null, testDataOnlyEvents);

        expect(mockSqliteStore.setEvents).toHaveBeenCalled();
      });

      it("should serialize event dates to ISO strings", async () => {
        const testData = {
          events: [
            {
              id: 1,
              title: "Test Event",
              start: new Date("2025-05-18T10:00:00.000Z"),
              end: new Date("2025-05-18T11:00:00.000Z"),
            },
          ],
        };

        await handlers["save-app-data"](null, testData);

        expect(mockSqliteStore.setEvents).toHaveBeenCalledWith([
          expect.objectContaining({
            start: "2025-05-18T10:00:00.000Z",
            end: "2025-05-18T11:00:00.000Z",
          }),
        ]);
      });
    });
  });

  describe("Settings Management", () => {
    describe("load-settings handler", () => {
      it("should load existing settings from store", async () => {
        const mockSettings = {
          themeMode: "dark",
          fontSize: "large",
          notifications: false,
        };

        mockSqliteStore.getSettings.mockReturnValue(mockSettings);

        const result = await handlers["load-settings"]();

        expect(mockSqliteStore.getSettings).toHaveBeenCalled();
        expect(result).toEqual(mockSettings);
      });

      it("should load default settings when none exist", async () => {
        mockSqliteStore.getSettings.mockReturnValue({});

        const result = await handlers["load-settings"]();

        expect(mockSqliteStore.setSettings).toHaveBeenCalledWith({
          themeMode: "light",
          fontSize: "medium",
          iconStyle: "default",
          notifications: true,
          hour24: false,
          showLunar: false,
          weekStart: "0",
          language: "zh-CN",
        });
        expect(result.themeMode).toBe("light");
        expect(result.language).toBe("zh-CN");
      });

      it("should load default settings when store returns null", async () => {
        mockSqliteStore.getSettings.mockReturnValue(null);

        const result = await handlers["load-settings"]();

        expect(mockSqliteStore.setSettings).toHaveBeenCalled();
        expect(result).toMatchObject({
          themeMode: "light",
          fontSize: "medium",
          notifications: true,
        });
      });
    });

    describe("save-settings handler", () => {
      it("should save settings to store successfully", async () => {
        const testSettings = {
          themeMode: "dark",
          fontSize: "large",
          notifications: false,
        };

        const result = await handlers["save-settings"](null, testSettings);

        expect(mockSqliteStore.setSettings).toHaveBeenCalledWith(testSettings);
        expect(result).toEqual({ success: true });
      });

      it("should handle save errors", async () => {
        const testSettings = { themeMode: "dark" };
        const error = new Error("Save failed");
        mockSqliteStore.setSettings.mockImplementation(() => {
          throw error;
        });

        const result = await handlers["save-settings"](null, testSettings);

        expect(result).toEqual({
          success: false,
          error: "Save failed",
        });
      });
    });
  });

  describe("Window Operations", () => {
    it("should minimize focused window", () => {
      eventHandlers["window-minimize"]();

      expect(mockBrowserWindow.getFocusedWindow).toHaveBeenCalled();
      expect(mockWindow.minimize).toHaveBeenCalled();
    });

    it("should handle minimize when no focused window", () => {
      mockBrowserWindow.getFocusedWindow.mockReturnValue(null);

      eventHandlers["window-minimize"]();

      expect(mockBrowserWindow.getFocusedWindow).toHaveBeenCalled();
      expect(mockWindow.minimize).not.toHaveBeenCalled();
    });

    it("should maximize unmaximized window", () => {
      mockWindow.isMaximized.mockReturnValue(false);

      eventHandlers["window-maximize"]();

      expect(mockWindow.isMaximized).toHaveBeenCalled();
      expect(mockWindow.maximize).toHaveBeenCalled();
      expect(mockWindow.unmaximize).not.toHaveBeenCalled();
    });

    it("should unmaximize maximized window", () => {
      mockWindow.isMaximized.mockReturnValue(true);

      eventHandlers["window-maximize"]();

      expect(mockWindow.isMaximized).toHaveBeenCalled();
      expect(mockWindow.unmaximize).toHaveBeenCalled();
      expect(mockWindow.maximize).not.toHaveBeenCalled();
    });

    it("should close focused window", () => {
      eventHandlers["window-close"]();

      expect(mockBrowserWindow.getFocusedWindow).toHaveBeenCalled();
      expect(mockWindow.close).toHaveBeenCalled();
    });
  });

  describe("System Notifications", () => {
    it("should create and show notification", async () => {
      const notificationData = {
        title: "Test Notification",
        body: "This is a test notification",
      };

      await handlers["notify"](null, notificationData);

      expect(mockNotification.show).toHaveBeenCalled();
    });

    it("should show window when notification is clicked", async () => {
      const notificationData = {
        title: "Test Notification",
        body: "Test body",
      };

      await handlers["notify"](null, notificationData);

      // Simulate notification click
      const clickHandler = mockNotification.on.mock.calls.find(
        (call) => call[0] === "click"
      )?.[1];

      if (clickHandler) {
        clickHandler();
        expect(mockBrowserWindow.getAllWindows).toHaveBeenCalled();
        expect(mockWindow.show).toHaveBeenCalled();
      }
    });

    it("should auto-close notification after 5 seconds", async () => {
      vi.useFakeTimers();

      const notificationData = {
        title: "Test Notification",
        body: "Test body",
      };

      await handlers["notify"](null, notificationData);

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      expect(mockNotification.close).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("Handler Registration", () => {
    it("should register all required IPC handlers", () => {
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        "load-app-data",
        expect.any(Function)
      );
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        "save-app-data",
        expect.any(Function)
      );
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        "load-settings",
        expect.any(Function)
      );
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        "save-settings",
        expect.any(Function)
      );
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        "notify",
        expect.any(Function)
      );
    });

    it("should register all window event handlers", () => {
      expect(mockIpcMain.on).toHaveBeenCalledWith(
        "window-minimize",
        expect.any(Function)
      );
      expect(mockIpcMain.on).toHaveBeenCalledWith(
        "window-maximize",
        expect.any(Function)
      );
      expect(mockIpcMain.on).toHaveBeenCalledWith(
        "window-close",
        expect.any(Function)
      );
    });
  });
});
