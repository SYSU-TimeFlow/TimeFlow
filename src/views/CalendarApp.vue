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
import { onMounted, ref } from "vue";
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
</style>
