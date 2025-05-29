import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingStore } from "../../src/stores/setting";

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
      // 模拟加载设置的loadSettings方法
      loadSettings: vi.fn(async () => {
        console.log("\x1b[34m%s\x1b[0m", "Mock loadSetting called");

        return {
          themeMode: "light",
          fontSize: "medium",
          iconStyle: "default",
          notifications: true,
          notificationSound: false,
          soundEffect: false,
          hour24: false,
          showLunar: false,
          weekStart: "0",
          language: "zh-CN",
          synced: true,
        };
      }),
      // 模拟保存设置的saveSettings方法
      saveSettings: vi.fn(async (setting: any) => {
        console.log("\x1b[34m%s\x1b[0m", "Mock saveSetting called");
      }),
    },
  } as any;

  setActivePinia(createPinia());

  // 重置所有模拟函数
  vi.resetAllMocks();
});

describe("Setting Store", () => {
  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const store = useSettingStore();

      // 验证所有默认设置是否正确
      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
      expect(store.iconStyle).toBe("default");
      expect(store.notifications).toBe(true);
      expect(store.notificationSound).toBe(false);
      expect(store.soundEffect).toBe(false);
      expect(store.hour24).toBe(false);
      expect(store.showLunar).toBe(false);
      expect(store.weekStart).toBe("0");
      expect(store.language).toBe("zh-CN");
      expect(store.synced).toBe(true);
    });

    it("should call loadSettings on initialization", () => {
      // 测试初始化时是否调用了 loadSettings 方法
      const store = useSettingStore();
      // @ts-ignore
      expect(global.window.electronAPI.loadSettings).toHaveBeenCalled();
    });
  });

  describe("Settings Management", () => {
    it("should save settings when any setting changes", async () => {
      // 测试当设置发生变化时是否正确保存
      const store = useSettingStore();
      store.themeMode = "dark";

      // 等待 watch 的异步保存操作完成
      await store.saveSettings();
      // await new Promise((resolve) => setTimeout(resolve, 0));

      // @ts-ignore 验证保存的设置是否正确
      expect(global.window.electronAPI.saveSettings).toHaveBeenCalledWith({
        themeMode: "dark",
        fontSize: "medium",
        iconStyle: "default",
        notifications: true,
        notificationSound: false,
        soundEffect: false,
        hour24: false,
        showLunar: false,
        weekStart: "0",
        language: "zh-CN",
        synced: true,
      });
    });

    it("should load settings correctly", async () => {
      // 测试是否正确加载设置
      const mockSettings = {
        themeMode: "dark",
        fontSize: "large",
        iconStyle: "modern",
        notifications: false,
        notificationSound: true,
        soundEffect: true,
        hour24: true,
        showLunar: true,
        weekStart: "1",
        language: "en-US",
        synced: false,
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
      expect(store.notificationSound).toBe(true);
      expect(store.soundEffect).toBe(true);
      expect(store.hour24).toBe(true);
      expect(store.showLunar).toBe(true);
      expect(store.weekStart).toBe("1");
      expect(store.language).toBe("en-US");
      expect(store.synced).toBe(false);
    });

    it("should handle empty settings when loading", async () => {
      // @ts-ignore 测试加载空设置时是否正确处理
      global.window.electronAPI.loadSettings.mockResolvedValue({});

      const store = useSettingStore();
      await store.loadSettings();

      // 验证是否保持默认值
      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
    });

    it("should reset settings to default values", async () => {
      // 测试重置设置是否正确
      const store = useSettingStore();
      store.themeMode = "dark";
      store.fontSize = "large";
      store.synced = false;

      await store.resetSettings();

      // 验证是否重置为默认值
      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
      expect(store.synced).toBe(true);
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith(
        "dark-mode"
      );
    });
  });
});
