/**
 * @file ui/index.ts
 * @description UI 状态管理主模块，基于 Pinia 实现，负责日历主界面所有核心状态、页面模块和交互逻辑的统一管理。
 * 
 * 为什么这样做：
 * - 通过 defineStore 统一管理当前视图、日期、侧边栏、拖拽、搜索等核心 UI 状态，保证页面响应式和组件间同步。
 * - 按模块拆分（页面、头部、月/周/日视图、待办、侧边栏视图/分类），提升代码可维护性和扩展性，便于团队协作。
 * - 采用共享上下文 storeContext，模块间可复用核心状态和方法，减少重复代码，提升耦合度和灵活性。
 * - 所有基础功能（如侧边栏切换、模式切换、拖拽处理等）集中管理，便于统一调试和行为追踪。
 * - 通过解构模块方法，统一对外暴露接口，方便页面和组件直接调用，提升开发效率。
 * - 导出类型，保证类型安全和 IDE 智能提示，减少运行时错误。
 */

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
