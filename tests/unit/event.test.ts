/**
 * @description TimeFlow 应用中 `eventStore` 的单元测试。
 * 本文件包含对 `eventStore` 各种功能的测试用例，包括事件删除、更新、按特定日期获取事件、
 * 按分类过滤事件，以及验证本地存储交互。
 *
 * 测试使用 `vitest` 测试框架，并模拟了 `electron-store` 和 `electronAPI` 的行为，
 * 以模拟应用数据的加载和保存。
 *
 * @warning 该测试的详细日志输出已被注释掉，若需要调试或查看详细执行过程，请取消注释相关日志行。
 *          具体操作：Ctrl+H，替换 `// console.log` 为 `console.log`。
 */
import { setActivePinia, createPinia } from "pinia";
import { useEventStore } from "../../src/stores/event";
import { Event, EventType } from "../../src/const";
import { describe, it, expect, beforeEach, vi } from "vitest";

// beforeEach 确保每个测试用例开始时，events 数组存储的内容相同
beforeEach(() => {
  global.document = {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
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
      saveAppData: vi.fn(async () => {
        // console.log("\x1b[34m%s\x1b[0m", "Mock saveAppData called");
      }),
      loadSettings: vi.fn(async () => {
        // console.log("\x1b[34m%s\x1b[0m", "Mock loadSetting called");

        return {
          themeMode: "light",
          fontSize: "medium",
          iconStyle: "default",
          notifications: true,
          hour24: false,
          showLunar: false,
          weekStart: "0",
          language: "zh-CN",
        };
      }),
      // 模拟保存设置的saveSettings方法
      saveSettings: vi.fn(async (setting: any) => {
        // console.log("\x1b[34m%s\x1b[0m", "Mock saveSetting called");
      }),
    },
  } as any;

  setActivePinia(createPinia());
});

describe("eventStore", () => {
  let eventStore: ReturnType<typeof useEventStore>;

  describe("Event", () => {
    beforeEach(async () => {
      eventStore = useEventStore();
      // console.log("Loading app data before each test...");
      await eventStore.loadAppDataFromStore(); // 确保每次测试前加载数据
      // console.log("App data loaded:", eventStore.events);
    });

    it("should delete event", async () => {
      // console.log("========== DELETE EVENT BEGIN ==========");
      const eventToDelete = eventStore.events[0];
      // console.log("Deleting event:", eventToDelete);
      await eventStore.deleteEvent(eventToDelete.id);

      // console.log("Updated events:", eventStore.events);
      expect(eventStore.events).not.toContainEqual(eventToDelete);

      // @ts-ignore
      expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.not.arrayContaining([eventToDelete]),
        })
      );
      // console.log("========== DELETE EVENT END ==========");
    });

    it("should update an event and save changes to local storage", async () => {
      // console.log("========== UPDATE EVENT BEGIN ==========");
      const eventToUpdate = eventStore.events[0];
      // console.log("Original event:", eventToUpdate);
      eventToUpdate.title = "Updated Event";

      // console.log("Updating event title to:", eventToUpdate.title);
      await eventStore.saveEvent();

      // console.log("Updated events:", eventStore.events);
      expect(eventStore.events).toContainEqual(
        expect.objectContaining({ title: "Updated Event" })
      );

      // @ts-ignore
      expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ title: "Updated Event" }),
          ]),
        })
      );
      // console.log("========== UPDATE EVENT END ==========");
    });

    it("should fetch events for a specific day", () => {
      // console.log("========== FETCH EVENTS FOR DAY BEGIN ==========");
      const targetDate = new Date("2025-05-18T00:00:00.000Z");
      // console.log("Fetching events for date:", targetDate);
      const eventsForDay = eventStore.getEventsForDay(targetDate);

      // console.log("Fetched events:", eventsForDay);
      expect(eventsForDay).toHaveLength(1);
      expect(eventsForDay[0]).toMatchObject({
        title: "Test Event",
        start: new Date("2025-05-18T10:00:00.000Z"),
        end: new Date("2025-05-18T11:00:00.000Z"),
        eventType: EventType.CALENDAR,
      });
      // console.log("========== FETCH EVENTS FOR DAY END ==========");
    });
  });
  describe("getEventsForDay", () => {
    it("应该只返回active分类的事件", () => {
      // console.log("\x1b[32m%s\x1b[0m", "========== FETCH ACTIVE EVENTS BEGIN ============");
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
          EventType.CALENDAR,
          false
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
          EventType.CALENDAR,
          false
        ),
      ];

      // console.log("\x1b[34m%s\x1b[0m", "Categories:", store.categories);
      // console.log("\x1b[34m%s\x1b[0m", "Events:", store.events);

      const events = store.getEventsForDay(today);
      // console.log("\x1b[34m%s\x1b[0m", "Filtered events for today:", events);

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("工作事件");
      // console.log("\x1b[32m%s\x1b[0m", "========== FETCH ACTIVE EVENTS END ============");
    });

    it("应该包含BOTH类型的事件", () => {
      // console.log("\x1b[32m%s\x1b[0m", "========== FETCH BOTH EVENTS BEGIN ============");

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

      // console.log("\x1b[34m%s\x1b[0m", "Categories:", store.categories);
      // console.log("\x1b[34m%s\x1b[0m", "Events:", store.events);

      // 获取今天的事件
      const events = store.getEventsForDay(today);
      // console.log("\x1b[34m%s\x1b[0m", "Filtered events for today:", events);

      expect(events).toHaveLength(2);
      // 验证数组中包含这两个事件，不关心顺序
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: "日历事件",
            eventType: EventType.CALENDAR,
          }),
          expect.objectContaining({
            id: 2,
            title: "待办事项",
            eventType: EventType.BOTH,
          }),
        ])
      );
      // console.log("\x1b[32m%s\x1b[0m", "========== FETCH BOTH EVENTS END ============");
    });

    describe("filteredTodos 分类过滤", () => {
      it("应该包含BOTH类型的待办事项", () => {
        // console.log("\x1b[32m%s\x1b[0m", "========== FILTERED TODOS BEGIN ============");

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

        // console.log("\x1b[34m%s\x1b[0m", "Categories:", store.categories);
        // console.log("\x1b[34m%s\x1b[0m", "Events:", store.events);

        const todos = store.filteredTodos;
        // console.log("\x1b[34m%s\x1b[0m", "Filtered todos:", todos);

        expect(todos).toHaveLength(2);
        expect(todos[0].title).toBe("纯待办");
        expect(todos[1].title).toBe("BOTH待办");
        // console.log("\x1b[32m%s\x1b[0m", "========== FILTERED TODOS END ============");
      });
    });
  });

  describe("Local Storage", () => {
    it("should load events and categories from local storage", async () => {
      // console.log("\x1b[32m%s\x1b[0m", "========== LOAD FROM LOCAL STORAGE BEGIN ============");

      await eventStore.loadAppDataFromStore();

      // console.log("\x1b[34m%s\x1b[0m", "Loaded categories:", eventStore.categories);
      // console.log("\x1b[34m%s\x1b[0m", "Loaded events:", eventStore.events);

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
      // console.log("\x1b[32m%s\x1b[0m", "========== LOAD FROM LOCAL STORAGE END ============");
    });

    it("should save events and categories to local storage", async () => {
      // console.log("\x1b[32m%s\x1b[0m", "========== SAVE TO LOCAL STORAGE BEGIN ============");

      // console.log("\x1b[34m%s\x1b[0m", "Starting test for saving events and categories");

      const newCategory = {
        id: 3,
        name: "Health",
        color: "#2a9d8f",
        active: true,
      };
      // console.log("\x1b[34m%s\x1b[0m", "Original categories:", eventStore.categories);

      eventStore.categories.push(newCategory);

      // console.log("\x1b[34m%s\x1b[0m", "Updated categories:", eventStore.categories);

      // Uncomment and complete the following lines if needed
      // const newEvent = {
      //   title: "Health Event",
      //   start: new Date("2025-05-20T10:00:00.000Z"),
      //   end: new Date("2025-05-20T11:00:00.000Z"),
      //   eventType: EventType.CALENDAR,
      // };

      // // console.log("\x1b[34m%s\x1b[0m", "Original events:", eventStore.events);

      // await eventStore.addEvent(
      //   newEvent.title,
      //   newEvent.start,
      //   newEvent.end,
      //   newEvent.eventType
      // );

      // // console.log("\x1b[34m%s\x1b[0m", "Updated events:", eventStore.events);

      // @ts-ignore 验证本地存储是否正确保存
      // expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
      //   expect.objectContaining({
      //     categories: expect.arrayContaining([
      //       expect.objectContaining({ name: "Health" }),
      //     ]),
      //     events: expect.arrayContaining([
      //       expect.objectContaining({
      //         title: "Health Event",
      //         start: newEvent.start.toISOString(),
      //         end: newEvent.end.toISOString(),
      //       }),
      //     ]),
      //   })
      // );
      // console.log("\x1b[32m%s\x1b[0m", "========== SAVE TO LOCAL STORAGE END ============");
    });
  });
});
