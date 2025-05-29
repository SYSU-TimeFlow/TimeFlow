<!-- 
 @component CalendarMain.vue
 @description: 主日历组件，负责展示月、周、日视图以及相关的事件。 
-->

<template>
  <!-- 主日历区域容器 - 保留overflow-auto并增强滚动行为 -->
  <main
    class="calendar-main flex-1 flex flex-col overflow-auto custom-scrollbar"
  >
    <!-- 月视图容器 - 修改overflow-auto为overflow-visible，让父容器控制滚动 -->
    <div
      v-if="uiStore.currentView === 'month'"
      class="calendar-grid flex-1 overflow-visible p-6"
    >
      <!-- 星期头部 -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in getWeekDays"
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
          v-for="(day, index) in getMonthDays"
          :key="index"
          :class="[
            'calendar-day border border-gray-200 h-[180px] p-1 relative overflow-auto',
            day.isCurrentMonth ? 'bg-white' : 'bg-gray-200',
            day.isToday ? 'today' : '',
            day.isWeekend ? 'weekend' : '',
          ]"
          @click="uiStore.handleDayClick(day, true)"
          @dragover.prevent
          @drop="uiStore.handleDrop($event, day)"
        >
          <!-- 日期头部，包含日期数字和添加事件按钮 -->
          <div
            :class="[
              'day-header flex justify-between items-center p-1 rounded-t sticky top-0 z-10 bg-inherit',
              day.isToday ? 'bg-blue-50' : '',
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
            <!-- 添加农历显示 -->
            <span
              v-if="settingStore.showLunar"
              class="lunar-date text-xs"
              :class="{
                'lunar-month': settingStore.getLunarDate(new Date(day.date))
                  .month,
              }"
            >
              {{
                settingStore.getLunarDate(new Date(day.date)).month ||
                settingStore.getLunarDate(new Date(day.date)).day
              }}
            </span>
          </div>
          <!-- 当天事件列表容器 -->
          <div class="day-events mt-1 space-y-1 pb-2 custom-scrollbar">
            <!-- 单个事件项 -->
            <div
              v-for="event in eventStore.getEventsForDay(new Date(day.date))"
              :key="event.id"
              :class="[
                'event-item text-xs p-1 rounded overflow-hidden cursor-pointer',
                event.allDay ? 'all-day-event' : '', // 全天事件特殊类
                event.eventType === 'both' ? 'both-event' : '', // both类型事件特殊类
              ]"
              :style="{
                backgroundColor: event.categoryColor + '33', // 事件背景色，透明度33%
                borderLeft: `3px solid ${event.categoryColor}`, // 事件左边框颜色
              }"
              @click.stop="
                event.eventType === 'both'
                  ? eventStore.openEditTodoModal(event)
                  : eventStore.openEventDetails(event)
              "
              draggable="true"
              @dragstart="uiStore.handleDragStart($event, event)"
            >
              <!-- 事件时间 -->
              <div class="flex items-center">
                <!-- 自定义圆形复选框，仅点击时切换完成状态 -->
                <div
                  v-if="event.eventType === 'both'"
                  class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1"
                  :class="
                    event.completed
                      ? 'bg-indigo-500 border-indigo-600'
                      : 'border-gray-300'
                  "
                  @click.stop="eventStore.toggleTodo(event.id)"
                >
                  <i
                    v-if="event.completed"
                    class="fas fa-check text-white text-[9px]"
                  ></i>
                </div>
                <!-- 时间显示 -->
                <div
                  class="event-time font-medium"
                  :style="{
                    color: event.categoryColor,
                    textDecoration:
                      event.eventType === 'both' && event.completed
                        ? 'line-through'
                        : 'none',
                  }"
                >
                  {{
                    event.allDay
                      ? "All day"
                      : event.eventType === "both"
                      ? formatTime(new Date(event.end), settingStore.hour24)
                      : formatEventTime(event, settingStore.hour24)
                  }}
                </div>
              </div>
              <!-- 事件标题 -->
              <div
                class="event-title font-medium truncate"
                :style="{
                  color: getContrastColor(event.categoryColor),
                  textDecoration:
                    event.eventType === 'both' && event.completed
                      ? 'line-through'
                      : 'none',
                }"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 周视图容器 - 同样修改overflow设置 -->
    <div
      v-else-if="uiStore.currentView === 'week'"
      class="week-view flex-1 overflow-visible p-4"
    >
      <!-- 周视图网格布局 -->
      <div class="grid grid-cols-1 h-full border border-gray-200">
        <!-- 周视图头部，显示本周7天 -->
        <div class="grid grid-cols-[80px_repeat(7,1fr)]">
          <!-- 左侧空白，用于对齐时间轴 -->
          <div class="bg-white"></div>
          <!-- 渲染每一天的表头（星期几和日期） -->
          <div
            v-for="(day, idx) in getWeekViewDays"
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
              {{ formatHour(hour - 1, settingStore.hour24) }}
            </div>
          </div>
          <!-- 事件网格区：每一列代表一天 -->
          <div class="flex-1 grid grid-cols-7 gap-1 p-1 relative">
            <!-- 小时格子背景 -->
            <div v-for="hour in 24" :key="hour" class="contents">
              <div
                v-for="(day, idx) in getWeekViewDays"
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
              v-for="(day, idx) in getWeekViewDays"
              :key="idx"
              class="absolute left-0 top-0 h-full"
              :style="{
                width: `calc(100% / 7)`,
                left: `calc(${(100 * idx) / 7}% )`,
              }"
            >
              <!-- 单个事件项 -->
              <div
                v-for="event in eventStore.getEventsForDay(new Date(day.date))"
                :key="event.id"
                :class="[
                  'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer',
                  event.eventType === 'both' ? 'both-event-week' : '',
                ]"
                :style="{
                  top: `${calculateEventTop(event)}px`,
                  height: `${calculateEventHeight(event)}px`,
                  left: '4px',
                  right: '4px',
                  backgroundColor: event.categoryColor + '33',
                  borderLeft: `3px solid ${event.categoryColor}`,
                  zIndex: 10,
                }"
                @click.stop="
                  event.eventType === 'both'
                    ? eventStore.openEditTodoModal(event)
                    : eventStore.openEventDetails(event)
                "
                draggable="true"
                @dragstart="uiStore.handleDragStart($event, event)"
              >
                <div class="flex items-center w-full">
                  <!-- 自定义圆形复选框，仅点击时切换完成状态 -->
                  <div
                    v-if="event.eventType === 'both'"
                    class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1"
                    :class="
                      event.completed
                        ? 'bg-indigo-500 border-indigo-600'
                        : 'border-gray-300'
                    "
                    @click.stop="eventStore.toggleTodo(event.id)"
                  >
                    <i
                      v-if="event.completed"
                      class="fas fa-check text-white text-[9px]"
                    ></i>
                  </div>
                  <div
                    class="event-time text-xs font-medium"
                    :style="{
                      color: event.categoryColor,
                      textDecoration:
                        event.eventType === 'both' && event.completed
                          ? 'line-through'
                          : 'none',
                    }"
                  >
                    {{
                      event.allDay
                        ? "All day"
                        : event.eventType === "both"
                        ? formatTime(new Date(event.end), settingStore.hour24)
                        : formatEventTime(event, settingStore.hour24)
                    }}
                  </div>
                </div>
                <div
                  class="event-title text-sm font-medium truncate"
                  :style="{
                    color: getContrastColor(event.categoryColor),
                    textDecoration:
                      event.eventType === 'both' && event.completed
                        ? 'line-through'
                        : 'none',
                  }"
                >
                  {{ event.title }}
                </div>
                <div
                  v-if="event.description"
                  class="event-description text-xs truncate text-gray-600"
                  :style="{
                    textDecoration:
                      event.eventType === 'both' && event.completed
                        ? 'line-through'
                        : 'none',
                  }"
                >
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日视图容器 - 同样修改overflow设置 -->
    <div
      v-else-if="uiStore.currentView === 'day'"
      class="day-view flex-1 overflow-visible p-4"
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
              {{ formatHour(hour - 1, settingStore.hour24) }}
            </div>
          </div>
          <!-- 事件显示列 -->
          <div class="day-column flex-1 relative">
            <!-- 小时格子背景 -->
            <div class="hours-grid grid gap-1 p-1">
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
                v-for="event in eventStore.getEventsForDay(
                  new Date(uiStore.currentDate)
                )"
                :key="event.id"
                :class="[
                  'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer',
                  event.eventType === 'both' ? 'both-event-week' : '',
                ]"
                :style="{
                  top: `${calculateEventTop(event)}px`, // 计算事件的垂直位置
                  height: `${calculateEventHeight(event)}px`, // 计算事件的高度
                  left: '4px',
                  right: '4px',
                  backgroundColor: event.categoryColor + '33',
                  borderLeft: `3px solid ${event.categoryColor}`,
                  zIndex: '10', // 确保事件在网格线上方
                }"
                @click.stop="
                  event.eventType === 'both'
                    ? eventStore.openEditTodoModal(event)
                    : eventStore.openEventDetails(event)
                "
                draggable="true"
                @dragstart="uiStore.handleDragStart($event, event)"
              >
                <div class="flex items-center w-full">
                  <!-- 自定义圆形复选框，仅点击时切换完成状态 -->
                  <div
                    v-if="event.eventType === 'both'"
                    class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1"
                    :class="
                      event.completed
                        ? 'bg-indigo-500 border-indigo-600'
                        : 'border-gray-300'
                    "
                    @click.stop="eventStore.toggleTodo(event.id)"
                  >
                    <i
                      v-if="event.completed"
                      class="fas fa-check text-white text-[9px]"
                    ></i>
                  </div>
                  <div
                    class="event-time text-xs font-medium"
                    :style="{
                      color: event.categoryColor,
                      textDecoration:
                        event.eventType === 'both' && event.completed
                          ? 'line-through'
                          : 'none',
                    }"
                  >
                    {{
                      event.allDay
                        ? "All day"
                        : event.eventType === "both"
                        ? formatTime(new Date(event.end), settingStore.hour24)
                        : formatEventTime(event, settingStore.hour24)
                    }}
                  </div>
                </div>
                <div
                  class="event-title text-sm font-medium truncate"
                  :style="{
                    color: getContrastColor(event.categoryColor),
                    textDecoration:
                      event.eventType === 'both' && event.completed
                        ? 'line-through'
                        : 'none',
                  }"
                >
                  {{ event.title }}
                </div>
                <div
                  v-if="event.description"
                  class="event-description text-xs truncate text-gray-600"
                  :style="{
                    textDecoration:
                      event.eventType === 'both' && event.completed
                        ? 'line-through'
                        : 'none',
                  }"
                >
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
import { useSettingStore } from "../stores/setting";
import { computed } from "vue";
import {
  formatHour,
  formatTime,
  formatEventTime,
  calculateEventHeight,
  calculateEventTop,
  getContrastColor,
} from "../utils";

// 使用 Pinia 仓库
const uiStore = useUiStore();
const eventStore = useEventStore();
const settingStore = useSettingStore();

// 计算属性：根据周起始日获取星期几显示顺序
const getWeekDays = computed(() => {
  return settingStore.getWeekDayNames();
});

// 计算属性：根据周起始日获取月视图的日期顺序
const getMonthDays = computed(() => {
  return settingStore.getMonthDays(new Date(uiStore.currentDate));
});

// 计算属性：根据周起始日获取周视图的日期顺序
const getWeekViewDays = computed(() => {
  return settingStore.getWeekDays(new Date(uiStore.currentDate));
});
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
  min-height: 800px; /* 确保有足够的高度以便可以滚动 */
  overflow-y: visible;
}

/* 周视图和日视图布局优化 */
.week-view,
.day-view {
  min-height: 600px; /* 确保有足够的高度以便可以滚动 */
  overflow-y: visible;
}

/* 添加日历格子悬停效果 */
.calendar-day {
  transition: all 0.2s ease-in-out;
  border-width: 1px !important;
}

/* 日历格子悬停高亮效果 */
.calendar-day:hover {
  background-color: #f9fafb;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
  z-index: 5;
}

/* 月视图中的事件悬停效果 */
.event-item {
  transition: all 0.15s ease-in-out;
  position: relative;
  border-left-width: 3px;
}

.event-item:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  z-index: 15;
}

/* 事件选中效果 - 边框发光 */
.event-item:active {
  transform: translateY(0) scale(1);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* 周视图和日视图中的事件悬停效果 */
.day-event {
  transition: all 0.15s ease-in-out;
  border-left-width: 3px;
}

.day-event:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  z-index: 20 !important;
  border-left-width: 4px !important;
}

/* 确保事件悬停时日历格子高亮效果消失 */
.calendar-day:hover .event-item:hover {
  border-color: currentColor;
}

.week-view > div:first-child,
.day-view > div:first-child {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: visible; /* 保持内容溢出可见 */
}

/* 周/日视图小时格子悬停效果 */
.hour-cell {
  transition: background-color 0.15s ease;
  position: relative;
}

.hour-cell:hover {
  background-color: #f0f4ff !important;
}

.hour-cell:hover::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid #3b82f6;
  pointer-events: none;
  z-index: 2;
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
  max-height: 180px;
  overflow: auto;
  overflow-x: hidden; /* 只允许垂直滚动 */
  padding-bottom: 8px; /* 增加底部内边距，确保内容可完全滚动 */
}

/* 让日期头部固定在顶部，不随着滚动而消失 */
.calendar-day .day-header {
  position: sticky;
  top: 0;
  background-color: inherit;
  z-index: 10;
  margin-bottom: 4px; /* 增加标题和内容的间距 */
}

/* 确保事件列表能够正确展示 */
.day-events {
  height: auto;
  overflow: visible; /* 移除内层滚动，让外层容器控制滚动 */
}

/* 确保最后一个事件也有足够的底部空间 */
.day-events .event-item:last-child {
  margin-bottom: 4px;
}

/* 优化小型滚动条样式，适合紧凑空间 */
.calendar-day::-webkit-scrollbar {
  width: 4px; /* 格子内滚动条更窄 */
}

.calendar-day::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.calendar-day:hover::-webkit-scrollbar-thumb {
  background: #a0a0a0; /* 鼠标悬停时显示更明显的滚动条 */
}

/* 保持原有的自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

/* 主题颜色变量 */
.calendar-main {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.calendar-day {
  background-color: var(--bg-secondary);
  border-color: var(--border-color) !important;
}

.time-label {
  color: var(--text-tertiary);
}

/* 暗黑模式下的日期号优化 */
.dark-mode .day-number {
  color: var(--date-number-color);
  font-weight: 500;
}

/* 暗黑模式下的标题优化 */
.dark-mode .calendar-header h2,
.dark-mode .calendar-header h1 {
  color: var(--heading-color);
}

/* 今日日期高亮 */
.dark-mode .is-today {
  background-color: var(--calendar-today-bg);
}

/* 周末日期格子样式 */
.dark-mode .is-weekend {
  background-color: var(--calendar-weekend-bg);
}

/* 当月日期和非当月日期的区分 */
.dark-mode .calendar-day:not(.is-current-month) .day-number {
  color: var(--text-tertiary);
  opacity: 0.7;
}

/* 当前月份的日期格子 */
.dark-mode .calendar-day.is-current-month {
  background-color: var(--calendar-day-bg);
}

/* 暗黑模式下的小时格子悬停样式 */
.dark-mode .hour-cell:hover {
  background-color: var(--calendar-day-hover-bg) !important;
  border-color: #4a88e5 !important;
}

/* 暗黑模式下事件颜色调整 */
.dark-mode .event-item,
.dark-mode .day-event {
  /* 增加不透明度以提高可见度 */
  opacity: 0.9;
  /* 添加微弱的发光效果增强可见性 */
  box-shadow: 0 1px 5px rgba(255, 255, 255, 0.05);
}

.dark-mode .event-item:hover,
.dark-mode .day-event:hover {
  opacity: 1;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

/* 事件时间文本在暗黑模式下的调整 */
.dark-mode .event-time {
  font-weight: 600; /* 加粗时间显示 */
}

/* 覆盖日历格子悬停效果 */
.dark-mode .calendar-day:hover {
  background-color: var(
    --calendar-day-hover-bg
  ) !important; /* 使用变量控制颜色 */
  border-color: #4a88e5 !important; /* 使用深蓝色边框 */
  box-shadow: 0 0 0 1px rgba(74, 136, 229, 0.3);
}

/* 修改这些样式确保周视图和月视图的悬停效果一致 */
.dark-mode .hour-cell:hover {
  background-color: var(
    --calendar-day-hover-bg
  ) !important; /* 使用与calendar-day相同的变量 */
  border-color: #4a88e5 !important;
}

/* 高亮边框样式调整 */
.dark-mode .hour-cell:hover::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid #4a88e5;
  pointer-events: none;
  z-index: 2;
}

/* 暗黑模式下的事件文本颜色调整 */
.dark-mode .event-title {
  color: var(--event-title-color) !important; /* 使用新变量 */
}

.dark-mode .event-description {
  color: var(--event-description-color) !important; /* 使用新变量 */
}

.dark-mode .event-time {
  color: var(--event-time-color) !important; /* 使用新变量 */
  font-weight: 500; /* 稍微减轻字体粗细 */
}

/* 确保周视图下的小时格子悬停颜色更接近黑色背景 */
.dark-mode .hour-cell:hover {
  background-color: var(--hour-cell-hover) !important; /* 使用新变量 */
}

/* 确保样式优先级足够高以覆盖原有样式 */
.dark-mode .hour-cell:hover::after {
  border-color: #3b5998; /* 更柔和的边框颜色 */
}

/* 周视图和日视图格子样式统一与月视图 */
/* 为事件网格添加间隙 */
.week-view .flex-1.grid,
.day-view .hours-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem; /* 添加间隙，与月视图的 gap-1 一致 */
  padding: 0.25rem;
}

.day-view .hours-grid {
  grid-template-columns: 1fr; /* 日视图是单列 */
}

/* 修改小时格子样式，使其有完整边框和适当间距 */
.hour-cell {
  border: 1px solid var(--border-color, #e5e7eb) !important; /* 完整边框替代单边框 */
  border-radius: 0.25rem; /* 轻微圆角 */
  margin: 1px;
  transition: all 0.2s ease-in-out;
}

/* 移除原有的底部和右侧边框，使用新的完整边框 */
.week-view .hour-cell,
.day-view .hour-cell {
  border-bottom: none;
  border-right: none;
}

/* 统一悬停效果与月视图一致 */
.hour-cell:hover {
  background-color: #f9fafb !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
  z-index: 5;
}

/* 移除原有的边框高亮效果 */
.hour-cell:hover::after {
  display: none;
}

/* 暗黑模式下的样式统一 */
.dark-mode .hour-cell {
  border-color: var(--border-color, #374151) !important;
  background-color: var(--bg-secondary);
}

.dark-mode .hour-cell:hover {
  background-color: var(--calendar-day-hover-bg) !important;
  border-color: #4a88e5 !important;
  box-shadow: 0 0 0 1px rgba(74, 136, 229, 0.3);
}

/* 移除暗黑模式中的额外边框效果 */
.dark-mode .hour-cell:hover::after {
  display: none;
}

/* Both类型事件（待办任务）的特殊样式 */
.both-event {
  display: flex;
  flex-direction: column;
}

.both-event.event-item {
  cursor: pointer;
}

/* 已完成待办项的样式 */
.both-event .event-time.line-through,
.both-event .event-title.line-through {
  opacity: 0.7;
}

/* 复选框相关样式 */
.both-event input[type="checkbox"] {
  cursor: pointer;
}

/* 复选框悬停效果 */
.both-event input[type="checkbox"]:hover {
  transform: scale(1.2);
}

/* 周视图中both类型事件的特殊样式 */
.both-event-week {
  display: flex;
  flex-direction: column;
  /* 移除左侧内边距，保持与其他事件一致 */
}

/* 周视图中both事件的line-through样式 */
.both-event-week .event-time.line-through,
.both-event-week .event-title.line-through,
.both-event-week .event-description.line-through {
  opacity: 0.7;
}

/* 农历日期样式 */
.lunar-date {
  display: block;
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: var(--small-text-font-size);
}

/* 农历月份样式 */
.lunar-month {
  color: #388bfd !important; /* 亮色模式下的蓝色 */
  font-weight: 500;
}

/* 暗黑模式下的农历日期样式 */
.dark-mode .lunar-date {
  color: var(--text-tertiary);
}

.dark-mode .lunar-month {
  color: #58a6ff !important; /* 暗黑模式下的蓝色 */
}

/* 修改字号相关的样式 */
.day-number {
  font-size: var(--base-font-size);
}

.event-title {
  font-size: var(--base-font-size);
}

.event-time {
  font-size: var(--small-text-font-size);
}

.event-description {
  font-size: var(--small-text-font-size);
}

.time-label {
  font-size: var(--small-text-font-size);
}

/* 月/周/日视图自定义复选框悬停效果，和ToDoList一致 */
.event-item .w-3.h-3:hover,
.day-event .w-3.h-3:hover,
.both-event-week .w-3.h-3:hover {
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2);
  border-color: #818cf8;
}
.event-item .w-3.h-3.bg-indigo-500:hover,
.day-event .w-3.h-3.bg-indigo-500:hover,
.both-event-week .w-3.h-3.bg-indigo-500:hover {
  border-color: #6366f1;
}
.event-item .w-3.h-3,
.day-event .w-3.h-3,
.both-event-week .w-3.h-3 {
  border-color: #a3a3a3;
}
.event-item .w-3.h-3:not(.bg-indigo-500),
.day-event .w-3.h-3:not(.bg-indigo-500),
.both-event-week .w-3.h-3:not(.bg-indigo-500) {
  background-color: #fff;
}

/* 去除周视图和日视图左侧时间轴与顶部表头的白色边框 */
.week-view .time-labels,
.day-view .time-labels {
  border-right: none !important;
  background: transparent !important;
}

.week-view .grid > .grid > div:first-child,
.day-view .grid > .day-header {
  border-bottom: none !important;
  background: transparent !important;
}

/* 去除月/周/日视图最上端的白色边框/白线 */
.calendar-grid > .grid,
.week-view > .grid,
.day-view > .grid,
.calendar-grid .grid-cols-7 > div,
.week-view .grid > .grid > div,
.day-view .day-header {
  border-top: none !important;
  background: transparent !important;
}

/* 针对月视图顶部星期栏的白线 */
.calendar-grid .grid-cols-7 {
  border-top: none !important;
  background: transparent !important;
}
</style>
