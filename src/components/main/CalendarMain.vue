<!-- 
 @component CalendarMain.vue
 @description: 主日历组件，负责展示月、周、日视图以及相关的事件。 
-->

<template>
  <!-- 主日历区域容器 -->
  <main
    class="calendar-main flex-1 flex flex-col overflow-auto custom-scrollbar"
  >
    <!-- 月视图 -->
    <MonthView v-if="uiStore.currentView === 'month'" />

    <!-- 周视图 -->
    <WeekView
      v-else-if="uiStore.currentView === 'week'"
      :current-time="currentTime"
    />

    <!-- 日视图 -->
    <DayView
      v-else-if="uiStore.currentView === 'day'"
      :current-time="currentTime"
    />

    <!-- 代办视图 -->
    <ToDoList v-if="uiStore.currentView === 'todo-list'" />
  </main>
</template>

<script setup lang="ts">
/**
 * @file CalendarMain.vue
 * @description 主日历组件，负责展示月、周、日视图以及相关的事件
 */
import { useUiStore } from "@/stores/ui";
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import MonthView from "@/components/main/MonthView.vue";
import WeekView from "@/components/main/WeekView.vue";
import DayView from "@/components/main/DayView.vue";
import ToDoList from "@/components/main/ToDoList.vue";

// 使用 Pinia 仓库
const uiStore = useUiStore();

// 用于强制更新时间线
const currentTime = ref(new Date());

// 设置定时器更新当前时间
let timer: number;
onMounted(() => {
  // 立即更新一次
  currentTime.value = new Date();

  timer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 10000); // 每10秒更新一次
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 监听currentTime的变化
watch(currentTime, () => {
  // 强制更新UI
  nextTick(() => {
    // 触发重新渲染
  });
});
</script>

<style scoped>
/* 主题颜色变量 */
.calendar-main {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
