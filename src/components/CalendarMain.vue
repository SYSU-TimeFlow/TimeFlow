<!-- filepath: d:\Code\TimeFlow\src\components\CalendarMain.vue -->
<!-- 
 @component CalendarMain.vue
 @description: 主日历组件，负责展示月、周、日视图以及相关的事件。 
-->

<template>
  <!-- 主日历区域容器 -->
  <main class="calendar-main flex-1 flex flex-col overflow-hidden">
    <!-- 月视图容器 -->
    <div
      v-if="uiStore.currentView === 'month'"
      class="calendar-grid flex-1 overflow-auto p-6"
    >
      <!-- 星期头部 -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in uiStore.weekDays"
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
            day.isCurrentMonth ? 'bg-white' : 'bg-gray-200', // 修改这里
            day.isToday ? 'today' : '', // 如果是今天，添加 'today' 类
            day.isWeekend ? 'weekend' : '', // 如果是周末，添加 'weekend' 类
          ]"
          @click="uiStore.handleDayClick(day, true)"
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
          </div>
          <!-- 当天事件列表容器 -->
          <div
            class="day-events mt-1 space-y-1 h-[130px] overflow-y-auto custom-scrollbar"
          >
            <!-- 单个事件项 -->
            <div
              v-for="event in eventStore.getEventsForDay(day.date)"
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
                {{
                  event.allDay ? "All day" : eventStore.formatEventTime(event)
                }}
              </div>
              <!-- 事件标题 -->
              <div
                class="event-title font-medium truncate"
                :style="{
                  color: uiStore.getContrastColor(event.categoryColor),
                }"
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
      class="week-view flex-1 overflow-hidden p-4"
    >
      <!-- 周视图网格布局 -->
      <div class="grid grid-cols-1 h-full border border-gray-200">
        <!-- 周视图头部，显示本周7天 -->
        <div class="grid grid-cols-[80px_repeat(7,1fr)]">
          <!-- 左侧空白，用于对齐时间轴 -->
          <div class="bg-white"></div>
          <!-- 渲染每一天的表头（星期几和日期） -->
          <div
            v-for="(day, idx) in uiStore.weekViewDays"
            :key="idx"
            class="day-header flex flex-col items-center justify-center p-2 border-b border-gray-200 bg-white"
          >
            <div class="text-sm font-medium">{{ day.dayName }}</div>
            <div
              class="text-lg rounded-full w-8 h-8 flex items-center justify-center"
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
                class="hour-cell h-16 border-b border-r border-gray-200 relative hover:!bg-gray-50 cursor-pointer select-none"
                style="z-index: 1"
                @click="uiStore.handleHourClick(day.date, hour - 1)"
                @dragover.prevent
                @drop="uiStore.handleDrop($event, { ...day, hour: hour - 1 })"
              ></div>
            </div>
            <!-- 事件渲染区域 -->
            <div
              v-for="(day, idx) in uiStore.weekViewDays"
              :key="idx"
              class="absolute left-0 top-0 h-full"
              :style="{
                width: `calc(100% / 7)`,
                left: `calc(${(100 * idx) / 7}% )`,
              }"
            >
              <!-- 单个事件项 -->
              <div
                v-for="event in eventStore.getEventsForDay(day.date)"
                :key="event.id"
                class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer"
                :style="{
                  top: `${uiStore.calculateEventTop(event)}px`,
                  height: `${uiStore.calculateEventHeight(event)}px`,
                  left: '4px',
                  right: '4px',
                  backgroundColor: event.categoryColor + '33',
                  borderLeft: `3px solid ${event.categoryColor}`,
                  zIndex: 10,
                }"
                @click.stop="eventStore.openEventDetails(event)"
                draggable="true"
                @dragstart="uiStore.handleDragStart($event, event)"
              >
                <div
                  class="event-time text-xs font-medium"
                  :style="{ color: event.categoryColor }"
                >
                  {{ eventStore.formatEventTime(event) }}
                </div>
                <div
                  class="event-title text-sm font-medium truncate"
                  :style="{
                    color: uiStore.getContrastColor(event.categoryColor),
                  }"
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
      class="day-view flex-1 overflow-hidden p-4"
    >
      <!-- 日视图网格布局 -->
      <div class="grid grid-cols-1 h-full border border-gray-200">
        <!-- 日视图头部，显示当前日期标题 -->
        <div
          class="day-header text-center p-4 border-b border-gray-200 bg-white"
        >
          <!-- 日视图不再显示今天的时间和日期 -->
          <!-- <div class="text-2xl font-semibold">{{ uiStore.dayViewTitle }}</div> -->
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
                @dragover.prevent
                @drop="
                  uiStore.handleDrop($event, {
                    date: uiStore.currentDate,
                    hour: hour - 1,
                  })
                "
              ></div>
            </div>
            <!-- 事件渲染区域 -->
            <div class="events absolute top-0 left-0 right-0">
              <!-- 单个事件项 -->
              <div
                v-for="event in eventStore.getEventsForDay(uiStore.currentDate)"
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
                draggable="true"
                @dragstart="uiStore.handleDragStart($event, event)"
              >
                <div
                  class="event-time text-xs font-medium"
                  :style="{ color: event.categoryColor }"
                >
                  {{ eventStore.formatEventTime(event) }}
                </div>
                <div
                  class="event-title text-sm font-medium truncate"
                  :style="{
                    color: uiStore.getContrastColor(event.categoryColor),
                  }"
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
import { useUiStore } from "../stores/ui";
import { useEventStore } from "../stores/event";

// 使用 Pinia 仓库
const uiStore = useUiStore();
const eventStore = useEventStore();
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

/* 周/日视图中小时单元格鼠标悬停时的背景色 */
.hour-cell:hover {
  background-color: #f9fafb; /* 淡灰色背景 */
}

/* 调整周视图和日视图中的时间标签垂直对齐 */
.week-view .time-label,
.day-view .time-label {
  transform: translateY(8px); /* 替换原来的 -translate-y-3，向下移动时间标签 */
}

/* 为月视图保留紧凑布局 */
.calendar-grid {
  height: calc(100vh - 140px) !important;
  overflow: hidden;
}

/* 周视图和日视图布局优化 */
.week-view,
.day-view {
  height: calc(100vh - 140px) !important;
  overflow: hidden;
}

/* 优化日历标题显示 */
.calendar-header h2 {
  max-width: 300px; /* 限制最大宽度 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1.25rem; /* 稍微减小字体大小 */
}

/* 确保周视图的标题格式正确 */
.calendar-header {
  padding: 1rem 1.5rem !important; /* 减小内边距，腾出更多空间 */
}

/* 月视图日期格子保持紧凑 */
.calendar-day {
  height: auto !important;
  min-height: 120px;
  max-height: 180px; /* 增加最大高度 */
}

/* 月视图事件容器保持紧凑 */
.day-events {
  height: auto !important;
  max-height: 130px; /* 增加事件容器高度 */
}

/* 周视图和日视图小时格子调整为适中高度 */
.week-view .hour-cell,
.day-view .hour-cell {
  height: 30px !important; /* 增加周/日视图小时格子高度 */
}

/* 周视图和日视图时间标签同步调整 */
.week-view .time-label,
.day-view .time-label {
  height: 30px !important; /* 匹配小时格子高度 */
}

/* 调整父容器内边距，为内容腾出更多空间 */
.week-view,
.day-view {
  padding: 4px !important; /* 减小内边距 */
}

/* 优化周/日视图头部，减小高度 */
.week-view .day-header,
.day-view .day-header {
  padding: 1px !important;
}
</style>
