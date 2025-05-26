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
  const weekStart = ref("0");

  // 在原有设置项下方添加临时设置对象
  const tempSettings = ref({
    themeMode: themeMode.value,
    fontSize: fontSize.value,
    iconStyle: iconStyle.value,
    notifications: notifications.value,
    notificationSound: notificationSound.value,
    soundEffect: soundEffect.value,
    hour24: hour24.value,
    showLunar: showLunar.value,
    weekStart: weekStart.value,
  });

  // 所有设置的聚合对象
  const allSettings = computed((): Settings => ({
    themeMode: themeMode.value,
    fontSize: fontSize.value,
    iconStyle: iconStyle.value,
    notifications: notifications.value,
    notificationSound: notificationSound.value,
    soundEffect: soundEffect.value,
    hour24: hour24.value,
    showLunar: showLunar.value,
    weekStart: weekStart.value,
  }));

  // 同步设置状态
  async function toggleSync() {
    synced.value = !synced.value;
    await saveSettings();
  }

  // 设置主题
  function setThemeMode(newTheme: string) {
    tempSettings.value.themeMode = newTheme;
  }

  // 保存所有设置 - 修改为通过 Electron API 保存
  async function saveSettings() {
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
          synced: synced.value,
        })
      );
    } catch (error) {
      console.error("Error saving settings via Electron API:", error);
    }
  }

  // 添加保存临时设置的方法
  function saveTempSettings() {
    themeMode.value = tempSettings.value.themeMode;
    fontSize.value = tempSettings.value.fontSize;
    iconStyle.value = tempSettings.value.iconStyle;
    notifications.value = tempSettings.value.notifications;
    notificationSound.value = tempSettings.value.notificationSound;
    soundEffect.value = tempSettings.value.soundEffect;
    hour24.value = tempSettings.value.hour24;
    showLunar.value = tempSettings.value.showLunar;
    weekStart.value = tempSettings.value.weekStart;
    saveSettings();
  }

  // 加载设置
  function loadSettings() {
    try {
      // @ts-ignore
      const settings = await window.electronAPI.loadSettings();

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
        if (typeof settings.synced === "boolean")
          synced.value = settings.synced;
      }
    } catch (error) {
      console.error("Error loading settings via Electron API:", error);
      // 出错时，保持当前 ref 的默认值
    }
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

    await saveSettings(); // 保存重置后的设置
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
    // 重置临时设置为当前正式设置的值
    tempSettings.value = {
      themeMode: themeMode.value,
      fontSize: fontSize.value,
      iconStyle: iconStyle.value,
      notifications: notifications.value,
      notificationSound: notificationSound.value,
      soundEffect: soundEffect.value,
      hour24: hour24.value,
      showLunar: showLunar.value,
      weekStart: weekStart.value,
    };
    showSettings.value = false;
  }

  // 格式化小时显示
  function formatHour(hour: number) {
    if (hour24.value) {
      return `${hour.toString().padStart(2, "0")}:00`;
    } else {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:00 ${period}`;
    }
  }

  // 格式化事件时间
  function formatEventTime(event: any) {
    // 检查事件对象是否包含start和end属性
    if (!event.start || !event.end) {
      return "";
    }

    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();

    if (hour24.value) {
      return `${startHour.toString().padStart(2, "0")}:${startMinute
        .toString()
        .padStart(2, "0")} - ${endHour.toString().padStart(2, "0")}:${endMinute
        .toString()
        .padStart(2, "0")}`;
    } else {
      const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      };
      return `${formatTime(startHour, startMinute)} - ${formatTime(
        endHour,
        endMinute
      )}`;
    }
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
    allSettings,
    showSettings,
    tempSettings,
    toggleSync,
    setThemeMode,
    saveSettings,
    loadSettings,
    resetSettings,
    toggleSettings,
    closeSettings,
    saveTempSettings,
    formatHour,
    formatEventTime,
  };
});
