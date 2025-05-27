import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

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
  synced: boolean; // 新增 synced 属性
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
    } catch (error) {
      console.error("Error saving settings via Electron API:", error);
    }
  }

  // 加载设置 - 修改为通过 Electron API 加载
  async function loadSettings() {
    console.log("LoadSettings called");
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
      } else {
        // 如果从 main process 返回的是空对象或 undefined，则可能需要应用一套默认值
        // 或者依赖 ref 的初始值。当前行为是依赖 ref 初始值。
        console.log(
          "No settings loaded from main process or settings were empty, using defaults."
        );
      }
    } catch (error) {
      console.error("Error loading settings via Electron API:", error);
      // 出错时，保持当前 ref 的默认值
    }
  }

  // =========================== END 本地存储所需代码 END =============================

  // 同步设置状态
  async function toggleSync() {
    synced.value = !synced.value;
  }

  // 设置主题
  async function setThemeMode(newTheme: string) {
    themeMode.value = newTheme;
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
  }

  // 初始加载
  console.log("resetting store initialized, loading settings...");
  loadSettings();

  // 控制设置弹窗显示状态
  const showSettings = ref(false);

  // 切换设置弹窗显示/隐藏
  async function toggleSettings() {
    showSettings.value = !showSettings.value;

    // 如果打开设置，确保已加载最新设置
    if (showSettings.value) {
      await loadSettings();
    }
  }

  // 关闭设置弹窗
  function closeSettings() {
    showSettings.value = false;
  }

  // setter
  async function setFontSize(value: string) {
    fontSize.value = value;
  }
  async function setIconStyle(value: string) {
    iconStyle.value = value;
  }
  async function setNotifications(value: boolean) {
    notifications.value = value;
  }
  async function setNotificationSound(value: boolean) {
    notificationSound.value = value;
  }
  async function setSoundEffect(value: boolean) {
    soundEffect.value = value;
  }
  async function setHour24(value: boolean) {
    hour24.value = value;
  }
  async function setShowLunar(value: boolean) {
    showLunar.value = value;
  }
  async function setWeekStart(value: string) {
    weekStart.value = value;
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
    saveSettings, // 暴露新的 saveSettings
    loadSettings, // 暴露新的 loadSettings
    resetSettings,
    toggleSettings,
    closeSettings,
    setFontSize,
    setIconStyle,
    setNotifications,
    setNotificationSound,
    setSoundEffect,
    setHour24,
    setShowLunar,
    setWeekStart,
  };
});
