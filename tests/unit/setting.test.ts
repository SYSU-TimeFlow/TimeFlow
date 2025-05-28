import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingStore } from "../../src/stores/setting";

// 模拟 window.electronAPI
const mockElectronAPI = {
  saveSettings: vi.fn().mockResolvedValue(undefined),
  loadSettings: vi.fn().mockResolvedValue({}),
  notify: vi.fn(),
  setNativeTheme: vi.fn(),
};

// 模拟 document
const mockDocument = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
};

beforeEach(() => {
  // 设置模拟的 electronAPI
  global.window = {
    electronAPI: mockElectronAPI,
  } as any;

  // 设置模拟的 document
  global.document = mockDocument as any;

  // 创建一个新的 pinia 实例
  setActivePinia(createPinia());

  // 重置所有模拟
  vi.resetAllMocks();
});

describe("Setting Store", () => {
  // let store: ReturnType<typeof useSettingStore>;

  // beforeEach(async () => {
  //   store = useSettingStore();
  // });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
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
      expect(mockElectronAPI.loadSettings).toHaveBeenCalled();
    });
  });

  describe("Settings Management", () => {
    it("should save settings when any setting changes", async () => {
      const store = useSettingStore();
      store.themeMode = "dark";

      // 由于 watch 是异步的，我们需要等待
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockElectronAPI.saveSettings).toHaveBeenCalledWith({
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

      mockElectronAPI.loadSettings.mockResolvedValue(mockSettings);

      const store = useSettingStore();
      await store.loadSettings();

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
      mockElectronAPI.loadSettings.mockResolvedValue({});

      const store = useSettingStore();
      await store.loadSettings();

      // 应该保持默认值
      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
    });

    it("should reset settings to default values", async () => {
      const store = useSettingStore();
      store.themeMode = "dark";
      store.fontSize = "large";
      store.synced = false;

      await store.resetSettings();

      expect(store.themeMode).toBe("light");
      expect(store.fontSize).toBe("medium");
      expect(store.synced).toBe(true);
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "dark-mode"
      );
    });
  });

  describe("Theme Management", () => {
    it("should apply light theme correctly", () => {
      const store = useSettingStore();
      store.applyTheme("light");

      expect(
        mockDocument.documentElement.classList.remove
      ).toHaveBeenCalledWith("dark-mode");
      expect(mockElectronAPI.setNativeTheme).toHaveBeenCalledWith("light");
    });

    it("should apply dark theme correctly", () => {
      const store = useSettingStore();
      store.applyTheme("dark");

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "dark-mode"
      );
      expect(mockElectronAPI.setNativeTheme).toHaveBeenCalledWith("dark");
    });

    it("should set theme mode", async () => {
      const store = useSettingStore();
      await store.setThemeMode("dark");

      expect(store.themeMode).toBe("dark");
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "dark-mode"
      );
    });
  });

  describe("Font Size Management", () => {
    it("should apply small font size correctly", () => {
      const store = useSettingStore();
      store.applyFontSize("small");

      expect(
        mockDocument.documentElement.classList.remove
      ).toHaveBeenCalledWith("font-size-large");
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "font-size-small"
      );
    });

    it("should apply medium font size correctly", () => {
      const store = useSettingStore();
      store.applyFontSize("medium");

      expect(
        mockDocument.documentElement.classList.remove
      ).toHaveBeenCalledWith("font-size-small");
      expect(
        mockDocument.documentElement.classList.remove
      ).toHaveBeenCalledWith("font-size-large");
    });

    it("should apply large font size correctly", () => {
      const store = useSettingStore();
      store.applyFontSize("large");

      expect(
        mockDocument.documentElement.classList.remove
      ).toHaveBeenCalledWith("font-size-small");
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "font-size-large"
      );
    });

    it("should set font size", async () => {
      const store = useSettingStore();
      await store.setFontSize("large");

      expect(store.fontSize).toBe("large");
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "font-size-large"
      );
    });
  });

  describe("Week Start Management", () => {
    it("should get week start", () => {
      const store = useSettingStore();
      expect(store.getWeekStart()).toBe("0");
    });

    it("should set week start", async () => {
      const store = useSettingStore();
      await store.setWeekStart("1");

      expect(store.weekStart).toBe("1");
    });

    it("should toggle week start", async () => {
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
      const store = useSettingStore();
      await store.toggleSync();

      expect(store.synced).toBe(false);

      await store.toggleSync();
      expect(store.synced).toBe(true);
    });

    it("should set language", async () => {
      const store = useSettingStore();
      await store.setLanguage("en-US");

      expect(store.language).toBe("en-US");
    });

    it("should set icon style", async () => {
      const store = useSettingStore();
      await store.setIconStyle("modern");

      expect(store.iconStyle).toBe("modern");
    });

    it("should set notifications", async () => {
      const store = useSettingStore();
      await store.setNotifications(false);

      expect(store.notifications).toBe(false);
    });

    it("should set notification sound", async () => {
      const store = useSettingStore();
      await store.setNotificationSound(true);

      expect(store.notificationSound).toBe(true);
    });

    it("should set sound effect", async () => {
      const store = useSettingStore();
      await store.setSoundEffect(true);

      expect(store.soundEffect).toBe(true);
    });

    it("should set 24-hour format", async () => {
      const store = useSettingStore();
      await store.setHour24(true);

      expect(store.hour24).toBe(true);
    });

    it("should set show lunar", async () => {
      const store = useSettingStore();
      await store.setShowLunar(true);

      expect(store.showLunar).toBe(true);
    });
  });

  describe("UI State Management", () => {
    it("should toggle settings visibility", async () => {
      const store = useSettingStore();

      expect(store.showSettings).toBe(false);

      await store.toggleSettings();
      expect(store.showSettings).toBe(true);
      expect(mockElectronAPI.loadSettings).toHaveBeenCalledTimes(2); // 初始化和这里

      await store.toggleSettings();
      expect(store.showSettings).toBe(false);
    });

    it("should close settings", () => {
      const store = useSettingStore();
      store.showSettings = true;

      store.closeSettings();
      expect(store.showSettings).toBe(false);
    });
  });

  describe("Calendar Functions", () => {
    describe("getLunarDate", () => {
      it("should return correct lunar date for known dates", () => {
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
        const store = useSettingStore();
        const testDate = new Date(2023, 5, 15); // 2023年6月15日

        const days = store.getMonthDays(testDate);

        // 6月有30天，加上前后补全的天数
        expect(days.length).toBeGreaterThanOrEqual(35);
        expect(days.length).toBeLessThanOrEqual(42);

        // 检查当前月的天数
        const currentMonthDays = days.filter((d) => d.isCurrentMonth);
        expect(currentMonthDays.length).toBe(30);

        // 检查今天标记
        const today = new Date();
        const todayInDays = days.find(
          (d) => new Date(d.date).toDateString() === today.toDateString()
        );
        if (today.getMonth() === 5 && today.getFullYear() === 2023) {
          expect(todayInDays?.isToday).toBe(true);
        } else {
          expect(todayInDays?.isToday).toBe(false);
        }
      });

      it("should respect week start setting", () => {
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
        const store = useSettingStore();
        const testDate = new Date(2023, 5, 15); // 2023年6月15日（周四）

        const weekDays = store.getWeekDays(testDate);

        expect(weekDays.length).toBe(7);
        expect(weekDays[0].dayName).toBe("星期日");
        expect(weekDays[3].dayName).toBe("星期三");

        // 检查今天标记
        const today = new Date();
        const todayInWeek = weekDays.find(
          (d) => new Date(d.date).toDateString() === today.toDateString()
        );
        expect(todayInWeek?.isToday).toBe(
          today.getDate() === 15 &&
            today.getMonth() === 5 &&
            today.getFullYear() === 2023
        );
      });

      it("should respect week start setting", () => {
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
      expect(store.getLunarMonthDays(2023, 2)).toBe(29); // 2023年农历二月29天
      expect(store.getLunarMonthDays(2023, 3)).toBe(30); // 2023年农历三月30天
    });
  });
});
