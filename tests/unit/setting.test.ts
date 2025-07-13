import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingStore } from "../../src/renderer/stores/setting";

// beforeEach 确保每个测试用例开始时都初始化环境
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
      // 模拟加载设置的loadSettings方法
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
          hasWelcomeBeenShown: true,
        };
      }),
      // 模拟保存设置的saveSettings方法
      saveSettings: vi.fn(async (setting: any) => {
        // console.log("\x1b[34m%s\x1b[0m", "Mock saveSetting called");
      }),
    },
  } as any;

  setActivePinia(createPinia());

  // 重置所有模拟函数
  vi.resetAllMocks();
});

describe("Setting Store", () => {
  let store: ReturnType<typeof useSettingStore>;

  // 每个测试前初始化，确保每个测试用例都在一个干净的 store 下运行
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    store = useSettingStore();
  });

  describe("Initialization", () => {
    it("应该使用默认值初始化", () => {
      const store = useSettingStore();

      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
      expect(store.iconStyle).toBe("default");
      expect(store.notifications).toBe(true);
      expect(store.hour24).toBe(false);
      expect(store.showLunar).toBe(false);
      expect(store.weekStart).toBe("0");
      expect(store.language).toBe("zh-CN");
    });

    it("should call loadSettings on initialization", () => {
      const store = useSettingStore();
      // @ts-ignore 验证初始化时是否调用了 loadSettings 方法
      expect(global.window.electronAPI.loadSettings).toHaveBeenCalled();
    });
  });

  describe("Settings Management", () => {
    it("当设置发生变化时应该自动保存", async () => {
      const store = useSettingStore();
      store.themeMode = "dark";

      // 等待 watch 的异步保存操作完成
      await new Promise((resolve) => setTimeout(resolve, 0));

      // @ts-ignore 验证是否调用了保存的函数且参数正确
      expect(global.window.electronAPI.saveSettings).toHaveBeenCalledWith({
        themeMode: "dark",
        fontSize: "medium",
        iconStyle: "default",
        notifications: true,
        hour24: false,
        showLunar: false,
        weekStart: "0",
        language: "zh-CN",
        hasWelcomeBeenShown: true,
      });
    });

    it("loadSettings - 应该从 electronAPI 加载设置", async () => {
      const mockSettings = {
        themeMode: "dark",
        fontSize: "large",
        iconStyle: "modern",
        notifications: false,
        hour24: true,
        showLunar: true,
        weekStart: "1",
        language: "en-US",
      };

      // @ts-ignore 模拟加载设置的返回值
      global.window.electronAPI.loadSettings.mockResolvedValue(mockSettings);

      const store = useSettingStore();
      await store.loadSettings();

      // 验证加载的设置是否正确
      expect(store.themeMode).toBe("dark");
      expect(store.fontSize).toBe("large");
      expect(store.iconStyle).toBe("modern");
      expect(store.notifications).toBe(false);
      expect(store.hour24).toBe(true);
      expect(store.showLunar).toBe(true);
      expect(store.weekStart).toBe("1");
      expect(store.language).toBe("en-US");
    });

    it("loadSettings - 加载的设置为空时应使用默认值", async () => {
      // @ts-ignore 令加载的设置为空
      global.window.electronAPI.loadSettings.mockResolvedValue({});

      const store = useSettingStore();
      await store.loadSettings();

      // 验证是否为默认值
      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
    });

    it("resetSettings - 应该重置为默认值", async () => {
      const store = useSettingStore();
      store.themeMode = "dark";
      store.fontSize = "large";

      await store.resetSettings();

      // 验证是否重置为默认值
      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
    });
  });

  describe("Theme", () => {
    it("应正确设置主题", async () => {
      const store = useSettingStore();
      await store.setThemeMode("dark");

      expect(store.themeMode).toBe("dark");
    });
  });

  describe("Font Size", () => {
    it("setFontSize 应该设置字体大小", async () => {
      const store = useSettingStore();
      await store.setFontSize("large");
      expect(store.fontSize).toBe("large");

      store.setFontSize("small");
      expect(store.fontSize).toBe("small");

      store.setFontSize("medium");
      expect(store.fontSize).toBe("medium");
    });
  });

  describe("Week Start", () => {
    it("getWeekStart - 应该返回周起始日", () => {
      const store = useSettingStore();
      expect(store.getWeekStart()).toBe("0");
    });

    it("setWeekStart - 应该更新周起始日", async () => {
      const store = useSettingStore();
      await store.setWeekStart("1"); // 设置每周从周一开始

      expect(store.weekStart).toBe("1");
    });

    it("toggleWeekStart - 应该在周日和周一之间切换", async () => {
      const store = useSettingStore();

      // 初始是0（周日）
      await store.toggleWeekStart();
      expect(store.weekStart).toBe("1");

      await store.toggleWeekStart();
      expect(store.weekStart).toBe("0");
    });
  });

  describe("Other Settings", () => {
    it("应正确设置语言", async () => {
      const store = useSettingStore();
      await store.setLanguage("en-US");

      expect(store.language).toBe("en-US");
    });

    it("应正确设置图标风格", async () => {
      const store = useSettingStore();
      await store.setIconStyle("modern");

      expect(store.iconStyle).toBe("modern");
    });

    it("应正确地开启或关闭通知", async () => {
      const store = useSettingStore();
      await store.setNotifications(false);

      expect(store.notifications).toBe(false);
    });

    it("应正确设置24小时制", async () => {
      const store = useSettingStore();
      await store.setHour24(true);

      expect(store.hour24).toBe(true);
    });

    it("应开启显示农历", async () => {
      const store = useSettingStore();
      await store.setShowLunar(true);

      expect(store.showLunar).toBe(true);
    });
  });
});
