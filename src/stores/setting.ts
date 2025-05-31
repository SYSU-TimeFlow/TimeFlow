import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  Settings,
  CalendarDay,
  WeekDay,
  lunarInfo,
  monthNames,
  dayNames,
  weekDays,
} from "../const";

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
  // 设置项 - 将由加载的设置初始化
  const themeMode = ref("light");
  const fontSize = ref("medium");
  const iconStyle = ref("default");
  const notifications = ref(true);
  const notificationSound = ref(false);
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
      hour24: hour24.value,
      showLunar: showLunar.value,
      weekStart: weekStart.value,
      language: language.value,
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
        hour24.value =
          typeof settings.hour24 === "boolean" ? settings.hour24 : false;
        showLunar.value =
          typeof settings.showLunar === "boolean" ? settings.showLunar : false;
        weekStart.value = settings.weekStart || "0";
        language.value = settings.language || "zh-CN";

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
    hour24.value = false;
    showLunar.value = false;
    weekStart.value = "0";
    language.value = "zh-CN";

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
    // 立即应用周起始日变更
    applyWeekStart(value);
  }

  /**
   * 应用周起始日设置
   * @param startDay 周起始日 ('0' 为周日, '1' 为周一)
   */
  function applyWeekStart(startDay: string) {
    // 更新 UI 相关的周起始日设置
    setWeekStart(startDay);
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

  /**
   * 获取农历日期
   * @param date 公历日期
   * @returns 农历日期对象，包含日期和月份信息
   */
  function getLunarDate(date: Date): { day: string; month?: string } {
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
        monthDays = getLunarMonthDays(lunarYear, lunarMonth);
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

    const result: { day: string; month?: string } = {
      day: dayNames[lunarDay - 1],
    };

    // 如果是初一，添加月份信息
    if (lunarDay === 1) {
      result.month = monthNames[lunarMonth - 1];
    }

    return result;
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
  function getLunarMonthDays(year: number, month: number): number {
    return lunarInfo[year - 1900] & (0x10000 >> month) ? 30 : 29;
  }

  /**
   * 获取月视图的日期数组
   * @param currentDate 当前日期
   * @returns 月视图的日期数组
   */
  function getMonthDays(currentDate: Date): CalendarDay[] {
    const startDay = parseInt(weekStart.value);

    // 获取当月第一天
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    // 获取当月最后一天
    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // 计算当月第一天是星期几（0-6）
    let firstDayOfWeek = firstDay.getDay();
    // 根据周起始日调整
    firstDayOfWeek = (firstDayOfWeek - startDay + 7) % 7;

    // 计算需要显示的上个月的天数
    const prevMonthDays = firstDayOfWeek;

    // 计算当月总天数
    const currentMonthDays = lastDay.getDate();

    // 计算需要显示的总天数（确保是7的倍数）
    const totalDays = Math.ceil((prevMonthDays + currentMonthDays) / 7) * 7;

    // 计算需要显示的下个月的天数
    const nextMonthDays = totalDays - prevMonthDays - currentMonthDays;

    const days: CalendarDay[] = [];

    // 添加上个月的日期
    const prevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        prevMonth.getDate() - i
      );
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    // 添加当月的日期
    for (let i = 1; i <= currentMonthDays; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        i
      );
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    // 添加下个月的日期
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        i
      );
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    return days;
  }

  /**
   * 获取周视图的日期数组
   * @param currentDate 当前日期
   * @returns 周视图的日期数组
   */
  function getWeekDays(currentDate: Date): WeekDay[] {
    const startDay = parseInt(weekStart.value);

    // 获取当前日期是星期几（0-6）
    let currentDayOfWeek = currentDate.getDay();
    // 根据周起始日调整
    currentDayOfWeek = (currentDayOfWeek - startDay + 7) % 7;

    // 计算本周的第一天
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

    // 生成一周的日期
    const weekDays: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);

      weekDays.push({
        date,
        dayNumber: date.getDate(),
        dayName: [
          "星期日",
          "星期一",
          "星期二",
          "星期三",
          "星期四",
          "星期五",
          "星期六",
        ][date.getDay()],
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }

    return weekDays;
  }

  /**
   * 获取星期几显示顺序
   * @returns 星期几显示顺序数组
   */
  function getWeekDayNames() {
    const startDay = parseInt(weekStart.value);
    return [...weekDays.slice(startDay), ...weekDays.slice(0, startDay)];
  }

  return {
    // 状态变量
    themeMode,
    fontSize,
    iconStyle,
    notifications,
    notificationSound,
    hour24,
    showLunar,
    weekStart,
    language,

    // 计算属性
    allSettings,

    // 设置操作方法
    setThemeMode,
    setLanguage,
    setFontSize,
    setIconStyle,
    setNotifications,
    setNotificationSound,
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

    // 农历相关
    getLunarDate,
    getLunarYearDays,
    getLeapMonth,
    getLeapMonthDays,
    getLunarMonthDays,

    // 日期视图相关
    getMonthDays,
    getWeekDays,
    getWeekDayNames,
  };
});
