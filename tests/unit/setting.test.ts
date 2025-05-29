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
      await new Promise((resolve) => setTimeout(resolve, 0));

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

  describe("Theme Management", () => {
    it("should apply light theme correctly", () => {
      // 测试应用浅色主题是否正确
      const store = useSettingStore();
      store.applyTheme("light");

      expect(global.document.documentElement.classList.remove).toHaveBeenCalledWith(
        "dark-mode"
      );
    });

    it("should apply dark theme correctly", () => {
      // 测试应用深色主题是否正确
      const store = useSettingStore();
      store.applyTheme("dark");

      expect(global.document.documentElement.classList.add).toHaveBeenCalledWith(
        "dark-mode"
      );
    });

    it("should set theme mode", async () => {
      // 测试设置主题模式是否正确
      const store = useSettingStore();
      await store.setThemeMode("dark");

      expect(store.themeMode).toBe("dark");
      // expect(global.document.documentElement.classList.add).toHaveBeenCalledWith(
      //   "dark-mode"
      // );
    });
  });

  describe('Font Size Management', () => {
    it('should set font size', async () => {
      // 测试设置字体大小是否正确
      const store = useSettingStore()
      await store.setFontSize('large')
      expect(store.fontSize).toBe('large')
      expect(global.document.documentElement.classList.add).toHaveBeenCalledWith('font-size-large')

      store.setFontSize('small');
      expect(store.fontSize).toBe('small');

      store.setFontSize('medium');
      expect(store.fontSize).toBe('medium');
    })
  })

  describe("Week Start Management", () => {
    it("should get week start", () => {
      // 获取每周的起始日
      const store = useSettingStore();
      expect(store.getWeekStart()).toBe("0");
    });

    it("should set week start", async () => {
      // 设置每周起始日
      const store = useSettingStore();
      await store.setWeekStart("1"); // 设置每周从周一开始

      expect(store.weekStart).toBe("1");
    });

    it("should toggle week start", async () => {
      // 测试切换周开始设置是否正确
      const store = useSettingStore();

      // 初始是0（周日）
      await store.toggleWeekStart();
      expect(store.weekStart).toBe("1");

      await store.toggleWeekStart();
      expect(store.weekStart).toBe("0");
    });
  });

  describe("Other Settings", () => {
    it("should toggle sync", async () => {
      // 测试切换同步设置是否正确
      const store = useSettingStore();
      await store.toggleSync();

      expect(store.synced).toBe(false);

      await store.toggleSync();
      expect(store.synced).toBe(true);
    });

    it("should set language", async () => {
      // 测试设置语言是否正确
      const store = useSettingStore();
      await store.setLanguage("en-US");

      expect(store.language).toBe("en-US");
    });

    it("should set icon style", async () => {
      // 测试设置图标风格是否正确
      const store = useSettingStore();
      await store.setIconStyle("modern");

      expect(store.iconStyle).toBe("modern");
    });

    it("should set notifications", async () => {
      // 测试设置通知开关是否正确
      const store = useSettingStore();
      await store.setNotifications(false);

      expect(store.notifications).toBe(false);
    });

    it("should set notification sound", async () => {
      // 测试设置通知音效开关是否正确
      const store = useSettingStore();
      await store.setNotificationSound(true);

      expect(store.notificationSound).toBe(true);
    });

    it("should set sound effect", async () => {
      // 测试设置音效开关是否正确
      const store = useSettingStore();
      await store.setSoundEffect(true);

      expect(store.soundEffect).toBe(true);
    });

    it("should set 24-hour format", async () => {
      // 测试设置24小时制是否正确
      const store = useSettingStore();
      await store.setHour24(true);

      expect(store.hour24).toBe(true);
    });

    it("should set show lunar", async () => {
      // 测试设置是否显示农历是否正确
      const store = useSettingStore();
      await store.setShowLunar(true);

      expect(store.showLunar).toBe(true);
    });
  });

  describe("UI State Management", () => {
    it("should toggle settings visibility", async () => {
      // 测试切换设置界面可见性是否正确
      const store = useSettingStore();

      expect(store.showSettings).toBe(false);

      await store.toggleSettings();
      expect(store.showSettings).toBe(true);
      // @ts-ignore 验证是否调用了 loadSettings 方法
      expect(global.window.electronAPI.loadSettings).toHaveBeenCalledTimes(2); // 初始化和这里

      await store.toggleSettings();
      expect(store.showSettings).toBe(false);
    });

    it("should close settings", () => {
      // 测试关闭设置界面是否正确
      const store = useSettingStore();
      store.showSettings = true;

      store.closeSettings();
      expect(store.showSettings).toBe(false);
    });
  });

  describe("Calendar Functions", () => {
    describe("getLunarDate", () => {
      it("should return correct lunar date for known dates", () => {
        // 测试已知日期的农历日期计算是否正确
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
    });

    describe("getMonthDays", () => {
      it("should return correct month days structure", () => {
        // 测试返回的月份天数结构是否正确
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

      it("should respect week start setting", () => {
        // 测试月份天数计算是否尊重周开始设置
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
      it("should return correct week days structure", () => {
        // 测试返回的周天数结构是否正确
        const store = useSettingStore();
        // 注意：JavaScript中月份是从0开始的，所以5表示6月
        const testDate = new Date(2023, 5, 15); // 2023年6月15日（周四）

        const weekDays = store.getWeekDays(testDate);

        expect(weekDays.length).toBe(7);
        expect(weekDays[0].dayName).toBe("星期日");
        expect(weekDays[3].dayName).toBe("星期三");
      });

      it("should respect week start setting", () => {
        // 测试周天数计算是否尊重周开始设置
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
      it("should return week day names starting from Sunday by default", () => {
        // 测试默认情况下返回的周天名称是否从星期日开始
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

      it("should return week day names starting from Monday when weekStart is 1", () => {
        // 测试当 weekStart 为 1 时返回的周天名称是否从星期一开始
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

  describe("Lunar Calculation Functions", () => {
    let store: ReturnType<typeof useSettingStore>;

    beforeEach(() => {
      // 在每个测试用例前创建一个新的 pinia 实例
      setActivePinia(createPinia());
      store = useSettingStore();
    });

    it("getLunarYearDays should return correct days for known years", () => {
      expect(store.getLunarYearDays(2023)).toBe(384); // 2023年有闰二月，共384天
      expect(store.getLunarYearDays(2022)).toBe(355);
    });

    it("getLeapMonth should return correct leap month for known years", () => {
      expect(store.getLeapMonth(2023)).toBe(2); // 2023年闰二月
      expect(store.getLeapMonth(2022)).toBe(0); // 2022年无闰月
    });

    it("getLeapMonthDays should return correct days for leap months", () => {
      expect(store.getLeapMonthDays(2023)).toBe(29); // 2023年闰二月29天
      expect(store.getLeapMonthDays(2022)).toBe(0);
    });

    it("getLunarMonthDays should return correct days for known months", () => {
      expect(store.getLunarMonthDays(2023, 1)).toBe(29); // 2023年正月29天
      expect(store.getLunarMonthDays(2023, 2)).toBe(30); // 2023年农历二月30天
      expect(store.getLunarMonthDays(2023, 3)).toBe(29); // 2023年闰二月29天
    });
  });
});
