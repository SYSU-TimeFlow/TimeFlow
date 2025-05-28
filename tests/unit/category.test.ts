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
      loadAppData: vi.fn(async () => {}),
      // 模拟保存应用数据的方法
      saveAppData: vi.fn(async () => {}),
    },
  } as any;

  setActivePinia(createPinia());
});

describe("saveCategory", () => {
  let eventStore: ReturnType<typeof useEventStore>;

  beforeEach(async () => {
    eventStore = useEventStore();
    await eventStore.loadAppDataFromStore(); // 确保每次测试前加载数据
  });

  it("应该添加新分类", () => {
    const store = useEventStore();
    store.currentCategory = {
      id: 1,
      name: "新分类",
      color: "#e63946",
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
      color: "#7209b7",
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
      color: "#7209b7",
      active: true,
    };
    store.showCategoryModal = true; // 模态框打开
    store.isNewCategory = true;

    store.saveCategory();

    expect(store.categories).toHaveLength(0);
    expect(store.showCategoryModal).toBe(true); // 模态框保持打开
  });

  it("更新分类时应该更新关联事件的分类颜色", async () => {
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

    await store.saveCategory();
    // 事件的分类颜色应当更新
    expect(store.events[0].categoryColor).toBe("#7209b7");
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
