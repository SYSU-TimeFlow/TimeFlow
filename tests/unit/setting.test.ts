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
      expect(store.notificationSound).toBe(false);
      expect(store.soundEffect).toBe(false);
      expect(store.hour24).toBe(false);
      expect(store.showLunar).toBe(false);
      expect(store.weekStart).toBe("0");
      expect(store.language).toBe("zh-CN");
      expect(store.synced).toBe(true);
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
        notificationSound: false,
        soundEffect: false,
        hour24: false,
        showLunar: false,
        weekStart: "0",
        language: "zh-CN",
        synced: true,
      });
    });

    it("loadSettings - 应该从 electronAPI 加载设置", async () => {
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
      store.synced = false;

      await store.resetSettings();

      // 验证是否重置为默认值
      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
      expect(store.synced).toBe(true);
    });
  });

  describe("Theme", () => {
    it("应该应用浅色主题", () => {
      const store = useSettingStore();
      store.applyTheme("light");

      expect(
        global.document.documentElement.classList.remove
      ).toHaveBeenCalledWith("dark-mode");
    });

    it("应该应用深色主题", () => {
      const store = useSettingStore();
      store.applyTheme("dark");

      expect(
        global.document.documentElement.classList.add
      ).toHaveBeenCalledWith("dark-mode");
    });

    it("应正确设置主题", async () => {
      // 测试设置主题模式是否正确
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
      expect(
        global.document.documentElement.classList.add
      ).toHaveBeenCalledWith("font-size-large");

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
    it("应切换同步设置", async () => {
      const store = useSettingStore();
      await store.toggleSync();

      expect(store.synced).toBe(false);

      await store.toggleSync();
      expect(store.synced).toBe(true);
    });

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

    it("应正确开启或关闭通知音效", async () => {
      const store = useSettingStore();
      await store.setNotificationSound(true);

      expect(store.notificationSound).toBe(true);
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

  describe("Calendar Functions", () => {
    describe("getMonthDays", () => {
      it("getMonthDays 应该返回月视图下的日期数组", () => {
        const store = useSettingStore();
        const testDate = new Date(2023, 5, 15); // 2023年6月15日

        const days = store.getMonthDays(testDate);

        // 6月有30天，加上前后补全的天数
        expect(days.length).toBeGreaterThanOrEqual(35);
        expect(days.length).toBeLessThanOrEqual(42);

        // 检查当前月的天数
        const currentMonthDays = days.filter((d) => d.isCurrentMonth);
        expect(currentMonthDays.length).toBe(30);
      });

      it("getMonthDays 应该按照周起始日的设置", () => {
        const store = useSettingStore();
        store.weekStart = "1"; // 周一开始

        const testDate = new Date(2023, 5, 15); // 2023年6月15日
        const days = store.getMonthDays(testDate);

        // 6月1日是周四，如果周一开始，前面应该有3天（周一至周三）
        const firstCurrentMonthDay = days.find((d) => d.isCurrentMonth);
        expect(firstCurrentMonthDay?.dayNumber).toBe(1);
        expect(new Date(firstCurrentMonthDay!.date).getDay()).toBe(4); // 周四

        // 前面的非当前月天数
        const prevMonthDays = days.slice(
          0,
          days.indexOf(firstCurrentMonthDay!)
        );
        expect(prevMonthDays.length).toBe(3);
      });
    });

    describe("getWeekDays", () => {
      it("getWeekDays 应该返回周视图下的日期数组", () => {
        const store = useSettingStore();
        // 注意：JavaScript中月份是从0开始的，所以5表示6月
        const testDate = new Date(2023, 5, 15); // 2023年6月15日（周四）

        const weekDays = store.getWeekDays(testDate);

        expect(weekDays.length).toBe(7);
        expect(weekDays[0].dayName).toBe("星期日");
        expect(weekDays[3].dayName).toBe("星期三");
      });

      it("getWeekDays 应该按照周起始日的设置", () => {
        const store = useSettingStore();
        store.weekStart = "1"; // 周一开始

        const testDate = new Date(2023, 5, 15); // 2023年6月15日（周四）
        const weekDays = store.getWeekDays(testDate);

        expect(weekDays.length).toBe(7);
        expect(weekDays[0].dayName).toBe("星期一");
        expect(weekDays[3].dayName).toBe("星期四");
      });
    });

    describe("getWeekDayNames", () => {
      it("默认应返回从周日开始的周天名称", () => {
        const store = useSettingStore();
        store.weekStart = "0";

        const names = store.getWeekDayNames();
        expect(names).toEqual([
          "星期日",
          "星期一",
          "星期二",
          "星期三",
          "星期四",
          "星期五",
          "星期六",
        ]);
      });

      it("当周起始日为1时应返回从周一开始的周天名称", () => {
        const store = useSettingStore();
        store.weekStart = "1";

        const names = store.getWeekDayNames();
        expect(names).toEqual([
          "星期一",
          "星期二",
          "星期三",
          "星期四",
          "星期五",
          "星期六",
          "星期日",
        ]);
      });
    });
  });

  describe("农历相关功能", () => {
    let store: ReturnType<typeof useSettingStore>;

    beforeEach(() => {
      // 在每个测试用例前创建一个新的 pinia 实例
      setActivePinia(createPinia());
      store = useSettingStore();
    });

    it("getLunarDate - 应该返回正确的农历日期", () => {
      const store = useSettingStore();

      // 2023-01-22 是春节（农历正月初一）
      const date1 = new Date(2023, 0, 22);
      const result1 = store.getLunarDate(date1);
      expect(result1.day).toBe("初一");
      expect(result1.month).toBe("正月");

      // 2023-01-23 是农历正月初二
      const date2 = new Date(2023, 0, 23);
      const result2 = store.getLunarDate(date2);
      expect(result2.day).toBe("初二");
      expect(result2.month).toBeUndefined();
    });

    it("getLunarYearDays 应该返回农历一年的总天数", () => {
      expect(store.getLunarYearDays(2023)).toBe(384); // 2023年有闰二月，共384天
      expect(store.getLunarYearDays(2022)).toBe(355);
    });

    it("getLeapMonth 应该返回闰月的月份", () => {
      expect(store.getLeapMonth(2023)).toBe(2); // 2023年闰二月
      expect(store.getLeapMonth(2022)).toBe(0); // 2022年无闰月
    });

    it("getLeapMonthDays 应该返回闰月的天数", () => {
      expect(store.getLeapMonthDays(2023)).toBe(29); // 2023年闰二月29天
      expect(store.getLeapMonthDays(2022)).toBe(0);
    });

    it("getLunarMonthDays 应该返回农历某月的总天数", () => {
      expect(store.getLunarMonthDays(2023, 1)).toBe(29); // 2023年正月29天
      expect(store.getLunarMonthDays(2023, 2)).toBe(30); // 2023年农历二月30天
      expect(store.getLunarMonthDays(2023, 3)).toBe(29); // 2023年闰二月29天
    });
  });
});
