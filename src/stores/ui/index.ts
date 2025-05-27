import { defineStore } from "pinia";
import { ref } from "vue";

// 导入各模块
import { createPageModule } from "./page";
import { createHeaderModule } from "./header";
import { createMonthModule } from "./main/month";
import { createWeekModule } from "./main/week";
import { createDayModule } from "./main/day";
import { createTodoModule } from "./main/todo";
import { createViewModule } from "./sidebar/view";
import { createCategoryModule } from "./sidebar/category";

// 导入工具函数
import { 
  formatHour, 
  getStartOfWeek, 
  getEndOfWeek, 
  getContrastColor,
  calculateEventTop,
  calculateEventHeight
} from "../../utils";

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
  // 核心状态
  const currentView = ref("month");
  const currentDate = ref(new Date());
  const selectedDate = ref(new Date());
  const sidebarCollapsed = ref(false);
  const draggedEvent = ref(null);
  const appMode = ref<"normal" | "command">("normal");
  const isSearchActive = ref(false);

  // 创建共享上下文
  const storeContext = {
    currentView,
    currentDate,
    selectedDate,
    sidebarCollapsed,
    draggedEvent,
    appMode,
    isSearchActive,
  };

  // 初始化各模块
  const pageModule = createPageModule(storeContext);
  const headerModule = createHeaderModule(storeContext);
  const monthModule = createMonthModule(storeContext);
  const weekModule = createWeekModule(storeContext);
  const dayModule = createDayModule(storeContext);
  const todoModule = createTodoModule(storeContext);
  const sidebarViewModule = createViewModule(storeContext);
  const sidebarCategoryModule = createCategoryModule(storeContext);

  // 基础功能
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setAppMode(mode: "normal" | "command") {
    appMode.value = mode;
  }

  function toggleSearchActive(active: boolean) {
    isSearchActive.value = active;
  }

  function handleDragStart(event: DragEvent, calendarEvent: any) {
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", calendarEvent.id.toString());
      draggedEvent.value = calendarEvent;
    }
  }

  // 统一对外接口
  return {
    // 核心状态
    currentView,
    currentDate,
    selectedDate,
    sidebarCollapsed,
    draggedEvent,
    appMode,
    isSearchActive,

    // 基础功能
    toggleSidebar,
    setAppMode,
    toggleSearchActive,
    handleDragStart,

    // 工具函数
    formatHour,
    getStartOfWeek,
    getEndOfWeek,
    getContrastColor,
    calculateEventTop,
    calculateEventHeight,

    // 页面模块
    ...pageModule,

    // 头部模块
    ...headerModule,

    // 月视图模块
    ...monthModule,

    // 周视图模块
    ...weekModule,

    // 日视图模块
    ...dayModule,

    // 待办模块
    ...todoModule,

    // 侧边栏视图模块
    ...sidebarViewModule,

    // 侧边栏分类模块
    ...sidebarCategoryModule,
  };
});

// 导出类型
export type { CalendarDay, WeekViewDay };