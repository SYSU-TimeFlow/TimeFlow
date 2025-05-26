import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useEventStore } from "./event";
import { useSettingStore } from "./setting";

// 添加类型定义
interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

interface WeekViewDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: any[];
}

export const useUiStore = defineStore("ui", () => {
  // 定义日历视图选项
  const calendarViews = [
    { id: "month", label: "月", icon: "fa-calendar-alt" },
    { id: "week", label: "周", icon: "fa-calendar-week" },
    { id: "day", label: "日", icon: "fa-calendar-day" },
    { id: "todo-list", label: "To-Do", icon: "fa-list-check" },
  ];

  // 日历状态管理
  const currentView = ref("month");
  const currentDate = ref(new Date());
  const selectedDate = ref(new Date());
  const sidebarCollapsed = ref(false);
  const draggedEvent = ref(null);
  const settingStore = useSettingStore();

  // 计算属性
  const weekDays = computed(() => {
    const days = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    const weekStart = parseInt(settingStore.weekStart);
    return [...days.slice(weekStart), ...days.slice(0, weekStart)];
  });

  // 主日历标题
  const calendarTitle = computed(() => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      year: "numeric",
    };
    if (currentView.value === "week") {
      return ` ${new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(getStartOfWeek(currentDate.value))} - ${new Intl.DateTimeFormat(
        "zh-CN",
        { month: "short", day: "numeric", year: "numeric" }
      ).format(getEndOfWeek(currentDate.value))}`;
    } else if (currentView.value === "day") {
      return new Intl.DateTimeFormat("zh-CN", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(currentDate.value);
    }
    return new Intl.DateTimeFormat("zh-CN", options).format(currentDate.value);
  });

  // 日视图标题
  const dayViewTitle = computed(() => {
    return new Intl.DateTimeFormat("zh-CN", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(currentDate.value);
  });

  // 月视图的日期格子数据
  const calendarDays = computed(() => {
    const days: CalendarDay[] = [];
    const monthStart = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + 1,
      0
    );
    const startDate = getStartOfWeek(monthStart);
    const endDate = getEndOfWeek(monthEnd);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const isCurrentMonth =
        currentDay.getMonth() === currentDate.value.getMonth();
      const isToday = currentDay.getTime() === today.getTime();
      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;

      days.push({
        date: new Date(currentDay),
        dayNumber: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        isWeekend,
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return days;
  });

  // 获取周视图日期数据
  const weekViewDays = computed(() => {
    const eventStore = useEventStore();
    const days: WeekViewDay[] = [];
    const weekStart = parseInt(settingStore.weekStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取当前日期所在周的起始日
    const startOfWeek = getStartOfWeek(currentDate.value);

    // 生成一周的日期
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const isToday = day.getTime() === today.getTime();
      days.push({
        date: new Date(day),
        dayName: weekDays.value[i],
        dayNumber: day.getDate(),
        isToday,
        events: eventStore.getEventsForDay(day),
      });
    }
    return days;
  });

  // 控制切换按钮显示状态
  const showToggleButton = ref(false);

  // 获取日视图的事件数据
  const dayViewEvents = computed(() => {
    const eventStore = useEventStore();
    return eventStore.getEventsForDay(currentDate.value);
  });

  // 添加应用模式相关状态
  const appMode = ref<"normal" | "command">("normal");
  const isSearchActive = ref(false);

  // 模式控制函数
  function setAppMode(mode: "normal" | "command") {
    appMode.value = mode;
  }

  function toggleSearchActive(active: boolean) {
    isSearchActive.value = active;
  }

  // 应用滚动控制函数
  function scrollApp(direction: "up" | "down") {
    // 首先检查是否有模态框打开
    const helpModalContent = showHelpModal.value
      ? document.querySelector(".help-modal .modal-body")
      : null;

    const eventStore = useEventStore();
    const eventModalContent = eventStore.showEventModal
      ? document.querySelector(".event-modal .modal-body")
      : null;

    // 如果任一模态框打开，优先滚动模态框内容
    if (helpModalContent || eventModalContent) {
      const modalToScroll = helpModalContent || eventModalContent;
      modalToScroll?.scrollBy({
        top: direction === "up" ? -200 : 200,
        behavior: "smooth",
      });
    } else {
      // 没有模态框打开，查找主内容元素
      const mainContent =
        document.querySelector(".main-content-area") ||
        document.querySelector("main");

      if (mainContent) {
        // 如果找到主内容区域，则滚动该元素
        mainContent.scrollBy({
          top: direction === "up" ? -500 : 500,
          behavior: "smooth",
        });
      } else {
        // 如果未找到主内容区域，退回到滚动整个窗口
        window.scrollBy({
          top: direction === "up" ? -500 : 500,
          behavior: "smooth",
        });
      }
    }
  }

  // 命令模式处理函数
  function executeCommand(commandText: string): boolean {
    // 去除前导冒号和多余空格
    const command = commandText.replace(/^:/, "").trim().toLowerCase();

    // 处理各种命令
    switch (command) {
      case "today":
        goToToday();
        return true;
      default:
        return false;
    }
  }

  // 辅助函数
  function getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const weekStart = parseInt(settingStore.weekStart);
    const currentDay = result.getDay();
    const diff = (currentDay - weekStart + 7) % 7;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  function getEndOfWeek(date: Date): Date {
    const result = new Date(date);
    const weekStart = parseInt(settingStore.weekStart);
    const currentDay = result.getDay();
    const diff = (7 - ((currentDay - weekStart + 7) % 7)) % 7;
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  function formatHour(hour: number): string {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "numeric",
      hour12: true,
    }).format(new Date(2025, 0, 1, hour));
  }

  function calculateEventTop(event: any): number {
    const start = new Date(event.start);
    return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64;
  }

  function calculateEventHeight(event: any): number {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(durationHours * 64, 24);
  }

  function getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  // 事件处理函数
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function changeView(view: string) {
    currentView.value = view;
  }

  function navigateCalendar(direction: "prev" | "next") {
    if (currentView.value === "month") {
      currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() + (direction === "next" ? 1 : -1),
        1
      );
    } else if (currentView.value === "week") {
      const newDate = new Date(currentDate.value);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      currentDate.value = newDate;
    } else if (currentView.value === "day") {
      const newDate = new Date(currentDate.value);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      currentDate.value = newDate;
    }
  }

  function goToToday() {
    currentDate.value = new Date();
    selectedDate.value = new Date();
  }

  function selectDate(date: Date) {
    selectedDate.value = new Date(date);
    currentDate.value = new Date(date);
  }

  function handleDayClick(day: any, isAddEvent = false) {
    const eventStore = useEventStore();

    if (day.isCurrentMonth) {
      currentDate.value = new Date(day.date);
      selectedDate.value = new Date(day.date);
      if (isAddEvent) {
        const startDate = new Date(day.date);
        startDate.setHours(9, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(10, 0, 0, 0);
        eventStore.openNewEventModal(startDate);
      }
    }
  }

  function handleHourClick(day: any, hour: number) {
    const eventStore = useEventStore();

    const date = new Date(day.date);
    date.setHours(hour, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(hour + 1, 0, 0, 0);
    eventStore.openNewEventModal(date);
  }

  function handleDragStart(event: DragEvent, calendarEvent: any) {
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", calendarEvent.id.toString());
      draggedEvent.value = calendarEvent;
    }
  }

  function handleDrop(event: DragEvent, day: any) {
    const eventStore = useEventStore();

    if (draggedEvent.value && event.dataTransfer) {
      const eventId = parseInt(event.dataTransfer.getData("text/plain"));
      const eventIndex = eventStore.events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        const originalEvent = eventStore.events[eventIndex];
        const originalStart = new Date(originalEvent.start);
        const originalEnd = new Date(originalEvent.end);
        const duration = originalEnd.getTime() - originalStart.getTime();

        const newStart = new Date(day.date);
        newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
        const newEnd = new Date(newStart.getTime() + duration);

        eventStore.events[eventIndex] = {
          ...originalEvent,
          start: newStart,
          end: newEnd,
        };
      }
    }
    draggedEvent.value = null;
  }

  // 添加更新起始星期的方法
  function updateWeekStart(weekStart: string) {
    // 重新计算当前视图的日期
    const currentDateCopy = new Date(currentDate.value);
    currentDate.value = currentDateCopy;
  }

  return {
    calendarViews,
    currentView,
    currentDate,
    selectedDate,
    sidebarCollapsed,
    draggedEvent,
    weekDays,
    calendarTitle,
    dayViewTitle,
    calendarDays,
    weekViewDays,
    dayViewEvents,
    showToggleButton,
    appMode,
    isSearchActive,
    handleGlobalKeydown,
    toggleSidebar,
    changeView,
    navigateCalendar,
    goToToday,
    selectDate,
    handleDayClick,
    handleHourClick,
    handleDragStart,
    handleDrop,
    setAppMode,
    toggleSearchActive,
    scrollApp,
    executeCommand,
    getStartOfWeek,
    getEndOfWeek,
    formatHour,
    calculateEventTop,
    calculateEventHeight,
    getContrastColor,
    updateWeekStart,
  };
});
