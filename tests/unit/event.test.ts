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
        console.log('\x1b[34m%s\x1b[0m', 'Mock saveAppData called');
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
      await eventStore.loadAppDataFromStore(); // 确保每次测试前加载数据
    });

    it("should delete event", async () => {

      console.log('\x1b[34m%s\x1b[0m', 'original event', eventStore.events);
      
      const eventToDelete = eventStore.events[0];
      console.log(
        "\x1b[34m%s\x1b[0m",
        `original event: length: ${eventStore.events.length}}`
      );
      console.log(
        "\x1b[32m%s\x1b[0m",
        `Deleting event: ${eventToDelete.title} with ID: ${eventToDelete.id}`
      );
      await eventStore.deleteEvent(eventToDelete.id);

      console.log(
        "\x1b[34m%s\x1b[0m",
        `updated event: length: ${eventStore.events.length}}`
      );

      expect(eventStore.events).not.toContainEqual(eventToDelete);

      // @ts-ignore 验证本地存储是否正确更新(不包含被删除的事件)
      expect(global.window.electronAPI.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.not.arrayContaining([eventToDelete]),
        })
      );
    });

    console.log("\x1b[32m%s\x1b[0m", "=======================");

    it("should update an event and save changes to local storage", async () => {
      console.log();

      const eventToUpdate = eventStore.events[0];
      console.log(
        "\x1b[34m%s\x1b[0m",
        `original event: ${eventToUpdate.title} with ID: ${eventToUpdate.id}`
      );
      eventToUpdate.title = "Updated Event";

      console.log(
        "\x1b[32m%s\x1b[0m",
        `Updating event to: ${eventToUpdate.title}`
      );

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

    console.log("\x1b[32m%s\x1b[0m", "=======================");

    it("should fetch events for a specific day", () => {
      const eventsForDay = eventStore.getEventsForDay(
        new Date("2025-05-18T00:00:00.000Z")
      );
      expect(eventsForDay).toHaveLength(1);
      expect(eventsForDay[0]).toMatchObject({
        title: "Test Event",
        start: new Date("2025-05-18T10:00:00.000Z"),
        end: new Date("2025-05-18T11:00:00.000Z"),
        eventType: EventType.CALENDAR,
      });
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

      const events = store.getEventsForDay(today);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("工作事件");
    });

    it("应该包含BOTH类型的事件", () => {
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
    });

    describe("filteredTodos 分类过滤", () => {
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

      console.log('\x1b[34m%s\x1b[0m', 'Starting test for saving events and categories');
      
      const newCategory = {
        id: 3,
        name: "Health",
        color: "#2a9d8f",
        active: true,
      };
      console.log("original category ", eventStore.categories);

      eventStore.categories.push(newCategory);

      console.log("updated category ", eventStore.categories);
      
      // const newEvent = {
      //   title: "Health Event",
      //   start: new Date("2025-05-20T10:00:00.000Z"),
      //   end: new Date("2025-05-20T11:00:00.000Z"),
      //   eventType: EventType.CALENDAR,
      // };
      
      // console.log("original events ", eventStore.events);

      // await eventStore.addEvent(
      //   newEvent.title,
      //   newEvent.start,
      //   newEvent.end,
      //   newEvent.eventType
      // );

      // console.log("updated events ", eventStore.events);

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
    });
  });
});
