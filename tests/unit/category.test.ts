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
import { useEventStore } from "../../src/renderer/stores/event";
import { Event, EventType } from "../../src/renderer/const";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPageModule } from "../../src/renderer/stores/ui/page";

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
          { id: 1, name: "其他", color: "#e63946", active: true }, // 默认分类
          { id: 2, name: "Work", color: "#2a9d8f", active: true },
          { id: 3, name: "Personal", color: "#f8961e", active: true },
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
            eventType: EventType.CALENDAR,
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
      id: 4,
      name: "新分类",
      color: "#7209b7", // 避免使用与已有分类相同的颜色
      active: true,
    };
    eventStore.isNewCategory = true;

    // console.log("Adding new category:", eventStore.currentCategory);
    eventStore.saveCategory();

    // console.log("Updated categories:", eventStore.categories);
    expect(eventStore.categories).toHaveLength(originalLength + 1);
    expect(eventStore.categories[eventStore.categories.length - 1]).toEqual(eventStore.currentCategory); // 使用长度索引而不是固定值
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
    const originalLength = eventStore.categories.length;
    eventStore.currentCategory = {
      id: 1,
      name: "", // 无效名称
      color: "#7209b7",
      active: true,
    };
    pageModule.showCategoryModal.value = true; // 模态框打开
    eventStore.isNewCategory = true;

    eventStore.saveCategory();

    expect(eventStore.categories).toHaveLength(originalLength); // 分类数量不应该改变
    expect(pageModule.showCategoryModal.value).toBe(true); // 模态框保持打开
  });

  it("更新分类时应该更新关联事件的分类颜色", async () => {
    // console.log("========== UPDATE CATEGORY COLOR BEGIN ==========");
    eventStore.currentCategory = {
      id: 1,
      name: "其他", // 正确的分类名称
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

  it("当删除分类时，其关联的事件也应被删除", () => {
    // 初始状态由 beforeEach 加载，包含3个分类和1个事件
    eventStore.currentCategory = {
      id: 2, // 准备删除 ID 为 2 的分类 (Work)
      name: "Work",
      color: "#2a9d8f",
      active: true,
    };
    eventStore.isNewCategory = false;

    // 添加一个事件，分类 ID 2
    eventStore.events.push(new Event(
      2,
      "测试事件",
      new Date("2025-05-18T10:00:00.000Z"),
      new Date("2025-05-18T11:00:00.000Z"),
      "Description",
      2,
      "#2a9d8f",
      false,
      EventType.CALENDAR,
      false
    ));

    // 模拟用户确认
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    eventStore.deleteCategory();

    expect(eventStore.categories).toHaveLength(2);
    // 确认剩下的是"其他"和"Personal"分类
    expect(eventStore.categories.some(c => c.id === 1 && c.name === "其他")).toBe(true);
    expect(eventStore.categories.some(c => c.id === 3 && c.name === "Personal")).toBe(true);
    // 验证关联的事件被删除
    expect(eventStore.events.every(e => e.categoryId !== 2)).toBe(true);
  });
});

describe("toggleCategory", () => {
  it("应该切换指定分类的active状态", () => {
    const store = useEventStore();
    // 使用新的测试数据，不依赖于初始化数据
    store.categories = [
      { id: 101, name: "工作", color: "#ff0000", active: true },
      { id: 102, name: "学习", color: "#00ff00", active: false },
    ];

    // 切换第一个分类
    store.toggleCategory(101);
    expect(store.categories[0].active).toBe(false);

    // 切换第二个分类
    store.toggleCategory(102);
    expect(store.categories[1].active).toBe(true);
  });
});
