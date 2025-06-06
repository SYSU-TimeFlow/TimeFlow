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
  
  beforeEach(async () => {
    eventStore = useEventStore();
    await eventStore.loadAppDataFromStore();
  });
  
  it("应该添加新分类", () => {
    // console.log("========== ADD NEW CATEGORY BEGIN ==========");
    const pageModule = createPageModule({});
    const store = useEventStore();
    const originalLength = store.categories.length;
    store.currentCategory = {
      id: 3,
      name: "新分类",
      color: "#e63946",
      active: true,
    };
    store.isNewCategory = true;

    // console.log("Adding new category:", store.currentCategory);
    store.saveCategory();

    // console.log("Updated categories:", store.categories);
    expect(store.categories).toHaveLength(originalLength + 1);
    expect(store.categories[2]).toEqual(store.currentCategory);
    expect(pageModule.showCategoryModal.value).toBe(false);

    // console.log("========== ADD NEW CATEGORY END ==========");
  });

  it("应该更新现有分类", () => {
    // console.log("========== UPDATE EXISTING CATEGORY BEGIN ==========");
    const store = useEventStore();
    store.categories = [
      { id: 1, name: "旧名称", color: "#ff0000", active: true },
    ];
    store.currentCategory = {
      id: 1,
      name: "新名称",
      color: "#7209b7",
      active: false,
    };
    store.isNewCategory = false;

    // console.log("Updating category:", store.currentCategory);
    store.saveCategory();

    // console.log("Updated categories:", store.categories);
    expect(store.categories).toHaveLength(1);
    expect(store.categories[0]).toEqual(store.currentCategory);
    // console.log("========== UPDATE EXISTING CATEGORY END ==========");
  });

  it("当表单无效时不应该保存", () => {
    const store = useEventStore();
    const pageModule = createPageModule({});
    store.currentCategory = {
      id: 1,
      name: "", // 无效名称
      color: "#7209b7",
      active: true,
    };
    pageModule.showCategoryModal.value = true; // 模态框打开
    store.isNewCategory = true;

    store.saveCategory();

    expect(store.categories).toHaveLength(2);
    expect(pageModule.showCategoryModal.value).toBe(true); // 模态框保持打开
  });

  it("更新分类时应该更新关联事件的分类颜色", async () => {
    // console.log("========== UPDATE CATEGORY COLOR BEGIN ==========");
    const store = useEventStore();
    store.categories = [
      { id: 1, name: "工作", color: "#e63946", active: true },
    ];
    store.events = [
      new Event(
        1,
        "事件1",
        new Date(),
        new Date(),
        "",
        1,
        "#e63946",
        false,
        EventType.CALENDAR,
        false
      ),
    ];
    store.currentCategory = {
      id: 1,
      name: "工作",
      color: "#7209b7", // 新颜色：紫色
      active: true,
    };
    store.isNewCategory = false;

    // console.log("Updating category color to:", store.currentCategory.color);
    await store.saveCategory();

    // console.log("Updated events:", store.events);
    expect(store.events[0].categoryColor).toBe("#7209b7");
    // console.log("========== UPDATE CATEGORY COLOR END ==========");
  });
});

describe("deleteCategory", () => {
  it("应该删除分类并将关联事件重新分配到默认分类", () => {
    // console.log("========== DELETE CATEGORY BEGIN ==========");
    const store = useEventStore();
    const pageModule = createPageModule({});

    store.categories = [
      { id: 1, name: "工作", color: "#ff0000", active: true },
      { id: 5, name: "其他", color: "#43aa8b", active: true },
    ];
    store.events = [
      new Event(
        1,
        "事件1",
        new Date(),
        new Date(),
        "",
        1,
        "#ff0000",
        false,
        EventType.CALENDAR,
        false
      ),
      new Event(
        2,
        "事件2",
        new Date(),
        new Date(),
        "",
        5,
        "#43aa8b",
        false,
        EventType.BOTH,
        false
      ),
    ];
    store.currentCategory = {
      id: 1,
      name: "工作",
      color: "#ff0000",
      active: true,
    };
    store.isNewCategory = false;

    // console.log("Deleting category:", store.currentCategory);
    store.deleteCategory();

    // console.log("Updated categories:", store.categories);
    // console.log("Updated events:", store.events);
    expect(store.categories).toHaveLength(1);
    expect(store.categories[0].id).toBe(5);
    expect(store.events[0].categoryId).toBe(5);
    expect(store.events[0].categoryColor).toBe("#43aa8b");
    expect(store.events[1].categoryId).toBe(5); // 保持不变
    expect(pageModule.showCategoryModal.value).toBe(false);
    // console.log("========== DELETE CATEGORY END ==========");
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
      new Event(
        1,
        "事件1",
        new Date(),
        new Date(),
        "",
        1,
        "#ff0000",
        false,
        EventType.CALENDAR,
        false
      ),
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
