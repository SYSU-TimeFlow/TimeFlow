import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { Settings } from "../const";

// 添加 electronAPI 的类型定义
// 没有运行时效果，只是告诉 TypeScript 这些属性的存在，是合法的
declare global {
  interface Window {
    electronAPI?: {
      saveSettings: (settings: any) => Promise<void>;
      loadSettings: () => Promise<any>;
      notify: (title: string, body: string) => void;
      minimize?: () => void;
      maximize?: () => void;
      close?: () => void;
    };
  }
}

export const useSettingStore = defineStore("setting", () => {
  // 系统同步状态 - 将由加载的设置初始化
  const synced = ref(true);

  // 设置项 - 将由加载的设置初始化
  const themeMode = ref("light");
  const fontSize = ref("medium");
  const iconStyle = ref("default");
  const notifications = ref(true);
  const notificationSound = ref(false);
  const soundEffect = ref(false);
  const hour24 = ref(false);
  const showLunar = ref(false);
  const weekStart = ref("0"); // 0 for Sunday, 1 for Monday
  const language = ref("zh-CN");

  // 所有设置的聚合对象
  const allSettings = computed(
    (): Settings => ({
      themeMode: themeMode.value,
      fontSize: fontSize.value,
      iconStyle: iconStyle.value,
      notifications: notifications.value,
      notificationSound: notificationSound.value,
      soundEffect: soundEffect.value,
      hour24: hour24.value,
      showLunar: showLunar.value,
      weekStart: weekStart.value,
      language: language.value,
      synced: synced.value,
    })
  );

  // ===========================BEGIN 本地存储所需代码 BEGIN=============================

  // 监听所有设置的变化，并在变化时保存
  watch(
    allSettings,
    async () => {
      await saveSettings();
    },
    { deep: true }
  );

  // 保存所有设置 - 修改为通过 Electron API 保存
  async function saveSettings() {
    try {
      // @ts-ignore
      await window.electronAPI.saveSettings(allSettings.value);
      // 应用主题设置
      applyTheme(themeMode.value);
      // 应用字号设置
      applyFontSize(fontSize.value);
    } catch (error) {
      console.error("Error saving settings via Electron API:", error);
    }
  }

  // 加载设置 - 修改为通过 Electron API 加载
  async function loadSettings() {
    // console.log("LoadSettings called");
    try {
      // @ts-ignore
      const settings = await window.electronAPI.loadSettings();

      if (settings && Object.keys(settings).length > 0) {
        themeMode.value = settings.themeMode || "light";
        fontSize.value = settings.fontSize || "medium";
        iconStyle.value = settings.iconStyle || "default";
        notifications.value =
          typeof settings.notifications === "boolean"
            ? settings.notifications
            : true;
        notificationSound.value =
          typeof settings.notificationSound === "boolean"
            ? settings.notificationSound
            : false;
        soundEffect.value =
          typeof settings.soundEffect === "boolean"
            ? settings.soundEffect
            : false;
        hour24.value =
          typeof settings.hour24 === "boolean" ? settings.hour24 : false;
        showLunar.value =
          typeof settings.showLunar === "boolean" ? settings.showLunar : false;
        weekStart.value = settings.weekStart || "0";
        language.value = settings.language || "zh-CN";
        synced.value =
          typeof settings.synced === "boolean" ? settings.synced : true;

        // 加载完设置后应用主题
        applyTheme(themeMode.value);
      } else {
        // 如果从 main process 返回的是空对象或 undefined，则可能需要应用一套默认值
        // 或者依赖 ref 的初始值。当前行为是依赖 ref 初始值。
        console.log(
          "No settings loaded from main process or settings were empty, using defaults."
        );
        // 应用默认主题
        applyTheme("light");
      }
    } catch (error) {
      console.error("Error loading settings via Electron API:", error);
      // 出错时，保持当前 ref 的默认值
      applyTheme("light");
    }
  }

  // =========================== END 本地存储所需代码 END =============================

  // =========================== BEGIN 主题管理代码 BEGIN ============================

  /**
   * 应用主题到DOM
   * @param theme 主题类型 ('light'|'dark')
   */
  function applyTheme(theme: string) {
    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark-mode");
    } else {
      html.classList.remove("dark-mode");
    }
  }

  // =========================== END 主题管理代码 END ==============================

  // 同步设置状态
  async function toggleSync() {
    synced.value = !synced.value;
  }

  // 设置主题
  async function setThemeMode(newTheme: string) {
    themeMode.value = newTheme;
    // 立即应用主题变更
    applyTheme(newTheme);
  }

  // 设置语言
  async function setLanguage(newLanguage: string) {
    language.value = newLanguage;
  }

  // 重置设置到默认值
  async function resetSettings() {
    themeMode.value = "light";
    fontSize.value = "medium";
    iconStyle.value = "default";
    notifications.value = true;
    notificationSound.value = false;
    soundEffect.value = false;
    hour24.value = false;
    showLunar.value = false;
    weekStart.value = "0";
    language.value = "zh-CN";
    synced.value = true; // 重置时 synced 也应为 true

    // 应用默认主题
    applyTheme("light");
  }

  // 初始加载
  // console.log("resetting store initialized, loading settings...");
  loadSettings();

  // 设置字号
  async function setFontSize(newFontSize: string) {
    fontSize.value = newFontSize;
    // 立即应用字号变更
    applyFontSize(newFontSize);
  }

  // 设置图标样式
  async function setIconStyle(value: string) {
    iconStyle.value = value;
  }

  // 设置通知
  async function setNotifications(value: boolean) {
    notifications.value = value;
  }

  // 设置通知声音
  async function setNotificationSound(value: boolean) {
    notificationSound.value = value;
  }

  // 设置音效
  async function setSoundEffect(value: boolean) {
    soundEffect.value = value;
  }

  // 设置24小时制
  async function setHour24(value: boolean) {
    hour24.value = value;
  }

  // 设置显示农历
  async function setShowLunar(value: boolean) {
    showLunar.value = value;
  }

  // 设置周起始日
  async function setWeekStart(value: string) {
    weekStart.value = value;
  }

  // 获取周起始日
  function getWeekStart(): string {
    return weekStart.value;
  }

  // 切换周起始日
  async function toggleWeekStart() {
    const newValue = weekStart.value === "0" ? "1" : "0";
    await setWeekStart(newValue);
  }

  /**
   * 应用字号到DOM
   * @param fontSize 字号大小 ('small'|'medium'|'large')
   */
  function applyFontSize(fontSize: string) {
    const html = document.documentElement;

    // 移除所有字号相关的类
    html.classList.remove("font-size-small", "font-size-large");

    // 根据设置添加对应的类
    if (fontSize === "small") {
      html.classList.add("font-size-small");
    } else if (fontSize === "large") {
      html.classList.add("font-size-large");
    }
    // medium 是默认值，不需要添加类
  }

  return {
    // 状态变量
    synced,
    themeMode,
    fontSize,
    iconStyle,
    notifications,
    notificationSound,
    soundEffect,
    hour24,
    showLunar,
    weekStart,
    language,

    // 计算属性
    allSettings,

    // 设置操作方法
    toggleSync,
    setThemeMode,
    setLanguage,
    setFontSize,
    setIconStyle,
    setNotifications,
    setNotificationSound,
    setSoundEffect,
    setHour24,
    setShowLunar,
    setWeekStart,
    getWeekStart,
    toggleWeekStart,

    // 本地存储相关
    saveSettings,
    loadSettings,
    resetSettings,

    // 主题和样式相关
    applyTheme,
    applyFontSize,
  };
});
