<!-- 
 @component CalendarMain.vue
 @description: 主日历组件，负责展示月、周、日视图以及相关的事件。 
-->

<template>
  <!-- 主日历区域容器 - 保留overflow-auto并增强滚动行为 -->
  <main
    class="calendar-main flex-1 flex flex-col overflow-auto custom-scrollbar"
    :style="{
      backgroundColor:
        settingStore.themeMode === 'dark' ? '#0d1117' : '#ffffff',
    }"
  >
    <!-- 月视图容器 - 修改overflow-auto为overflow-visible，让父容器控制滚动 -->
    <div
      v-if="uiStore.currentView === 'month'"
      class="calendar-grid flex-1 overflow-visible p-6"
    >
      <!-- 星期头部 -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in uiStore.weekDays"
          :key="day"
          class="text-sm font-medium text-gray-500 pb-2 text-center week-day"
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
              <span
                v-if="settingStore.showLunar"
                class="lunar-date text-xs ml-1"
                :style="{
                  color: day.isCurrentMonth
                    ? settingStore.themeMode === 'dark'
                      ? '#ffffff'
                      : '#666666'
                    : settingStore.themeMode === 'dark'
                    ? '#666666'
                    : '#999999',
                }"
              >
                {{ getLunarDate(new Date(day.date)) }}
              </span>
            </span>
          </div>
          <!-- 当天事件列表容器 -->
          <div class="day-events mt-1 space-y-1 pb-2 custom-scrollbar">
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
                  event.allDay ? "All day" : settingStore.formatEventTime(event)
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
            v-for="(day, idx) in uiStore.weekViewDays"
            :key="idx"
            class="day-header flex flex-col items-center justify-center p-2 border-b border-gray-200 bg-white"
          >
            <div class="text-sm font-medium">{{ uiStore.weekDays[idx] }}</div>
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
              {{ settingStore.formatHour(hour - 1) }}
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
                  {{ settingStore.formatEventTime(event) }}
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
              {{ settingStore.formatHour(hour - 1) }}
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
                  {{ settingStore.formatEventTime(event) }}
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
import { useSettingStore } from "../stores/setting";
import { computed, watch } from "vue";

// 使用 Pinia 仓库
const uiStore = useUiStore();
const eventStore = useEventStore();
const settingStore = useSettingStore();

// 农历数据
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0,
  0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540,
  0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,
  0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0,
  0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
  0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573,
  0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4,
  0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5,
  0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
  0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
  0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50,
  0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0,
  0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260,
  0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,
  0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
  0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
];

// 农历日期转换函数
function getLunarDate(date: Date): string {
  const lunarDays = [
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十",
  ];

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 计算与1900年1月31日相差的天数
  let offset =
    (Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000;

  // 用offset减去每农历年的天数，计算当前农历年份
  let lunarYear = 1900;
  let temp = 0;
  for (lunarYear = 1900; lunarYear < 2100 && offset > 0; lunarYear++) {
    temp = getLunarYearDays(lunarYear);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    lunarYear--;
  }

  // 计算农历月份
  let lunarMonth = 1;
  let isLeap = false;
  let yearDays = getLunarYearDays(lunarYear);
  let leapMonth = getLeapMonth(lunarYear);
  let monthDays = 0;

  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    // 闰月
    if (leapMonth > 0 && lunarMonth === leapMonth + 1 && !isLeap) {
      --lunarMonth;
      isLeap = true;
      monthDays = getLeapMonthDays(lunarYear);
    } else {
      monthDays = getMonthDays(lunarYear, lunarMonth);
    }
    // 解除闰月
    if (isLeap && lunarMonth === leapMonth + 1) {
      isLeap = false;
    }
    offset -= monthDays;
  }

  if (offset === 0 && leapMonth > 0 && lunarMonth === leapMonth + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --lunarMonth;
    }
  }
  if (offset < 0) {
    offset += monthDays;
    --lunarMonth;
  }

  // 计算农历日期
  let lunarDay = offset + 1;

  return lunarDays[lunarDay - 1];
}

// 获取农历年份总天数
function getLunarYearDays(year: number): number {
  let total = 0;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    total += lunarInfo[year - 1900] & i ? 30 : 29;
  }
  return total + getLeapMonthDays(year);
}

// 获取闰月天数
function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return lunarInfo[year - 1900] & 0x10000 ? 30 : 29;
  }
  return 0;
}

// 获取闰月月份
function getLeapMonth(year: number): number {
  return lunarInfo[year - 1900] & 0xf;
}

// 获取农历某月总天数
function getMonthDays(year: number, month: number): number {
  return lunarInfo[year - 1900] & (0x10000 >> month) ? 30 : 29;
}

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

// 监听起始星期变化
watch(
  () => settingStore.weekStart,
  (newValue) => {
    uiStore.updateWeekStart(newValue);
  },
  { immediate: true }
);
</script>

<style scoped>
.calendar-main {
  font-size: inherit;
}

/* 调整各个元素的字体大小比例 */
.calendar-title {
  font-size: 1.2em;
}

.nav-button {
  font-size: 1em;
}

.view-button {
  font-size: 0.9em;
}

.event-title {
  font-size: 1em;
}

.event-time {
  font-size: 0.9em;
}

.event-description {
  font-size: 0.85em;
}

.time-label {
  font-size: 0.85em;
}

.day-number {
  font-size: 1.1em;
}

.week-day {
  font-size: 1em;
}

/* 主容器背景色 */
.calendar-main {
  background-color: #ffffff;
}

/* 深色模式背景色 */
.dark .calendar-main {
  background-color: #0d1117;
}

/* 深色模式下的文本颜色 */
.dark .text-gray-500,
.dark .text-gray-700,
.dark .text-gray-800,
.dark .text-gray-400 {
  color: #8b949e;
}

/* 深色模式下的边框颜色 */
.dark .border-gray-200,
.dark .border-gray-300 {
  border-color: #30363d;
}

/* 深色模式下的悬停效果 */
.dark .calendar-day:hover {
  background-color: #21262d;
  border-color: #58a6ff !important;
  box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.3);
}

/* 深色模式下的滚动条样式 */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #0d1117;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #30363d;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3f444c;
}

/* 深色模式下的农历日期颜色 */
.dark .lunar-date {
  color: #8b949e;
}

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

/* 农历日期样式 */
.lunar-date {
  font-size: 0.75em;
}

.dark .lunar-date {
  color: #ffffff;
}
</style>
