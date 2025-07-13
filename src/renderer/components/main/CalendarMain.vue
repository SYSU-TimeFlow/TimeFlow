<!-- 
 @component CalendarMain.vue
 @description: 主日历组件，负责展示月、周、日视图以及协调各个子视图的显示和数据更新函数。 
-->

<template>
  <main
    class="calendar-main flex-1 flex flex-col overflow-auto custom-scrollbar"
  >
    <MonthView v-if="uiStore.currentView === 'month'" />

    <WeekView
      v-else-if="uiStore.currentView === 'week'"
      :current-time="currentTime"
    />

    <DayView
      v-else-if="uiStore.currentView === 'day'"
      :current-time="currentTime"
    />

    <ToDoView v-if="uiStore.currentView === 'todo'" />
  </main>
</template>

<script setup lang="ts">
import { useUiStore } from "../../stores/ui";
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import MonthView from "../../components/main/MonthView.vue";
import WeekView from "../../components/main/WeekView.vue";
import DayView from "../../components/main/DayView.vue";
import ToDoView from "../../components/main/ToDoView.vue";

// 使用 Pinia 仓库
const uiStore = useUiStore();

// 用于强制更新时间线,设置定时器更新当前时间,每10秒更新一次
const currentTime = ref(new Date());
let timer: number;
onMounted(() => {
  currentTime.value = new Date();

  timer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 10000); 
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 监听currentTime的变化,强制更新UI,触发重新渲染
watch(currentTime, () => {
  nextTick(() => {
  });
});
</script>

<style scoped>
.calendar-main {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
