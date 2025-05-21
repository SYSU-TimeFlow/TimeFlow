<!-- 
    * @file MiniCalendar.vue
    * @description 迷你日历组件，用于在侧边栏显示一个小日历，支持月份切换和日期选择。
    * 当侧边栏展开时，显示完整的月份和日期网格；折叠时，仅显示月份切换按钮。
 
 -->
<template>
  <!-- 迷你日历根元素 -->
  <div class="mini-calendar mx-4 my-3 bg-white rounded-lg shadow-sm p-3">
    <!-- 迷你日历头部，包含月份显示和切换按钮 -->
    <div class="flex justify-between items-center mb-2">
      <!-- 月份年份标题，仅在侧边栏未折叠时显示 -->
      <span v-if="!sidebarCollapsed" class="text-sm font-medium">{{
        miniCalendarTitle
      }}</span>
      <!-- 月份切换按钮容器 -->
      <div class="flex space-x-1">
        <!-- 上一个月按钮 -->
        <button
          @click="$emit('prev-month')"
          class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-chevron-left text-xs"></i>
        </button>
        <!-- 下一个月按钮 -->
        <button
          @click="$emit('next-month')"
          class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-chevron-right text-xs"></i>
        </button>
      </div>
    </div>
    <!-- 日期网格，仅在侧边栏未折叠时显示 -->
    <div v-if="!sidebarCollapsed" class="grid grid-cols-7 gap-1 text-center">
      <!-- 星期表头 -->
      <span
        v-for="day in weekDaysShort"
        :key="day"
        class="text-xs text-gray-500"
      >
        {{ day }}
      </span>
      <!-- 日期单元格 -->
      <div
        v-for="(day, index) in miniCalendarDays"
        :key="index"
        :class="[
          'mini-day text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer',
          day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400',
          day.isToday ? 'bg-blue-100 text-blue-600 font-medium' : '',
          day.isSelected ? 'bg-blue-600 text-white' : '',
        ]"
        @click="$emit('select-date', day.date)"
      >
        {{ day.dayNumber }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { defineProps, defineEmits } from "vue";

/**
 * @typedef {Object} MiniCalendarDay
 * @property {Date} date - 日期对象
 * @property {number} dayNumber - 月份中的日期数字
 * @property {boolean} isCurrentMonth - 是否属于当前显示的月份
 * @property {boolean} isToday - 是否是今天
 * @property {boolean} isSelected - 是否被选中
 */

const props = defineProps({
  miniCalendarDate: Date, // 迷你日历当前显示的月份的日期对象
  selectedDate: Date, // 当前主日历选中的日期对象
  miniCalendarDays: Array, // 构成迷你日历网格的日期数据数组
  sidebarCollapsed: Boolean, // 指示侧边栏是否已折叠
});

defineEmits([
  "prev-month", // 切换到上一个月的事件
  "next-month", // 切换到下一个月的事件
  "select-date", // 选择迷你日历中某个日期的事件, @type {Date} - 被选中的日期对象
]);

// 星期几的缩写，用于迷你日历表头
const weekDaysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * 计算属性：格式化迷你日历的标题（例如："July 2024"）
 * @returns {string} 格式化后的年月字符串
 */
const miniCalendarTitle = computed(() => {
  // 使用 Intl.DateTimeFormat API 来本地化日期格式
  return new Intl.DateTimeFormat("en-US", {
    // 可根据需要调整地区设置 'zh-CN'
    month: "long", // 月份显示为完整名称
    year: "numeric", // 年份显示为数字
  }).format(props.miniCalendarDate); // 格式化 props.miniCalendarDate
});
</script>
