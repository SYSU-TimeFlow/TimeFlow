<!-- filepath: d:\Code\TimeFlow\src\components\CalendarMain.vue -->
<!-- 
 @component CalendarMain.vue
 @description: 主日历组件，负责展示月、周、日视图以及相关的事件。 
-->

<template>
  <!-- 主日历区域容器 -->
  <main class="calendar-main flex-1 flex flex-col overflow-hidden">
    <!-- 日历头部区域，包含标题、导航按钮、搜索和过滤 -->
    <div class="calendar-header p-6 flex items-center justify-between">
      <!-- 左侧部分：标题和导航按钮 -->
      <div class="flex items-center">
        <h2 class="text-2xl font-semibold mr-4">{{ uiStore.calendarTitle }}</h2>
        <!-- 导航按钮组 -->
        <div class="navigation-buttons flex space-x-2">
          <!-- "今天"按钮 -->
          <button
            @click="uiStore.goToToday()"
            class="py-1 px-3 border border-gray-300 rounded-md text-sm hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            Today
          </button>
          <!-- "上一个"导航按钮 -->
          <button
            @click="uiStore.navigateCalendar('prev')"
            class="p-1 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <!-- "下一个"导航按钮 -->
          <button
            @click="uiStore.navigateCalendar('next')"
            class="p-1 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <!-- 右侧部分：搜索框和过滤按钮 -->
      <div class="flex items-center space-x-3">
        <!-- 事件搜索框 -->
        <div class="search-box relative">
          <input
            type="text"
            placeholder="Search events..."
            class="pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <i
            class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
          ></i>
        </div>
        <!-- 过滤按钮(未实现) -->
        <button
          @click=""
          class="p-2 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-filter text-gray-600"></i>
        </button>
      </div>
    </div>

    <!-- 月视图容器 -->
    <div
      v-if="uiStore.currentView === 'month'"
      class="calendar-grid flex-1 overflow-auto p-6"
    >
      <!-- 星期头部 -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-sm font-medium text-gray-500 pb-2 text-center"
        >
          {{ day }}
        </div>
      </div>
      <!-- 日期格子容器 -->
      <div class="grid grid-cols-7 grid-rows-6 gap-1 h-full">
        <!-- 单个日期格子 -->
        <div
          v-for="(day, index) in uiStore.calendarDays"
          :key="index"
          :class="[
            'calendar-day border border-gray-200 h-[180px] p-1 relative overflow-hidden',
            day.isCurrentMonth ? 'bg-white' : 'bg-gray-50', // 根据是否当前月份设置背景色
            day.isToday ? 'today' : '', // 如果是今天，添加 'today' 类
            day.isWeekend ? 'weekend' : '', // 如果是周末，添加 'weekend' 类
          ]"
          @click="uiStore.handleDayClick(day)"
          @dragover.prevent
          @drop="uiStore.handleDrop($event, day)"
        >
          <!-- 日期头部，包含日期数字和添加事件按钮 -->
          <div
            :class="[
              'day-header flex justify-between items-center p-1 rounded-t',
              day.isToday ? 'bg-blue-50' : '', // 今天日期头部特殊背景
            ]"
          >
            <span
              :class="[
                'day-number text-sm',
                day.isToday
                  ? 'text-blue-600 font-semibold' // 今天日期数字样式
                  : day.isCurrentMonth
                  ? 'text-gray-800' // 当前月份日期数字样式
                  : 'text-gray-400', // 非当前月份日期数字样式
              ]"
            >
              {{ day.dayNumber }}
            </span>
            <!-- 添加事件按钮，仅在当前月份日期显示 -->
            <button
              v-if="day.isCurrentMonth"
              class="add-event-day text-xs text-gray-400 hover:text-gray-600 cursor-pointer !rounded-button whitespace-nowrap"
              @click.stop="uiStore.handleDayClick(day, true)"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <!-- 当天事件列表容器 -->
          <div
            class="day-events mt-1 space-y-1 h-[130px] overflow-y-auto custom-scrollbar"
          >
            <!-- 单个事件项 -->
            <div
              v-for="event in getEventsForDay(day.date)"
              :key="event.id"
              :class="[
                'event-item text-xs p-1 rounded overflow-hidden cursor-pointer',
                event.allDay ? 'all-day-event' : '', // 全天事件特殊类
              ]"
              :style="{
                backgroundColor: event.categoryColor + '33', // 事件背景色，透明度33%
                borderLeft: `3px solid ${event.categoryColor}`, // 事件左边框颜色
              }"
              @click.stop="eventStore.openEventDetails(event)"
              draggable="true"
              @dragstart="uiStore.handleDragStart($event, event)"
            >
              <!-- 事件时间 -->
              <div
                class="event-time font-medium"
                :style="{ color: event.categoryColor }"
              >
                {{ event.allDay ? "All day" : eventStore.formatEventTime(event) }}
              </div>
              <!-- 事件标题 -->
              <div
                class="event-title font-medium truncate"
                :style="{ color: uiStore.getContrastColor(event.categoryColor) }"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 周视图容器 -->
    <div
      v-else-if="uiStore.currentView === 'week'"
      class="week-view flex-1 overflow-auto p-6"
    >
      <!-- 周视图网格布局 -->
      <div class="grid grid-cols-1 h-full border border-gray-200">
        <!-- 周视图头部，显示本周7天 -->
        <div class="grid grid-cols-8">
          <!-- 左侧空白，用于对齐时间轴 -->
          <div class="bg-white"></div>
          <!-- 渲染每一天的表头（星期几和日期） -->
          <div
            v-for="(day, idx) in uiStore.weekViewDays"
            :key="idx"
            class="day-header text-center p-2 border-b border-gray-200 bg-white"
          >
            <div class="text-sm font-medium">{{ day.dayName }}</div>
            <div
              class="text-lg rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              :class="{ 'bg-blue-600 text-white': day.isToday }"
            >
              {{ day.dayNumber }}
            </div>
          </div>
        </div>
        <!-- 周视图主体内容，包含时间标签和每天的事件列 -->
        <div class="flex h-full">
          <!-- 左侧时间标签列 -->
          <div class="time-labels border-r border-gray-200 pr-4 w-20">
            <!-- 渲染24小时的时间标签 -->
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-label h-16 text-xs text-gray-500 text-right -translate-y-3 flex items-start justify-end"
            >
              {{ uiStore.formatHour(hour - 1) }}
            </div>
          </div>
          <!-- 事件网格区：每一列代表一天 -->
          <div class="flex-1 grid grid-cols-7 relative">
            <!-- 小时格子背景 -->
            <div v-for="hour in 24" :key="hour" class="contents">
              <div
                v-for="(day, idx) in uiStore.weekViewDays"
                :key="idx"
                class="hour-cell h-16 border-b border-gray-200 relative hover:bg-gray-50"
                @click="uiStore.handleHourClick(day, hour-1)"
              ></div>
            </div>
            <!-- 事件渲染区域 -->
            <div
              v-for="(day, idx) in uiStore.weekViewDays"
              :key="idx"
              class="absolute left-0 top-0 h-full"
              :style="{ width: `calc(100% / 7)`, left: `calc(${100 * idx / 7}% )` }"
            >
              <!-- 单个事件项 -->
              <div
                v-for="event in getEventsForDay(day.date)"
                :key="event.id"
                class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer"
                :style="{
                  top: `${uiStore.calculateEventTop(event)}px`, // 计算事件的垂直位置
                  height: `${uiStore.calculateEventHeight(event)}px`, // 计算事件的高度
                  left: '4px',
                  right: '4px',
                  backgroundColor: event.categoryColor + '33',
                  borderLeft: `3px solid ${event.categoryColor}`,
                  zIndex: 10, // 保证事件渲染在网格之上
                }"
                @click.stop="eventStore.openEventDetails(event)"
              >
                <div
                  class="event-time text-xs font-medium"
                  :style="{ color: event.categoryColor }"
                >
                  {{ eventStore.formatEventTime(event) }}
                </div>
                <div
                  class="event-title text-sm font-medium truncate"
                  :style="{ color: uiStore.getContrastColor(event.categoryColor) }"
                >
                  {{ event.title }}
                </div>
                <div class="event-description text-xs truncate text-gray-600">
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- 日视图容器 -->
    <div
      v-else-if="uiStore.currentView === 'day'"
      class="day-view flex-1 overflow-auto p-6"
    >
      <!-- 日视图网格布局 -->
      <div class="grid grid-cols-1 h-full border border-gray-200">
        <!-- 日视图头部，显示当前日期标题 -->
        <div
          class="day-header text-center p-4 border-b border-gray-200 bg-white"
        >
          <div class="text-2xl font-semibold">{{ uiStore.dayViewTitle }}</div>
        </div>
        <!-- 日视图主体内容，包含时间标签和事件列 -->
        <div class="flex h-full">
          <!-- 左侧时间标签列 -->
          <div class="time-labels border-r border-gray-200 pr-4 w-20">
            <!-- 渲染24小时的时间标签 -->
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-label h-16 text-xs text-gray-500 text-right -translate-y-3 flex items-start justify-end"
            >
              {{ uiStore.formatHour(hour - 1) }}
            </div>
          </div>
          <!-- 事件显示列 -->
          <div class="day-column flex-1 relative">
            <!-- 小时格子背景 -->
            <div class="hours-grid">
              <div
                v-for="hour in 24"
                :key="hour"
                class="hour-cell h-16 border-b border-gray-200 relative"
                @click="uiStore.handleHourClick(uiStore.currentDate, hour - 1)"
              ></div>
            </div>
            <!-- 事件渲染区域 -->
            <div class="events absolute top-0 left-0 right-0">
              <!-- 单个事件项 -->
              <div
                v-for="event in getEventsForDay(uiStore.currentDate)"
                :key="event.id"
                class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer"
                :style="{
                  top: `${uiStore.calculateEventTop(event)}px`, // 计算事件的垂直位置
                  height: `${uiStore.calculateEventHeight(event)}px`, // 计算事件的高度
                  left: '4px',
                  right: '4px',
                  backgroundColor: event.categoryColor + '33',
                  borderLeft: `3px solid ${event.categoryColor}`,
                  zIndex: '10', // 确保事件在网格线上方
                }"
                @click.stop="eventStore.openEventDetails(event)"
              >
                <div
                  class="event-time text-xs font-medium"
                  :style="{ color: event.categoryColor }"
                >
                  {{ eventStore.formatEventTime(event) }}
                </div>
                <div
                  class="event-title text-sm font-medium truncate"
                  :style="{ color: uiStore.getContrastColor(event.categoryColor) }"
                >
                  {{ event.title }}
                </div>
                <div class="event-description text-xs truncate text-gray-600">
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * @file CalendarMain.vue
 * @description 主日历组件，负责展示月、周、日视图以及相关的事件
 */
import { useUiStore } from '../stores/ui';
import { useEventStore } from '../stores/event';

// 使用 Pinia 仓库
const uiStore = useUiStore();
const eventStore = useEventStore();

// 星期名称数组，用于月视图头部
const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * @function getEventsForDay
 * @description 获取指定日期的所有事件。
 * @param {Date} date - 需要获取事件的日期对象。
 * @returns {Array} - 过滤并排序后的事件数组。
 */
function getEventsForDay(date) {
  if (!date) return [];
  
  // 获取当前激活的分类ID数组
  const activeCategoryIds = getActiveCategoryIds();

  // 设置查询日期的开始和结束时间（00:00:00 到 23:59:59）
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  // 过滤事件：
  // 1. 事件开始时间在查询日期内
  // 2. 事件结束时间在查询日期内
  // 3. 事件跨越查询日期（事件开始于查询日期之前，结束于查询日期之后）
  const filteredEvents = eventStore.events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      // 先检查事件日期是否符合条件
      const dateMatches = (
        (eventStart >= start && eventStart <= end) || // 条件1
        (eventEnd >= start && eventEnd <= end) || // 条件2
        (eventStart <= start && eventEnd >= end) // 条件3
      ); 
      // 再检查事件分类是否被选中
      const categoryMatches = activeCategoryIds.length === 0 || 
                            activeCategoryIds.includes(event.categoryId);
      // 同时满足日期和分类两个条件
      return dateMatches && categoryMatches;
    })
    // 排序事件：首先按开始时间升序，如果开始时间相同，则按结束时间升序
    .sort((a, b) => {
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();
      if (aStart === bStart) {
        return new Date(a.end).getTime() - new Date(b.end).getTime();
      }
      return aStart - bStart;
    });

  return filteredEvents;
}

/**
 * @function getActiveCategoryIds
 * @description 获取当前所有激活状态的分类ID数组
 * @returns {Array<string|number>} 激活状态的分类ID数组
 */
function getActiveCategoryIds() {
  return eventStore.categories
    .filter(category => category.active)
    .map(category => category.id);
}
</script>

<style scoped>
/* "今天"日期单元格的特殊样式，顶部有一条蓝色高亮线 */
.today {
  position: relative;
}
.today::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #3b82f6; 
}

/* 日期单元格鼠标悬停时的背景色 */
.calendar-day:hover {
  background-color: #f9fafb; 
}

/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px; /* 滚动条宽度 */
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; /* 滚动条轨道透明 */
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db; /* 滚动条滑块颜色 */
  border-radius: 2px; /* 滚动条滑块圆角 */
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af; /* 滚动条滑块悬停颜色 */
}

/* 周/日视图中小时单元格鼠标悬停时的背景色 */
.hour-cell:hover {
  background-color: #f9fafb; /* 淡灰色背景 */
}
</style>