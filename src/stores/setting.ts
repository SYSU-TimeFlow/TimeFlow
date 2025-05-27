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
      // 设置系统状态栏颜色（Electron特性）
      setNativeTheme("dark");
    } else {
      html.classList.remove("dark-mode");
      setNativeTheme("light");
    }
  }

  /**
   * 切换系统原生主题（Electron窗口和状态栏）
   */
  const electronAPI = (window as any).electronAPI;
  function setNativeTheme(theme: "light" | "dark") {
    // 如果是Electron环境
    if (electronAPI && electronAPI.setNativeTheme) {
      // @ts-ignore
      electronAPI.setNativeTheme(theme);
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

  // 农历数据表
  const lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0,
    0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540,
    0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,
    0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0,
    0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
    0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573,
    0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4,
    0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5,
    0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
    0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
    0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50,
    0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0,
    0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260,
    0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,
    0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
    0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  ];

  /**
   * 获取农历日期
   * @param date 公历日期
   * @returns 农历日期字符串
   */
  function getLunarDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 计算与1900年1月31日相差的天数
    let offset =
      (Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000;

    // 用offset减去每农历年的天数，计算当前农历年份
    let lunarYear = 1900;
    let temp = 0;
    for (lunarYear = 1900; lunarYear < 2100 && offset > 0; lunarYear++) {
      temp = getLunarYearDays(lunarYear);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      lunarYear--;
    }

    // 计算农历月份
    let lunarMonth = 1;
    let isLeap = false;
    let yearDays = getLunarYearDays(lunarYear);
    let leapMonth = getLeapMonth(lunarYear);
    let monthDays = 0;

    for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
      // 闰月
      if (leapMonth > 0 && lunarMonth === leapMonth + 1 && !isLeap) {
        --lunarMonth;
        isLeap = true;
        monthDays = getLeapMonthDays(lunarYear);
      } else {
        monthDays = getMonthDays(lunarYear, lunarMonth);
      }

      if (isLeap && lunarMonth === leapMonth + 1) {
        isLeap = false;
      }
      offset -= monthDays;
    }

    if (offset === 0 && leapMonth > 0 && lunarMonth === leapMonth + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --lunarMonth;
      }
    }
    if (offset < 0) {
      offset += monthDays;
      --lunarMonth;
    }

    // 计算农历日期
    let lunarDay = offset + 1;

    // 农历日期名称
    const dayNames = [
      "初一",
      "初二",
      "初三",
      "初四",
      "初五",
      "初六",
      "初七",
      "初八",
      "初九",
      "初十",
      "十一",
      "十二",
      "十三",
      "十四",
      "十五",
      "十六",
      "十七",
      "十八",
      "十九",
      "二十",
      "廿一",
      "廿二",
      "廿三",
      "廿四",
      "廿五",
      "廿六",
      "廿七",
      "廿八",
      "廿九",
      "三十",
    ];

    return dayNames[lunarDay - 1];
  }

  /**
   * 获取农历年的总天数
   */
  function getLunarYearDays(year: number): number {
    let total = 0;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      total += lunarInfo[year - 1900] & i ? 30 : 29;
    }
    return total + getLeapMonthDays(year);
  }

  /**
   * 获取闰月的天数
   */
  function getLeapMonthDays(year: number): number {
    if (getLeapMonth(year)) {
      return lunarInfo[year - 1900] & 0x10000 ? 30 : 29;
    }
    return 0;
  }

  /**
   * 获取闰月月份
   */
  function getLeapMonth(year: number): number {
    return lunarInfo[year - 1900] & 0xf;
  }

  /**
   * 获取农历某月的总天数
   */
  function getMonthDays(year: number, month: number): number {
    return lunarInfo[year - 1900] & (0x10000 >> month) ? 30 : 29;
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
    closeSettings,
    setFontSize,
    setIconStyle,
    setNotifications,
    setNotificationSound,
    setSoundEffect,
    setHour24,
    setShowLunar,
    setWeekStart,
    applyTheme,
    applyFontSize,
    getLunarDate,
  };
});
