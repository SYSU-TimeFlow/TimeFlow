import { setActivePinia, createPinia } from "pinia";
import { useEventStore, Event, EventType } from "../../src/stores/event";
import { describe, it, expect, beforeEach, vi } from "vitest";

// 模拟 electron-store 的行为
vi.mock("electron-store", () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
  };
  return {
    default: vi.fn(() => mockStore),
  };
});

// beforeEach 确保每个测试用例开始时，events 数组存储的内容相同
beforeEach(() => {
  global.document = {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      }
    }
  } as any;
  global.window = {
    electronAPI: {
      // 模拟加载应用数据的方法，返回预设的分类和事件数据
      loadAppData: vi.fn(async () => ({
        categories: [
          { id: 1, name: "Work", color: "#e63946", active: true },
          { id: 2, name: "Personal", color: "#f8961e", active: true },
        ],
        events: [
          {
            id: 1,
            title: "Test Event",
            start: new Date("2025-05-18T10:00:00.000Z"),
            end: new Date("2025-05-18T11:00:00.000Z"),
            description: "Description",
            categoryId: 1,
            categoryColor: "#e63946",
            allDay: false,
            eventType: "calendar",
            completed: false,
          },
        ],
      })),
      // 模拟保存应用数据的方法
      saveAppData: vi.fn(async () => {}),
    },
  } as any;

  setActivePinia(createPinia());
});

describe("eventStore", () => {
  let eventStore: ReturnType<typeof useEventStore>;

  describe("Event", () => {
    beforeEach(async () => {
      eventStore = useEventStore();
      await eventStore.loadAppDataFromStore(); // 确保每次测试前加载数据
    });

    it("should add a new event and save to local storage", async () => {
      const newEvent = new Event(
        1,
        "Test Event",
        new Date("2025-05-18T10:00:00.000Z"),
        new Date("2025-05-18T11:00:00.000Z"),
        "Description",
        1,
        "#e63946",
        false,
        EventType.CALENDAR,
        false
      );

      await eventStore.addEvent(
        newEvent.title,
        newEvent.start,
        newEvent.end,
        newEvent.eventType
      );

      expect(eventStore.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: newEvent.title,
            start: newEvent.start,
            end: newEvent.end,
            eventType: newEvent.eventType,
          }),
        ])
      );

      // @ts-ignore 验证是否调用了保存到本地存储的方法
      expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              title: newEvent.title,
              start: newEvent.start.toISOString(),
              end: newEvent.end.toISOString(),
              eventType: newEvent.eventType,
            }),
          ]),
        })
      );
    });

    it("should delete an event and update local storage", async () => {
      const eventToDelete = eventStore.events[0];
      await eventStore.deleteEvent(eventToDelete.id);

      expect(eventStore.events).not.toContainEqual(eventToDelete);

      // @ts-ignore 验证本地存储是否正确更新
      expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.not.arrayContaining([eventToDelete]),
        })
      );
    });

    it("should update an event and save changes to local storage", async () => {
      const eventToUpdate = eventStore.events[0];
      eventToUpdate.title = "Updated Event";
      await eventStore.saveEvent();

      expect(eventStore.events).toContainEqual(
        expect.objectContaining({ title: "Updated Event" })
      );

      // @ts-ignore 验证本地存储是否正确保存更新
      expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ title: "Updated Event" }),
          ]),
        })
      );
    });

    it("should fetch events for a specific day", () => {
      const eventsForDay = eventStore.getEventsForDay(
        new Date("2025-05-18T00:00:00.000Z")
      );
      expect(eventsForDay).toHaveLength(1);
      console.log(EventType.CALENDAR);
      console.log(typeof EventType.CALENDAR);
      expect(eventsForDay[0]).toMatchObject({
        title: "Test Event",
        start: new Date("2025-05-18T10:00:00.000Z"),
        end: new Date("2025-05-18T11:00:00.000Z"),
        eventType: EventType.CALENDAR,
      });
    });
  });

  describe("saveCategory", () => {
    it("应该添加新分类", () => {
      const store = useEventStore();
      store.currentCategory = {
        id: 1,
        name: "新分类",
        color: "#ff0000",
        active: true,
      };
      store.isNewCategory = true;

      store.saveCategory();

      expect(store.categories).toHaveLength(1);
      expect(store.categories[0]).toEqual(store.currentCategory);
      expect(store.showCategoryModal).toBe(false);
    });

    it("应该更新现有分类", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "旧名称", color: "#ff0000", active: true },
      ];
      store.currentCategory = {
        id: 1,
        name: "新名称",
        color: "#00ff00",
        active: false,
      };
      store.isNewCategory = false;

      store.saveCategory();

      expect(store.categories).toHaveLength(1);
      expect(store.categories[0]).toEqual(store.currentCategory);
      expect(store.showCategoryModal).toBe(false);
    });

    it("当表单无效时不应该保存", () => {
      const store = useEventStore();
      store.currentCategory = {
        id: 1,
        name: "", // 无效名称
        color: "#ff0000",
        active: true,
      };
      store.isNewCategory = true;

      store.saveCategory();

      expect(store.categories).toHaveLength(0);
      expect(store.showCategoryModal).toBe(true); // 模态框保持打开
    });

    it("更新分类时应该更新关联事件的分类颜色", async () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
      ];
      store.events = [
        new Event(1, "事件1", new Date(), new Date(), "", 1, "#ff0000"),
      ];
      store.currentCategory = {
        id: 1,
        name: "工作",
        color: "#0000ff", // 新颜色
        active: true,
      };
      store.isNewCategory = false;

      await store.saveCategory();

      expect(store.events[0].categoryColor).toBe("#0000ff");
    });
  });

  describe("deleteCategory", () => {
    it("应该删除分类并将关联事件重新分配到默认分类", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
        { id: 5, name: "其他", color: "#43aa8b", active: true },
      ];
      store.events = [
        new Event(1, "事件1", new Date(), new Date(), "", 1, "#ff0000"),
        new Event(2, "事件2", new Date(), new Date(), "", 5, "#43aa8b"),
      ];
      store.currentCategory = {
        id: 1,
        name: "工作",
        color: "#ff0000",
        active: true,
      };
      store.isNewCategory = false;

      store.deleteCategory();

      expect(store.categories).toHaveLength(1);
      expect(store.categories[0].id).toBe(5);
      expect(store.events[0].categoryId).toBe(5);
      expect(store.events[0].categoryColor).toBe("#43aa8b");
      expect(store.events[1].categoryId).toBe(5); // 保持不变
      expect(store.showCategoryModal).toBe(false);
    });

    it("当只有一个分类时不应该删除", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
      ];
      store.currentCategory = {
        id: 1,
        name: "工作",
        color: "#ff0000",
        active: true,
      };
      store.isNewCategory = false;

      const originalConsoleWarn = console.warn;
      console.warn = vi.fn();

      store.deleteCategory();

      expect(store.categories).toHaveLength(1);
      expect(console.warn).toHaveBeenCalledWith(
        "Cannot delete the last category."
      );

      console.warn = originalConsoleWarn;
    });

    it("当删除分类时应该选择非当前分类作为默认分类", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
        { id: 2, name: "学习", color: "#00ff00", active: true },
      ];
      store.events = [
        new Event(1, "事件1", new Date(), new Date(), "", 1, "#ff0000"),
      ];
      store.currentCategory = {
        id: 1,
        name: "工作",
        color: "#ff0000",
        active: true,
      };
      store.isNewCategory = false;

      store.deleteCategory();

      expect(store.categories).toHaveLength(1);
      expect(store.categories[0].id).toBe(2);
      expect(store.events[0].categoryId).toBe(2);
      expect(store.events[0].categoryColor).toBe("#00ff00");
    });
  });

  describe("toggleCategory", () => {
    it("应该切换指定分类的active状态", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
        { id: 2, name: "学习", color: "#00ff00", active: false },
      ];

      // 切换第一个分类
      store.toggleCategory(1);
      expect(store.categories[0].active).toBe(false);

      // 切换第二个分类
      store.toggleCategory(2);
      expect(store.categories[1].active).toBe(true);
    });
  });

  describe("getEventsForDay", () => {
    it("应该只返回active分类的事件", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
        { id: 2, name: "学习", color: "#00ff00", active: false },
      ];

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      store.events = [
        new Event(
          1,
          "工作事件",
          today,
          today,
          "",
          1,
          "#ff0000",
          false,
          EventType.CALENDAR
        ),
        new Event(
          2,
          "学习事件",
          today,
          today,
          "",
          2,
          "#00ff00",
          false,
          EventType.CALENDAR
        ),
      ];

      const events = store.getEventsForDay(today);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("工作事件");
    });

    it("应该正确处理BOTH类型的事件", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
      ];

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // 1970年占位符日期表示没有开始时间
      const placeholderDate = new Date(0);

      store.events = [
        new Event(
          1,
          "日历事件",
          today,
          today,
          "",
          1,
          "#ff0000",
          false,
          EventType.CALENDAR
        ),
        new Event(
          2,
          "待办事项",
          placeholderDate,
          today,
          "",
          1,
          "#ff0000",
          false,
          EventType.BOTH
        ),
        new Event(
          3,
          "纯待办",
          placeholderDate,
          tomorrow,
          "",
          1,
          "#ff0000",
          false,
          EventType.TODO
        ),
      ];

      // 获取今天的事件
      const events = store.getEventsForDay(today);
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe("待办事项"); // BOTH类型，按截止日期排序应该在前面
      expect(events[1].title).toBe("日历事件");
    });
  });

  describe("filteredTodos 分类过滤", () => {
    it("应该只返回active分类的待办事项", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
        { id: 2, name: "学习", color: "#00ff00", active: false },
      ];

      const today = new Date();
      const placeholderDate = new Date(0);

      store.events = [
        new Event(
          1,
          "工作待办",
          placeholderDate,
          today,
          "",
          1,
          "#ff0000",
          false,
          EventType.TODO
        ),
        new Event(
          2,
          "学习待办",
          placeholderDate,
          today,
          "",
          2,
          "#00ff00",
          false,
          EventType.TODO
        ),
      ];

      const todos = store.filteredTodos;
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe("工作待办");
    });

    it("应该包含BOTH类型的待办事项", () => {
      const store = useEventStore();
      store.categories = [
        { id: 1, name: "工作", color: "#ff0000", active: true },
      ];

      const today = new Date();
      const placeholderDate = new Date(0);

      store.events = [
        new Event(
          1,
          "纯待办",
          placeholderDate,
          today,
          "",
          1,
          "#ff0000",
          false,
          EventType.TODO
        ),
        new Event(
          2,
          "BOTH待办",
          placeholderDate,
          today,
          "",
          1,
          "#ff0000",
          false,
          EventType.BOTH
        ),
        new Event(
          3,
          "日历事件",
          today,
          today,
          "",
          1,
          "#ff0000",
          false,
          EventType.CALENDAR
        ),
      ];

      const todos = store.filteredTodos;
      expect(todos).toHaveLength(2);
      expect(todos[0].title).toBe("纯待办");
      expect(todos[1].title).toBe("BOTH待办");
    });
  });

  describe("Local Storage", () => {
    it("should load events and categories from local storage", async () => {
      await eventStore.loadAppDataFromStore();

      expect(eventStore.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Work" }),
          expect.objectContaining({ name: "Personal" }),
        ])
      );

      expect(eventStore.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: "Test Event" }),
        ])
      );
    });

    it("should save events and categories to local storage", async () => {
      const newCategory = {
        id: 3,
        name: "Health",
        color: "#2a9d8f",
        active: true,
      };
      eventStore.categories.push(newCategory);

      const newEvent = {
        title: "Health Event",
        start: new Date("2025-05-20T10:00:00.000Z"),
        end: new Date("2025-05-20T11:00:00.000Z"),
        eventType: EventType.CALENDAR,
      };
      await eventStore.addEvent(
        newEvent.title,
        newEvent.start,
        newEvent.end,
        newEvent.eventType
      );

      // @ts-ignore 验证本地存储是否正确保存
      expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.arrayContaining([
            expect.objectContaining({ name: "Health" }),
          ]),
          events: expect.arrayContaining([
            expect.objectContaining({
              title: "Health Event",
              start: newEvent.start.toISOString(),
              end: newEvent.end.toISOString(),
            }),
          ]),
        })
      );
    });
  });
});
