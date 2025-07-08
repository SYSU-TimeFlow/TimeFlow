/**
 * @description TimeFlow 应用中 `categories` 的单元测试。
 * 本文件包含对 `categories` 各种功能的测试用例，包括分类的添加、更新、删除、切换激活状态，
 * 以及验证分类与事件之间的交互逻辑。
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
import { createPageModule } from "../../src/stores/ui/page";

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
    confirm: vi.fn(() => true), // 修正：在此处模拟 confirm 函数
    alert: vi.fn(),             // 修正：在此处模拟 alert 函数
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

describe("saveCategory", () => {
  let eventStore: ReturnType<typeof useEventStore>;
  let pageModule: ReturnType<typeof createPageModule>;

  beforeEach(async () => {
    eventStore = useEventStore();
    pageModule = createPageModule({});
    await eventStore.loadAppDataFromStore();
  });

  it("应该添加新分类", () => {
    // console.log("========== ADD NEW CATEGORY BEGIN ==========");
    const originalLength = eventStore.categories.length;
    eventStore.currentCategory = {
      id: 3,
      name: "新分类",
      color: "#e63946",
      active: true,
    };
    eventStore.isNewCategory = true;

    // console.log("Adding new category:", eventStore.currentCategory);
    eventStore.saveCategory();

    // console.log("Updated categories:", eventStore.categories);
    expect(eventStore.categories).toHaveLength(originalLength + 1);
    expect(eventStore.categories[2]).toEqual(eventStore.currentCategory);
    expect(pageModule.showCategoryModal.value).toBe(false);

    // console.log("========== ADD NEW CATEGORY END ==========");
  });

  it("应该更新现有分类", () => {
    // console.log("========== UPDATE EXISTING CATEGORY BEGIN ==========");
    eventStore.currentCategory = {
      id: 1,
      name: "新名称",
      color: "#7209b7",
      active: false,
    };
    eventStore.isNewCategory = false;

    // console.log("Updating category:", eventStore.currentCategory);
    eventStore.saveCategory();

    // console.log("Updated categories:", eventStore.categories);
    const updatedCategory = eventStore.categories.find((c) => c.id === 1);
    expect(updatedCategory).toEqual(eventStore.currentCategory);
    // console.log("========== UPDATE EXISTING CATEGORY END ==========");
  });

  it("当表单无效时不应该保存", () => {
    eventStore.currentCategory = {
      id: 1,
      name: "", // 无效名称
      color: "#7209b7",
      active: true,
    };
    pageModule.showCategoryModal.value = true; // 模态框打开
    eventStore.isNewCategory = true;

    eventStore.saveCategory();

    expect(eventStore.categories).toHaveLength(2);
    expect(pageModule.showCategoryModal.value).toBe(true); // 模态框保持打开
  });

  it("更新分类时应该更新关联事件的分类颜色", async () => {
    // console.log("========== UPDATE CATEGORY COLOR BEGIN ==========");
    eventStore.currentCategory = {
      id: 1,
      name: "Work",
      color: "#7209b7", // 新颜色：紫色
      active: true,
    };
    eventStore.isNewCategory = false;

    // console.log("Updating category color to:", eventStore.currentCategory.color);
    await eventStore.saveCategory();

    // console.log("Updated events:", eventStore.events);
    expect(eventStore.events[0].categoryColor).toBe("#7209b7");
    // console.log("========== UPDATE CATEGORY COLOR END ==========");
  });
});

describe("deleteCategory", () => {
  let eventStore: ReturnType<typeof useEventStore>;
  let pageModule: ReturnType<typeof createPageModule>;

  beforeEach(async () => {
    eventStore = useEventStore();
    pageModule = createPageModule({});
    await eventStore.loadAppDataFromStore();
  });

  it("应该能够删除最后一个分类", () => {
    // 准备只有一个分类的场景
    eventStore.categories = [
      { id: 1, name: "工作", color: "#ff0000", active: true },
    ];
    eventStore.events = [
      new Event(1, "唯一的事件", new Date(), new Date(), "", 1, "#ff0000"),
    ];
    eventStore.currentCategory = {
      id: 1,
      name: "工作",
      color: "#ff0000",
      active: true,
    };
    eventStore.isNewCategory = false;

    // 模拟用户确认
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    eventStore.deleteCategory();

    // 验证最后一个分类和其关联事件都已被删除
    expect(eventStore.categories).toHaveLength(0);
    expect(eventStore.events).toHaveLength(0);
  });

  it("当删除分类时，其关联的事件也应被删除", () => {
    // 初始状态由 beforeEach 加载，包含2个分类和1个事件
    eventStore.currentCategory = {
      id: 1, // 准备删除 ID 为 1 的分类
      name: "Work",
      color: "#e63946",
      active: true,
    };
    eventStore.isNewCategory = false;

    // 模拟用户确认
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    eventStore.deleteCategory();

    expect(eventStore.categories).toHaveLength(1);
    expect(eventStore.categories[0].id).toBe(2); // 确认剩下的是 Personal 分类
    expect(eventStore.events).toHaveLength(0); // 验证关联的事件被删除
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
