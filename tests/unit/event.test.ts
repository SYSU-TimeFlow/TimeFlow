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
  global.window = {
    electronAPI: {
      loadAppData: vi.fn(async () => ({
        categories: [
          { id: 1, name: "Work", color: "#e63946", active: true },
          { id: 2, name: "Personal", color: "#f8961e", active: true },
        ],
        events: [
          {
            id: 1,
            title: "Test Event",
            start: "2025-05-18T10:00:00.000Z",
            end: "2025-05-18T11:00:00.000Z",
            description: "Description",
            categoryId: 1,
            categoryColor: "#e63946",
            allDay: false,
            eventType: "calendar",
            completed: false,
          },
        ],
      })),
      saveAppData: vi.fn(async () => {}),
    },
  } as any;

  setActivePinia(createPinia());
});

describe("eventStore", () => {
  let eventStore: ReturnType<typeof useEventStore>;

  beforeEach(async () => {
    eventStore = useEventStore();
    await eventStore.loadAppDataFromStore(); // 确保每次测试前加载数据
  });

  describe("Event", () => {
    it("should add a new event and save to local storage", async () => {
      const newEvent = {
        title: "New Event",
        start: new Date("2025-05-19T10:00:00.000Z"),
        end: new Date("2025-05-19T11:00:00.000Z"),
        eventType: EventType.CALENDAR,
      };

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

      // @ts-ignore 验证本地存储是否正确保存
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
      expect(eventsForDay[0]).toMatchObject({
        title: "Test Event",
      });
    });
  });

  describe("Category", () => {
    it("should add a new category", () => {
      const newCategory = {
        id: 3,
        name: "Health",
        color: "#2a9d8f",
        active: true,
      };
      eventStore.categories.push(newCategory);
      expect(eventStore.categories).toContainEqual(newCategory);
    });

    // it("should delete a category", () => {
      // const categoryToDelete = eventStore.categories[0];
      // 有问题，没有调用 deleteCategory
      // eventStore.categories = eventStore.categories.filter(
      //   (category) => category.id !== categoryToDelete.id
      // );
      // expect(eventStore.categories).not.toContainEqual(categoryToDelete);
    // });

    it("should update a category", () => {
      const categoryToUpdate = eventStore.categories[0];
      categoryToUpdate.name = "Updated Work";
      expect(eventStore.categories).toContainEqual(
        expect.objectContaining({ name: "Updated Work" })
      );
    });

    it("should toggle category active state", () => {
      const category = eventStore.categories[0];
      eventStore.toggleCategory(category.id);
      expect(category.active).toBe(false);
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
