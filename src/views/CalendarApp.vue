<!--
  @component: CalendarApp
  @description: App主界面，承载其他子页面。包括侧边栏、主日历视图（月、周、日）、事件创建/编辑模态框以及各种交互功能。
  @author: liaohr
  @modified: huzch
  @date: 2025-05-25
-->

<template>
  <!-- 主日历应用程序容器 - 改为固定屏幕大小 -->
  <div
    class="calendar-app h-screen w-screen bg-white text-gray-800 flex flex-col overflow-hidden"
    :style="{ fontSize: fontSize }"
    :class="themeClass"
  >
    <!-- 应用程序头部 -->
    <CalendarHeader class="flex-shrink-0" />
    <!-- 主内容区域，包含侧边栏和日历视图 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏组件 -->
      <Sidebar class="flex-shrink-0" />
      <!-- 主日历区域组件 -->
      <CalendarMain v-if="uiStore.currentView !== 'todo-list'" />
      <!-- Todo List 组件 -->
      <TodoList v-else />
    </div>
    <!-- 事件模态框组件 (用于创建/编辑事件) -->
    <EventModal />
    <!-- todo 模态框组件 -->
    <TodoModal />

    <!-- 分类模态框组件 (用于创建/编辑分类) -->
    <CategoryModal />
    <!-- 设置模态框，仅在showSettings为true时显示 -->
    <Setting />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue";
import Sidebar from "../components/Sidebar.vue";
import CalendarMain from "../components/CalendarMain.vue";
import TodoList from "../components/ToDoList.vue";
import EventModal from "../components/EventModal.vue";
import CategoryModal from "../components/CategoryModal.vue"; // 导入分类模态框组件
import TodoModal from "../components/TodoModal.vue"; // 导入待办事项模态框组件
import Setting from "../components/Setting.vue"; // 导入设置组件
import CalendarHeader from "../components/CalendarHeader.vue";
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";

// 使用UI仓库仅用于初始化
const uiStore = useUiStore();
const settingStore = useSettingStore();

// 计算字体大小
const fontSize = computed(() => {
  switch (settingStore.fontSize) {
    case "large":
      return "20px";
    case "medium":
      return "18px";
    case "small":
      return "16px";
    default:
      return "18px";
  }
});

// 计算主题类名
const themeClass = computed(() => {
  return settingStore.themeMode === "dark" ? "dark-theme" : "light-theme";
});

// 生命周期钩子
onMounted(() => {
  // 加载设置
  settingStore.loadSettings();

  // 组件挂载后，默认显示今天的日期
  uiStore.goToToday();
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

/* 调整各个元素的字体大小比例 */
:deep(.calendar-title) {
  font-size: 1.2em;
}

:deep(.nav-button) {
  font-size: 1em;
}

:deep(.view-button) {
  font-size: 0.9em;
}

:deep(.event-title) {
  font-size: 1em;
}

:deep(.event-time) {
  font-size: 0.9em;
}

:deep(.event-description) {
  font-size: 0.85em;
}

:deep(.time-label) {
  font-size: 0.85em;
}

:deep(.day-number) {
  font-size: 1.1em;
}

:deep(.week-day) {
  font-size: 1em;
}

/* 主题样式 */
.light-theme {
  color: #24292f;
}

.dark-theme {
  color: #c9d1d9;
}

/* 深色主题下的文本颜色 */
.dark-theme :deep(.text-gray-500),
.dark-theme :deep(.text-gray-700),
.dark-theme :deep(.text-gray-800),
.dark-theme :deep(.text-gray-400) {
  color: #8b949e;
}

/* 深色主题下的背景颜色 */
.dark-theme :deep(.bg-white) {
  background-color: #0d1117;
}

/* 深色主题下的边框颜色 */
.dark-theme :deep(.border-gray-200),
.dark-theme :deep(.border-gray-300) {
  border-color: #30363d;
}

/* 深色主题下的悬停效果 */
.dark-theme :deep(.hover\:bg-gray-100:hover) {
  background-color: #21262d !important;
}

/* 深色主题下的按钮颜色 */
.dark-theme :deep(.bg-blue-600) {
  background-color: #58a6ff;
}

.dark-theme :deep(.hover\:bg-blue-700:hover) {
  background-color: #79b8ff;
}

/* 深色主题下的文本颜色 */
.dark-theme :deep(.text-red-500) {
  color: #f85149;
}

.dark-theme :deep(.hover\:text-red-700:hover) {
  color: #da3633;
}
</style>
