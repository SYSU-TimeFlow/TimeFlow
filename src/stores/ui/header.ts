import { computed } from "vue";
import { getStartOfWeek, getEndOfWeek } from "../../utils";
import { calendarViews } from "../../const";

export const createHeaderModule = (storeContext: any) => {
  const { currentView, currentDate, selectedDate } = storeContext;

  // 计算属性
  const weekDays = computed(() => [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ]);

  const weekDaysShort = computed(() => [
    "日",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
  ]);

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
    } else if (currentView.value === "todo-list") {
      return "";
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

  // 导航功能
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

  return {
    calendarViews,
    weekDays,
    weekDaysShort,
    calendarTitle,
    dayViewTitle,
    changeView,
    navigateCalendar,
    goToToday,
    selectDate,
  };
};
