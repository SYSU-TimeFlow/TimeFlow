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
  global.window = {
    electronAPI: {
      // 模拟加载设置的loadSettings方法
      loadSettings: vi.fn(async () => {
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
        }
      }),
      // 模拟保存设置的saveSettings方法
      saveSettings: vi.fn(async () => {
        console.log("\x1b[34m%s\x1b[0m", "Mock saveSetting called");
      }),
    }
  } as any;

  setActivePinia(createPinia());
});
