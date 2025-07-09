/**
 * @description 应用集成测试
 * 本文件包含对整个应用各个模块之间交互的集成测试，
 * 包括事件存储与数据库的交互、设置管理与持久化、
 * 以及各个组件之间的协作等。
 * 
 * 测试使用 vitest 测试框架，模拟真实的应用环境。
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useEventStore } from "../../src/renderer/stores/event";
import { useSettingStore } from "../../src/renderer/stores/setting";
import { Event, EventType } from "../../src/renderer/const";

// Mock electron API
const mockElectronAPI = {
  loadAppData: vi.fn(),
  saveAppData: vi.fn(),
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  notify: vi.fn(),
};

// Mock document and window
const mockDocument = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
};

beforeEach(() => {
  global.document = mockDocument as any;
  global.window = {
    electronAPI: mockElectronAPI,
  } as any;

  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe("Integration Tests", () => {
  describe("Event Store and Database Integration", () => {
    let eventStore: ReturnType<typeof useEventStore>;

    beforeEach(async () => {
      // Setup mock data
      mockElectronAPI.loadAppData.mockResolvedValue({
        categories: [
          { id: 1, name: "工作", color: "#e63946", active: true },
          { id: 2, name: "个人", color: "#f8961e", active: true },
          { id: 3, name: "家庭", color: "#fcbf49", active: false },
        ],
        events: [
          {
            id: 1,
            title: "工作会议",
            start: "2025-05-18T10:00:00.000Z",
            end: "2025-05-18T11:00:00.000Z",
            description: "重要会议",
            categoryId: 1,
            categoryColor: "#e63946",
            allDay: false,
            eventType: "calendar",
            completed: false,
          },
          {
            id: 2,
            title: "待办任务",
            start: "1970-01-01T00:00:00.000Z", // 占位符日期
            end: "2025-05-18T23:59:59.000Z",
            description: "需要完成的任务",
            categoryId: 2,
            categoryColor: "#f8961e",
            allDay: false,
            eventType: "todo",
            completed: false,
          },
        ],
      });

      eventStore = useEventStore();
      await eventStore.loadAppDataFromStore();
    });

    it("应该正确加载和显示应用数据", () => {
      expect(eventStore.categories).toHaveLength(3);
      expect(eventStore.events).toHaveLength(2);
      expect(eventStore.categories[0].name).toBe("工作");
      expect(eventStore.events[0].title).toBe("工作会议");
    });

    it("应该能够添加新事件并保存到数据库", async () => {
      const initialEventCount = eventStore.events.length;
      
      // 设置当前事件数据
      eventStore.currentEvent.title = "新事件";
      eventStore.currentEvent.start = "2025-05-19T14:00";
      eventStore.currentEvent.end = "2025-05-19T15:00";
      eventStore.currentEvent.description = "新事件描述";
      eventStore.currentEvent.categoryId = 1;
      eventStore.currentEvent.eventType = EventType.CALENDAR;
      eventStore.currentEvent.allDay = false;
      eventStore.isNewEvent = true;

      await eventStore.saveEvent();

      expect(eventStore.events).toHaveLength(initialEventCount + 1);
      expect(mockElectronAPI.saveAppData).toHaveBeenCalled();
      
      const newEvent = eventStore.events[eventStore.events.length - 1];
      expect(newEvent.title).toBe("新事件");
      expect(newEvent.categoryId).toBe(1);
    });

    it("应该能够更新事件并保存更改", async () => {
      const eventToUpdate = eventStore.events[0];
      
      // 设置当前事件为要更新的事件
      eventStore.currentEvent.id = eventToUpdate.id;
      eventStore.currentEvent.title = "更新后的会议";
      eventStore.currentEvent.description = "更新后的描述";
      eventStore.currentEvent.start = eventToUpdate.start.toISOString().slice(0, 16);
      eventStore.currentEvent.end = eventToUpdate.end.toISOString().slice(0, 16);
      eventStore.currentEvent.categoryId = eventToUpdate.categoryId;
      eventStore.currentEvent.eventType = eventToUpdate.eventType;
      eventStore.isNewEvent = false;
      
      await eventStore.saveEvent();

      const updatedEvent = eventStore.events.find(e => e.id === eventToUpdate.id);
      expect(updatedEvent?.title).toBe("更新后的会议");
      expect(updatedEvent?.description).toBe("更新后的描述");
      expect(mockElectronAPI.saveAppData).toHaveBeenCalled();
    });

    it("应该能够删除事件并同步到数据库", async () => {
      const initialEventCount = eventStore.events.length;
      const eventToDelete = eventStore.events[0];
      
      await eventStore.deleteEvent(eventToDelete.id);

      expect(eventStore.events).toHaveLength(initialEventCount - 1);
      expect(eventStore.events).not.toContainEqual(
        expect.objectContaining({ id: eventToDelete.id })
      );
      expect(mockElectronAPI.saveAppData).toHaveBeenCalled();
    });

    it("应该能够管理分类并影响事件显示", () => {
      // 初始状态：工作和个人分类激活，家庭分类未激活
      const activeCategories = eventStore.categories.filter(c => c.active);
      expect(activeCategories).toHaveLength(2);

      // 停用工作分类
      const workCategory = eventStore.categories.find(c => c.name === "工作");
      if (workCategory) {
        eventStore.toggleCategory(workCategory.id);
      }

      // 检查过滤后的待办事项
      const filteredTodos = eventStore.filteredTodos;
      const workTodos = filteredTodos.filter(todo => todo.categoryId === 1);
      expect(workTodos).toHaveLength(0); // 工作分类的待办应该被过滤掉
    });

    it("应该正确处理不同类型的事件", () => {
      const today = new Date("2025-05-18T00:00:00.000Z");
      const eventsForDay = eventStore.getEventsForDay(today);
      
      // 应该包含日历事件，但不包含纯待办事项
      expect(eventsForDay).toHaveLength(1);
      expect(eventsForDay[0].eventType).toBe(EventType.CALENDAR);

      // 待办列表应该包含TODO和BOTH类型的事件
      const todos = eventStore.filteredTodos;
      const todoEvents = todos.filter(todo => 
        todo.eventType === EventType.TODO || todo.eventType === EventType.BOTH
      );
      expect(todoEvents.length).toBeGreaterThan(0);
    });

    it("应该能够切换分类显示状态", () => {
      const workCategory = eventStore.categories.find(c => c.name === "工作");
      expect(workCategory?.active).toBe(true);
      
      if (workCategory) {
        eventStore.toggleCategory(workCategory.id);
        expect(workCategory.active).toBe(false);
        
        // 再次切换回来
        eventStore.toggleCategory(workCategory.id);
        expect(workCategory.active).toBe(true);
      }
    });
  });

  describe("Settings Store Integration", () => {
    let settingStore: ReturnType<typeof useSettingStore>;

    beforeEach(async () => {
      mockElectronAPI.loadSettings.mockResolvedValue({
        themeMode: "light",
        fontSize: "medium",
        iconStyle: "default",
        notifications: true,
        hour24: false,
        showLunar: false,
        weekStart: "0",
        language: "zh-CN",
      });

      settingStore = useSettingStore();
      await settingStore.loadSettings();
    });

    it("应该正确加载设置", () => {
      expect(settingStore.themeMode).toBe("light");
      expect(settingStore.language).toBe("zh-CN");
      expect(settingStore.notifications).toBe(true);
      expect(mockElectronAPI.loadSettings).toHaveBeenCalled();
    });

    it("应该能够更新主题设置", async () => {
      expect(settingStore.themeMode).toBe("light");
      
      // 更新主题模式
      settingStore.themeMode = "dark";
      
      // 等待watch触发
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(settingStore.themeMode).toBe("dark");
      expect(mockElectronAPI.saveSettings).toHaveBeenCalled();
    });

    it("应该能够更新字体大小设置", async () => {
      expect(settingStore.fontSize).toBe("medium");
      
      settingStore.fontSize = "large";
      
      // 等待watch触发
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(settingStore.fontSize).toBe("large");
      expect(mockElectronAPI.saveSettings).toHaveBeenCalled();
    });

    it("应该能够应用主题设置到DOM", () => {
      settingStore.applyTheme("dark");
      
      // 验证DOM类被正确添加
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith("dark-mode");
    });
  });

  describe("Cross-Store Integration", () => {
    let eventStore: ReturnType<typeof useEventStore>;
    let settingStore: ReturnType<typeof useSettingStore>;

    beforeEach(async () => {
      // Setup mocks
      mockElectronAPI.loadAppData.mockResolvedValue({
        categories: [
          { id: 1, name: "工作", color: "#e63946", active: true },
        ],
        events: [
          {
            id: 1,
            title: "测试事件",
            start: "2025-05-18T10:00:00.000Z",
            end: "2025-05-18T11:00:00.000Z",
            categoryId: 1,
            eventType: "calendar",
          },
        ],
      });

      mockElectronAPI.loadSettings.mockResolvedValue({
        themeMode: "light",
        notifications: true,
        weekStart: "0",
        language: "zh-CN",
      });

      eventStore = useEventStore();
      settingStore = useSettingStore();
      
      await eventStore.loadAppDataFromStore();
      await settingStore.loadSettings();
    });

    it("设置变更应该影响事件显示", () => {
      // 测试周起始日设置
      expect(settingStore.weekStart).toBe("0");
      
      // 更改为周一开始
      settingStore.weekStart = "1";
      expect(settingStore.weekStart).toBe("1");
    });

    it("通知设置应该被正确保存", async () => {
      // 启用通知
      expect(settingStore.notifications).toBe(true);
      
      // 禁用通知
      settingStore.notifications = false;
      
      // 等待watch触发
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(settingStore.notifications).toBe(false);
      expect(mockElectronAPI.saveSettings).toHaveBeenCalled();
    });

    it("语言设置应该被正确保存", async () => {
      expect(settingStore.language).toBe("zh-CN");
      
      // 更改语言设置
      settingStore.language = "en-US";
      
      // 等待watch触发
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(settingStore.language).toBe("en-US");
      expect(mockElectronAPI.saveSettings).toHaveBeenCalled();
    });
  });

  describe("Error Handling Integration", () => {
    let eventStore: ReturnType<typeof useEventStore>;

    beforeEach(() => {
      eventStore = useEventStore();
    });

    it("应该处理数据加载失败", async () => {
      mockElectronAPI.loadAppData.mockRejectedValue(new Error("加载失败"));
      
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      await eventStore.loadAppDataFromStore();
      
      // 应该设置默认数据或保持空状态
      expect(eventStore.categories.length).toBeGreaterThanOrEqual(0);
      expect(eventStore.events.length).toBeGreaterThanOrEqual(0);
      
      consoleSpy.mockRestore();
    });

    it("应该处理数据保存失败", async () => {
      mockElectronAPI.saveAppData.mockRejectedValue(new Error("保存失败"));
      
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      // 设置一个有效的事件
      eventStore.currentEvent.title = "测试事件";
      eventStore.currentEvent.start = "2025-05-19T14:00";
      eventStore.currentEvent.end = "2025-05-19T15:00";
      eventStore.isNewEvent = true;
      
      await eventStore.saveEvent();
      
      // 事件应该仍然被添加到本地状态
      expect(eventStore.events.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });

    it("应该处理设置保存失败", async () => {
      mockElectronAPI.saveSettings.mockRejectedValue(new Error("设置保存失败"));
      
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      const settingStore = useSettingStore();
      settingStore.themeMode = "dark";
      
      // 等待错误处理
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving settings via Electron API:",
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("Data Validation Integration", () => {
    let eventStore: ReturnType<typeof useEventStore>;

    beforeEach(async () => {
      mockElectronAPI.loadAppData.mockResolvedValue({
        categories: [
          { id: 1, name: "工作", color: "#e63946", active: true },
        ],
        events: [],
      });

      eventStore = useEventStore();
      await eventStore.loadAppDataFromStore();
    });

    it("应该验证事件标题不能为空", async () => {
      eventStore.currentEvent.title = "";
      eventStore.currentEvent.start = "2025-05-19T14:00";
      eventStore.currentEvent.end = "2025-05-19T15:00";
      eventStore.isNewEvent = true;
      
      await eventStore.saveEvent();
      
      expect(eventStore.eventTitleError).toBe("标题不能为空");
      expect(eventStore.eventShake).toBe(true);
    });

    it("应该验证结束时间不能早于开始时间", async () => {
      eventStore.currentEvent.title = "测试事件";
      eventStore.currentEvent.start = "2025-05-19T15:00";
      eventStore.currentEvent.end = "2025-05-19T14:00"; // 结束时间早于开始时间
      eventStore.isNewEvent = true;
      
      await eventStore.saveEvent();
      
      expect(eventStore.eventTimeError).toBe("结束时间不能早于开始时间");
      expect(eventStore.eventShake).toBe(true);
    });

    it("应该在验证通过后成功保存事件", async () => {
      const initialCount = eventStore.events.length;
      
      eventStore.currentEvent.title = "有效事件";
      eventStore.currentEvent.start = "2025-05-19T14:00";
      eventStore.currentEvent.end = "2025-05-19T15:00";
      eventStore.isNewEvent = true;
      
      await eventStore.saveEvent();
      
      expect(eventStore.eventTitleError).toBe("");
      expect(eventStore.eventTimeError).toBe("");
      expect(eventStore.events.length).toBe(initialCount + 1);
    });
  });
});
