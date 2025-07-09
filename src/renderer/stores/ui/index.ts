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

import { CalendarDay, WeekViewDay, Event } from "../../const";

export const useUiStore = defineStore("ui", () => {
  // 核心状态
  const currentView = ref("month");
  const currentDate = ref(new Date());
  const selectedDate = ref(new Date());
  const sidebarCollapsed = ref(false);
  const draggedEvent = ref<Event | null>(null);
  const appMode = ref<"normal" | "command" | "nlp">("normal");
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

  // 将 pageModule 的函数添加到 storeContext 中，供其他模块使用
  const extendedStoreContext = {
    ...storeContext,
    // 从 pageModule 中提取需要在其他模块中使用的函数
    openNewEventModal: pageModule.openNewEventModal,
    openEventDetails: pageModule.openEventDetails,
    openNewTodoModal: pageModule.openNewTodoModal,
    openEditTodoModal: pageModule.openEditTodoModal,
    openNewCategoryModal: pageModule.openNewCategoryModal,
    openCategoryDetails: pageModule.openCategoryDetails,
  };

  const headerModule = createHeaderModule(extendedStoreContext);
  const monthModule = createMonthModule(extendedStoreContext);
  const weekModule = createWeekModule(extendedStoreContext);
  const dayModule = createDayModule(extendedStoreContext);
  const todoModule = createTodoModule(extendedStoreContext);
  const viewModule = createViewModule(extendedStoreContext);
  const categoryModule = createCategoryModule(extendedStoreContext);

  // 基础功能
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setAppMode(mode: "normal" | "command" | "nlp") {
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
    ...viewModule,

    // 侧边栏分类模块
    ...categoryModule,
  };
});

// 导出类型
export type { CalendarDay, WeekViewDay };
