import { defineStore } from "pinia";
import { ref, computed } from "vue";

// 添加接口定义
interface Settings {
  themeMode: string;
  fontSize: string;
  iconStyle: string;
  notifications: boolean;
  notificationSound: boolean;
  soundEffect: boolean;
  hour24: boolean;
  showLunar: boolean;
  weekStart: string;
  language: string;
}

export const useSettingStore = defineStore("setting", () => {
  // 系统同步状态
  const synced = ref(true);

  // 设置项
  const themeMode = ref("light");
  const fontSize = ref("medium");
  const iconStyle = ref("default");
  const notifications = ref(true);
  const notificationSound = ref(false);
  const soundEffect = ref(false);
  const hour24 = ref(false);
  const showLunar = ref(false);
  const weekStart = ref("0");
  const language = ref("zh-CN");

  // 所有设置的聚合对象
  const allSettings = computed(() => ({
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
  }));

  // 同步设置状态
  function toggleSync() {
    synced.value = !synced.value;
  }

  // 设置主题
  function setThemeMode(newTheme: string) {
    themeMode.value = newTheme;
    saveSettings();
  }

  // 设置语言
  function setLanguage(newLanguage: string) {
    language.value = newLanguage;
    saveSettings();
  }

  // 保存所有设置
  function saveSettings() {
    try {
      localStorage.setItem(
        "timeflow-settings",
        JSON.stringify({
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
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  }

  // 加载设置
  function loadSettings() {
    try {
      const savedSettings = localStorage.getItem("timeflow-settings");

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        // 更新状态，注意类型检查
        if (settings.themeMode) themeMode.value = settings.themeMode;
        if (settings.fontSize) fontSize.value = settings.fontSize;
        if (settings.iconStyle) iconStyle.value = settings.iconStyle;
        if (typeof settings.notifications === "boolean")
          notifications.value = settings.notifications;
        if (typeof settings.notificationSound === "boolean")
          notificationSound.value = settings.notificationSound;
        if (typeof settings.soundEffect === "boolean")
          soundEffect.value = settings.soundEffect;
        if (typeof settings.hour24 === "boolean")
          hour24.value = settings.hour24;
        if (typeof settings.showLunar === "boolean")
          showLunar.value = settings.showLunar;
        if (settings.weekStart !== undefined)
          weekStart.value = settings.weekStart;
        if (settings.language) language.value = settings.language;
        if (typeof settings.synced === "boolean")
          synced.value = settings.synced;
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error);
    }
  }

  // 重置设置到默认值
  function resetSettings() {
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

    saveSettings();
  }

  // 初始加载
  loadSettings();

  // 控制设置弹窗显示状态
  const showSettings = ref(false);

  // 切换设置弹窗显示/隐藏
  function toggleSettings() {
    showSettings.value = !showSettings.value;

    // 如果打开设置，确保已加载最新设置
    if (showSettings.value) {
      loadSettings();
    }
  }

  // 关闭设置弹窗
  function closeSettings() {
    showSettings.value = false;
  }

  return {
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
    allSettings,
    showSettings,
    toggleSync,
    setThemeMode,
    setLanguage,
    saveSettings,
    loadSettings,
    resetSettings,
    toggleSettings,
    closeSettings
  };
});
