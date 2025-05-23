<!-- 
    * @file MiniCalendar.vue
    * @description 迷你日历组件，用于在侧边栏显示一个小日历，支持月份切换和日期选择。
    * 当侧边栏展开时，显示完整的月份和日期网格；折叠时，仅显示月份切换按钮。
 
 -->
<template>
  <!-- 迷你日历根元素 -->
  <div class="mini-calendar mx-4 my-3 bg-white rounded-lg shadow-sm p-3">
    <!-- 迷你日历头部，包含月份显示和切换按钮 -->
    <div :class="['flex items-center mb-2', uiStore.sidebarCollapsed ? 'justify-center' : 'justify-between']">
      <!-- 月份年份标题，仅在侧边栏未折叠时显示 -->
      <span v-if="!uiStore.sidebarCollapsed" class="text-sm font-medium">{{
        uiStore.miniCalendarTitle
      }}</span>
      <!-- 月份切换按钮容器 -->
      <div class="flex space-x-1">
        <!-- 上一个月按钮 -->
        <button
          @click="uiStore.prevMonth"
          class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-chevron-left text-xs"></i>
        </button>
        <!-- 下一个月按钮 -->
        <button
          @click="uiStore.nextMonth"
          class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-chevron-right text-xs"></i>
        </button>
      </div>
    </div>
    <!-- 日期网格，仅在侧边栏未折叠时显示 -->
    <div v-if="!uiStore.sidebarCollapsed" class="grid grid-cols-7 gap-1 text-center">
      <!-- 星期表头 -->
      <span
        v-for="day in uiStore.weekDaysShort"
        :key="day"
        class="text-xs text-gray-500"
      >
        {{ day }}
      </span>
      <!-- 日期单元格 -->
      <div
        v-for="(day, index) in uiStore.miniCalendarDays"
        :key="index"
        :class="[
          'mini-day text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer',
          day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400',
          day.isToday ? 'bg-blue-100 text-blue-600 font-medium' : '',
          day.isSelected ? 'bg-blue-600 text-white' : '',
        ]"
        @click="uiStore.selectDate(day.date)"
      >
        {{ day.dayNumber }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../stores/ui';

// 使用Pinia仓库
const uiStore = useUiStore();
</script>