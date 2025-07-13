<!--
  @file CalendarApp.vue
  @component 应用主界面
  @description 日历应用的主容器，负责承载所有核心子页面和全局交互组件，包括侧边栏、主日历视图、各类模态框、消息通知和欢迎界面等。
  为什么这样做：
  - 通过 flex 布局和固定屏幕大小，保证主界面自适应且无滚动条，提升视觉一致性和用户体验。
  - 所有核心子组件（侧边栏、头部、主视图、模态框等）集中挂载，便于统一管理和页面切换。
  - 生命周期钩子中初始化设置和日期，保证应用启动即为用户预期状态。
  - 日志和错误处理集成，便于行为追踪和问题排查，提升健壮性和可维护性。
  - 全局样式和容器样式统一，防止页面出现滚动条，保证多端兼容和美观。
  - 组件结构清晰，便于团队协作和后续功能扩展。
-->

<template>
  <!-- 主日历应用程序容器 - 改为固定屏幕大小 -->
  <div
    class="calendar-app h-screen w-screen text-gray-800 flex flex-col overflow-hidden"
  >
    <!-- 应用程序头部 -->
    <CalendarHeader class="flex-shrink-0" />
    <!-- 主内容区域，包含侧边栏和日历视图 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏组件 -->
      <Sidebar class="flex-shrink-0" />
      <!-- 主日历区域组件 -->
      <CalendarMain />
    </div>
    <!-- 事件模态框组件 (用于创建/编辑事件) -->
    <EventPage />
    <!-- todo 模态框组件 -->
    <ToDoPage />
    <!-- 添加帮助模态框 -->
    <HelpPage />
    <!-- 分类模态框组件 (用于创建/编辑分类) -->
    <CategoryPage />
    <!-- 设置模态框，仅在showSettings为true时显示 -->
    <SettingPage />
    <!-- 消息模态框组件 (用于显示应用内消息和通知) -->
    <MessagePage />
    <!-- 欢迎界面组件 -->
    <WelcomePage />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import Sidebar from "../components/sidebar/Sidebar.vue";
import CalendarMain from "../components/main/CalendarMain.vue";
import CalendarHeader from "../components/CalendarHeader.vue";
import EventPage from "../components/pages/EventPage.vue";
import ToDoPage from "../components/pages/ToDoPage.vue";
import CategoryPage from "../components/pages/CategoryPage.vue";
import SettingPage from "../components/pages/SettingPage.vue";
import HelpPage from "../components/pages/HelpPage.vue";
import MessagePage from "../components/pages/MessagePage.vue";
import WelcomePage from "../components/pages/WelcomePage.vue";
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";
import { useLogger, useErrorHandler } from "../utils/useLogger.js";

// 使用UI仓库仅用于初始化
const uiStore = useUiStore();
const settingStore = useSettingStore();

// 使用日志系统
const { logUserAction, logInfo, logError, createAsyncTracker, startTimer } =
  useLogger("CalendarApp");

const { safeAsync } = useErrorHandler();

// 生命周期钩子
onMounted(async () => {
  logInfo("CalendarApp mounted, initializing application");

  const initTimer = startTimer("app_initialization");

  try {
    // 安全地加载设置
    await safeAsync(() => settingStore.loadSettings(), {
      errorMessage: "Failed to load settings",
      componentName: "CalendarApp",
      onSuccess: () => logInfo("Settings loaded successfully"),
      onError: (error) => logError("Settings loading failed", error),
    });

    // 组件挂载后，默认显示今天的日期
    uiStore.goToToday();
    logUserAction("navigate_to_today", { source: "app_initialization" });

    logInfo("CalendarApp initialization completed successfully");
  } catch (error) {
    logError("CalendarApp initialization failed", error);
  } finally {
    initTimer(); // 停止计时器
  }
});
</script>

<style scoped>
.calendar-app {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  /* 防止页面出现滚动条 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 确保body和html也不会出现滚动条 */
:global(body),
:global(html) {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
