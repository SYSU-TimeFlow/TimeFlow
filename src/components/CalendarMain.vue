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
        <h2 class="text-2xl font-semibold mr-4">{{ calendarTitle }}</h2>
        <!-- 导航按钮组 -->
        <div class="navigation-buttons flex space-x-2">
          <!-- “今天”按钮，点击时触发 'go-to-today' 事件 -->
          <button
            @click="$emit('go-to-today')"
            class="py-1 px-3 border border-gray-300 rounded-md text-sm hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            Today
          </button>
          <!-- “上一个”导航按钮，点击时触发 'navigate-calendar' 事件并传递 'prev' 参数 -->
          <button
            @click="$emit('navigate-calendar', 'prev')"
            class="p-1 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <!-- “下一个”导航按钮，点击时触发 'navigate-calendar' 事件并传递 'next' 参数 -->
          <button
            @click="$emit('navigate-calendar', 'next')"
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
        <!-- 过滤按钮 (功能待实现) -->
        <button
          class="p-2 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-filter text-gray-600"></i>
        </button>
      </div>
    </div>

    <!-- 月视图容器 -->
    <div
      v-if="currentView === 'month'"
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
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[
            'calendar-day border border-gray-200 h-[180px] p-1 relative overflow-hidden',
            day.isCurrentMonth ? 'bg-white' : 'bg-gray-50', // 根据是否当前月份设置背景色
            day.isToday ? 'today' : '', // 如果是今天，添加 'today' 类
            day.isWeekend ? 'weekend' : '', // 如果是周末，添加 'weekend' 类 (样式未定义)
          ]"
          @click="$emit('handle-day-click', day)"
          @dragover.prevent
          @drop="$emit('handle-drop', $event, day)"
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
              @click.stop="$emit('handle-day-click', day, true)"
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
                event.allDay ? 'all-day-event' : '', // 全天事件特殊类 (样式未定义)
              ]"
              :style="{
                backgroundColor: event.categoryColor + '33', // 事件背景色，透明度33%
                borderLeft: `3px solid ${event.categoryColor}`, // 事件左边框颜色
              }"
              @click.stop="$emit('open-event-details', event)"
              draggable="true"
              @dragstart="$emit('handle-drag-start', $event, event)"
            >
              <!-- 事件时间 -->
              <div
                class="event-time font-medium"
                :style="{ color: event.categoryColor }"
              >
                {{ event.allDay ? "All day" : formatEventTime(event) }}
              </div>
              <!-- 事件标题 -->
              <div
                class="event-title font-medium truncate"
                :style="{ color: getContrastColor(event.categoryColor) }"
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
      v-else-if="currentView === 'week'"
      class="week-view flex-1 overflow-auto p-6"
    >
      <!-- 周视图网格布局，包含时间标签列和每天的列 -->
      <div class="grid grid-cols-8 h-full border border-gray-200">
        <!-- 左侧时间标签列 -->
        <div class="time-labels border-r border-gray-200 pt-16">
          <!-- 渲染24小时的时间标签 -->
          <div
            v-for="hour in 24"
            :key="hour"
            class="time-label h-12 -mt-3 text-xs text-gray-500 text-right pr-2"
          >
            {{ formatHour(hour - 1) }}
          </div>
        </div>
        <!-- 每天的列 -->
        <div
          v-for="(day, index) in weekViewDays"
          :key="index"
          class="day-column relative"
        >
          <!-- 每天的头部，显示星期和日期 -->
          <div
            class="day-header text-center p-2 border-b border-gray-200 sticky top-0 bg-white z-10"
          >
            <div class="text-sm font-medium">{{ day.dayName }}</div>
            <div
              :class="[
                'text-lg rounded-full w-8 h-8 flex items-center justify-center mx-auto',
                day.isToday ? 'bg-blue-600 text-white' : '', // 今天特殊样式
              ]"
            >
              {{ day.dayNumber }}
            </div>
          </div>
          <!-- 小时格子背景 -->
          <div class="hours-grid">
            <div
              v-for="hour in 24"
              :key="hour"
              class="hour-cell h-12 border-b border-gray-200 relative"
              @click="$emit('handle-hour-click', day, hour - 1)"
            ></div>
          </div>
          <!-- 事件渲染区域 -->
          <div class="events absolute top-16 left-0 right-0">
            <!-- 单个事件项 -->
            <div
              v-for="event in day.events"
              :key="event.id"
              class="week-event absolute rounded-sm px-1 overflow-hidden cursor-pointer"
              :style="{
                top: `${calculateEventTop(event)}px`, // 计算事件的垂直位置
                height: `${calculateEventHeight(event)}px`, // 计算事件的高度
                left: '2px',
                right: '2px',
                backgroundColor: event.categoryColor + '33',
                borderLeft: `3px solid ${event.categoryColor}`,
              }"
              @click.stop="$emit('open-event-details', event)"
            >
              <div
                class="event-time text-xs font-medium"
                :style="{ color: event.categoryColor }"
              >
                {{ formatEventTime(event) }}
              </div>
              <div
                class="event-title text-xs font-medium truncate"
                :style="{ color: getContrastColor(event.categoryColor) }"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日视图容器 -->
    <div
      v-else-if="currentView === 'day'"
      class="day-view flex-1 overflow-auto p-6"
    >
      <!-- 日视图网格布局 -->
      <div class="grid grid-cols-1 h-full border border-gray-200">
        <!-- 日视图头部，显示当前日期标题 -->
        <div
          class="day-header text-center p-4 border-b border-gray-200 bg-white"
        >
          <div class="text-2xl font-semibold">{{ dayViewTitle }}</div>
        </div>
        <!-- 日视图主体内容，包含时间标签和事件列 -->
        <div class="flex h-full">
          <!-- 左侧时间标签列 -->
          <div class="time-labels border-r border-gray-200 pr-4 w-20">
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-label h-16 -mt-3 text-xs text-gray-500 text-right"
            >
              {{ formatHour(hour - 1) }}
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
                @click="$emit('handle-hour-click', currentDate, hour - 1)"
              ></div>
            </div>
            <!-- 事件渲染区域 -->
            <div class="events absolute top-0 left-0 right-0">
              <!-- 单个事件项 -->
              <div
                v-for="event in dayViewEvents"
                :key="event.id"
                class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer"
                :style="{
                  top: `${calculateEventTop(event)}px`, // 计算事件的垂直位置
                  height: `${calculateEventHeight(event)}px`, // 计算事件的高度
                  left: '4px',
                  right: '4px',
                  backgroundColor: event.categoryColor + '33',
                  borderLeft: `3px solid ${event.categoryColor}`,
                }"
                @click.stop="$emit('open-event-details', event)"
              >
                <div
                  class="event-time text-xs font-medium"
                  :style="{ color: event.categoryColor }"
                >
                  {{ formatEventTime(event) }}
                </div>
                <div
                  class="event-title text-sm font-medium truncate"
                  :style="{ color: getContrastColor(event.categoryColor) }"
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

<script setup>
/**
 * @file CalendarMain.vue
 * @description 主日历组件，负责展示月、周、日视图以及相关的事件。
 *              它接收日历数据和当前视图状态作为 props，并向上层组件 emit 用户交互事件。
 */
import { defineProps, toRefs } from "vue";

// 定义组件接收的 props
const props = defineProps({
  /** @property {String} currentView - 当前日历视图 ('month', 'week', 'day') */
  currentView: String,
  /** @property {Date} currentDate - 当前选中的日期对象 */
  currentDate: Date,
  /** @property {Array} calendarDays - 月视图中显示的所有日期对象数组 */
  calendarDays: Array,
  /** @property {Array} weekViewDays - 周视图中显示的所有日期对象数组，包含事件 */
  weekViewDays: Array,
  /** @property {Array} dayViewEvents - 日视图中显示的事件数组 */
  dayViewEvents: Array,
  /** @property {Object} events - 包含所有事件的响应式引用 (Ref) */
  events: Object, // 保持为 Object，因为它是 Ref
  /** @property {String} calendarTitle - 日历头部显示的标题 (例如 "2023年7月") */
  calendarTitle: String,
  /** @property {String} dayViewTitle - 日视图头部显示的标题 (例如 "2023年7月15日") */
  dayViewTitle: String,
  /** @property {Array} categories - 所有分类对象数组 */
  categories: Array,
});

// 使用 toRefs 解包 props.events 以在 getEventsForDay 函数中保持响应性
const { events } = toRefs(props);

// 定义组件可能触发的自定义事件
defineEmits([
  "navigate-calendar", // 请求导航到上一个/下一个日历周期
  "go-to-today", // 请求跳转到今天
  "handle-day-click", // 用户点击了月视图中的某一天
  "handle-hour-click", // 用户点击了周/日视图中的某个小时格子
  "open-event-details", // 请求打开事件详情弹窗
  "handle-drag-start", // 事件开始拖拽
  "handle-drop", // 事件被拖放到某一天
]);

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
  // 调试日志，用于开发阶段检查 props.events 和解包后的 events.value
  //   console.log("props.events:", props.events);
  //   console.log("events.value:", events.value);

  // 检查 events.value 是否已定义且有值
  if (!events.value) {
    console.warn("Events are not available");
    return []; // 如果事件数据不可用，返回空数组
  }

  const eventsArray = events.value; // 获取响应式引用中的实际事件数组
  // 检查 eventsArray 是否确实是一个数组
  if (!Array.isArray(eventsArray)) {
    console.warn("Events is not an array:", eventsArray);
    return []; // 如果不是数组，返回空数组
  }

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
  const filteredEvents = eventsArray
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

  console.log("Filtered events for", date.toISOString(), ":", filteredEvents); // 调试日志，显示过滤后的事件
  return filteredEvents;
}

/**
 * @function formatEventTime
 * @description 格式化事件的开始和结束时间。
 * @param {Object} event - 事件对象，包含 start 和 end 属性。
 * @returns {String} - 格式化后的时间字符串，例如 "9:00 AM - 10:00 AM"。
 */
function formatEventTime(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * @function formatTime
 * @description 将日期对象格式化为小时和分钟 (例如 "9:00 AM")。
 * @param {Date} date - 日期对象。
 * @returns {String} - 格式化后的时间字符串。
 */
function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * @function formatHour
 * @description 格式化小时数字为带 AM/PM 的小时 (例如 "9 AM")。
 * @param {number} hour - 0-23 之间的小时数。
 * @returns {String} - 格式化后的小时字符串。
 */
function formatHour(hour) {
  // 创建一个虚拟日期，仅用于格式化小时部分
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(2025, 0, 1, hour));
}

/**
 * @function calculateEventTop
 * @description 计算事件在周/日视图中的垂直起始位置 (CSS top)。
 * @param {Object} event - 事件对象。
 * @returns {number} - 像素值。
 * 假设每小时的高度为 64px。
 */
function calculateEventTop(event) {
  const start = new Date(event.start);
  // (小时 * 60 + 分钟) / 60  得到带小数的小时数，再乘以每小时的像素高度
  return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64;
}

/**
 * @function calculateEventHeight
 * @description 计算事件在周/日视图中的高度 (CSS height)。
 * @param {Object} event - 事件对象。
 * @returns {number} - 像素值。
 * 假设每小时的高度为 64px，最小高度为 24px。
 */
function calculateEventHeight(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  // 计算事件持续的小时数（可以带小数）
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  // 持续小时数乘以每小时像素高度，确保最小高度为24px
  return Math.max(durationHours * 64, 24);
}

/**
 * @function getContrastColor
 * @description 根据背景色的亮度计算合适的文本颜色（黑色或白色）以保证可读性。
 * @param {String} hexColor - 十六进制颜色代码 (例如 "#RRGGBB")。
 * @returns {String} - "#000000" (黑色) 或 "#ffffff" (白色)。
 */
function getContrastColor(hexColor) {
  // 将十六进制颜色转换为 RGB 分量
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  // 计算亮度 (YIQ 公式的一部分)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // 如果亮度大于0.5，背景较亮，使用黑色文本；否则使用白色文本
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * @function getActiveCategoryIds
 * @description 获取当前所有激活状态的分类ID数组
 * @returns {Array<string|number>} 激活状态的分类ID数组
 */
function getActiveCategoryIds() {
  // 检查categories是否存在且为数组
  if (!Array.isArray(props.categories)) {
    console.warn('Categories is not an array or is undefined');
    return [];
  }
  // 过滤出激活状态的分类，并提取其ID
  return props.categories
    .filter((category) => Boolean(category?.active))
    .map((category) => category.id);
}
</script>

<style scoped>
/* “今天”日期单元格的特殊样式，顶部有一条蓝色高亮线 */
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
