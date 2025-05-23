<!--
  @component: CalendarApp
  @description: App主界面，承载其他子页面。包括侧边栏、主日历视图（月、周、日）、事件创建/编辑模态框以及各种交互功能。
  @author: liaohr
  @date: 2025-05-21
-->

<template>
  <!-- 主日历应用程序容器 -->
  <div class="calendar-app min-h-screen bg-white text-gray-800 flex flex-col">
    <!-- 应用程序头部 -->
    <header
      class="app-header bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between"
    >
      <div class="flex items-center">
        <h1 class="text-xl font-semibold text-gray-800">个人日历</h1>
      </div>
      <!-- 窗口控制按钮 (装饰性) -->
      <div class="window-controls flex items-center space-x-4">
        <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
          <i class="fas fa-bell"></i>
          <!-- 通知图标 -->
        </button>
        <button
          class="text-gray-500 hover:text-gray-700 cursor-pointer"
          @click="showSetting = true"
        >
          <i class="fas fa-cog"></i>
          <!-- 设置图标 -->
        </button>
        <div class="window-actions flex space-x-2">
          <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
            <i class="fas fa-window-minimize"></i>
            <!-- 最小化图标 -->
          </button>
          <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
            <i class="fas fa-window-maximize"></i>
            <!-- 最大化图标 -->
          </button>
          <button class="text-red-500 hover:text-red-700 cursor-pointer">
            <i class="fas fa-times"></i>
            <!-- 关闭图标 -->
          </button>
        </div>
      </div>
    </header>
    <!-- 主内容区域，包含侧边栏和日历视图 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏组件 -->
      <Sidebar
        :sidebar-collapsed="sidebarCollapsed"
        :mini-calendar-date="miniCalendarDate"
        :calendar-views="calendarViews"
        :current-view="currentView"
        :categories="categories"
        :synced="synced"
        :mini-calendar-days="miniCalendarDays"
        :selected-date="selectedDate"
        @toggle-sidebar="toggleSidebar"
        @prev-month="prevMonth"
        @next-month="nextMonth"
        @select-date="selectDate"
        @change-view="changeView"
        @toggle-category="toggleCategory"
        @open-new-event-modal="openNewEventModal"
      />
      <!-- 主日历区域组件 -->
      <CalendarMain
        :current-view="currentView"
        :current-date="currentDate"
        :calendar-days="calendarDays"
        :week-view-days="weekViewDays"
        :day-view-events="dayViewEvents"
        :events="events"
        :calendar-title="calendarTitle"
        :day-view-title="dayViewTitle"
        :categories="categories"
        @navigate-calendar="navigateCalendar"
        @go-to-today="goToToday"
        @handle-day-click="handleDayClick"
        @handle-hour-click="handleHourClick"
        @open-event-details="openEventDetails"
      />
    </div>
    <!-- 事件模态框组件 (用于创建/编辑事件) -->
    <EventModal
      :show-event-modal="showEventModal"
      :is-new-event="isNewEvent"
      :current-event="currentEvent"
      :categories="categories"
      @close-event-modal="closeEventModal"
      @save-event="saveEvent"
      @delete-event="deleteEvent"
    />

    <!-- 设置弹窗及遮罩层 -->
    <div
      v-if="showSetting"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- 遮罩层 -->
      <div
        class="absolute inset-0 bg-black bg-opacity-40 transition-opacity"
        @click="showSetting = false"
      ></div>
      <!-- 设置弹窗 -->
      <Setting class="relative z-10" @close="showSetting = false" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import Sidebar from "./Sidebar.vue"; // 导入侧边栏组件
import CalendarMain from "./CalendarMain.vue"; // 导入主日历区域组件
import EventModal from "./EventModal.vue"; // 导入事件模态框组件
import Setting from "./Setting.vue"; // 导入设置组件

// 定义日历视图选项
const calendarViews = [
  { id: "month", label: "月", icon: "fa-calendar-alt" },
  { id: "week", label: "周", icon: "fa-calendar-week" },
  { id: "day", label: "日", icon: "fa-calendar-day" },
];

// 定义事件分类
// TODO: 可以添加新的分类或者编辑现有分类
const categories = ref([
  { id: 1, name: "工作", color: "#4f46e5", active: true },
  { id: 2, name: "个人", color: "#10b981", active: true },
  { id: 3, name: "家庭", color: "#f59e0b", active: true },
  { id: 4, name: "健康", color: "#ef4444", active: true },
  { id: 5, name: "其他", color: "#8b5cf6", active: true },
]);

// 日历状态管理
const currentView = ref("month"); // 当前视图 (月、周、日) 默认是月视图
const currentDate = ref(new Date()); // 当前主日历显示的日期
const selectedDate = ref(new Date()); // 侧边栏迷你日历中选中的日期
const miniCalendarDate = ref(new Date()); // 侧边栏迷你日历显示的月份
const sidebarCollapsed = ref(false); // 侧边栏是否折叠
const synced = ref(true); // 同步状态 (示例)
const draggedEvent = ref(null); // 当前拖拽的事件

// 事件模态框状态管理
const showEventModal = ref(false); // 是否显示事件模态框
const isNewEvent = ref(true); // 模态框是用于新建事件还是编辑事件
const currentEvent = ref({
  // 当前正在编辑或创建的事件对象
  id: 0,
  title: "",
  start: "",
  end: "",
  description: "",
  categoryId: 1,
  categoryColor: "#4f46e5",
  allDay: false,
  syncWithSystem: true,
});
const showSetting = ref(false); // 是否显示设置模态框

// 示例事件数据（注意，这里是写死的，后面需要动态加载，永久化存储等）
const events = ref([
  {
    id: 1,
    title: "团队会议",
    start: new Date(2025, 4, 18, 10, 0), // 注意: 月份是从0开始的 (0-11)，所以4代表5月
    end: new Date(2025, 4, 18, 11, 30),
    description: "每周团队同步",
    categoryId: 1,
    categoryColor: "#4f46e5",
    allDay: false,
    syncWithSystem: true,
  },
  {
    id: 2,
    title: "牙医预约",
    start: new Date(2025, 4, 20, 14, 0),
    end: new Date(2025, 4, 20, 15, 0),
    description: "常规检查",
    categoryId: 4,
    categoryColor: "#ef4444",
    allDay: false,
    syncWithSystem: true,
  },
  {
    id: 3,
    title: "生日派对",
    start: new Date(2025, 4, 22, 18, 0),
    end: new Date(2025, 4, 22, 22, 0),
    description: "John的生日庆祝",
    categoryId: 3,
    categoryColor: "#f59e0b",
    allDay: false,
    syncWithSystem: true,
  },
  {
    id: 4,
    title: "项目截止日期",
    start: new Date(2025, 4, 25, 0, 0),
    end: new Date(2025, 4, 25, 23, 59),
    description: "Q2项目最终提交",
    categoryId: 1,
    categoryColor: "#4f46e5",
    allDay: true,
    syncWithSystem: true,
  },
  {
    id: 5,
    title: "健身房锻炼",
    start: new Date(2025, 4, 19, 7, 0),
    end: new Date(2025, 4, 19, 8, 30),
    description: "晨间锻炼",
    categoryId: 4,
    categoryColor: "#ef4444",
    allDay: false,
    syncWithSystem: false,
  },
]);

// 计算属性
const weekDays = computed(() => [
  // 一周的完整名称
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
]);
const weekDaysShort = computed(() => [
  // 一周的缩写名称
  "日",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
]);

/**
 * 根据当前视图和日期动态生成主日历标题
 * @returns {string} - 主日历标题
 */
const calendarTitle = computed(() => {
  // 主日历标题 (根据当前视图和日期动态生成)
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };
  if (currentView.value === "week") {
    return ` ${new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric",
    }).format(getStartOfWeek(currentDate.value))} - ${new Intl.DateTimeFormat(
      "zh-CN",
      { month: "short", day: "numeric", year: "numeric" }
    ).format(getEndOfWeek(currentDate.value))} 周`;
  } else if (currentView.value === "day") {
    return new Intl.DateTimeFormat("zh-CN", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(currentDate.value);
  }
  return new Intl.DateTimeFormat("zh-CN", options).format(currentDate.value);
});

const miniCalendarTitle = computed(() => {
  // 迷你日历标题
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    year: "numeric",
  }).format(miniCalendarDate.value);
});

const dayViewTitle = computed(() => {
  // 日视图标题
  return new Intl.DateTimeFormat("zh-CN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(currentDate.value);
});

/**
 * 生成了月视图日历中需要展示的所有“日期格子”的数据，包含前补和后补的那些天，确保视图是完整周（从周日到周六）对齐的
 * @returns {Array} - 月视图的日期格子数据
 */
const calendarDays = computed(() => {
  // 月视图的日期格子数据
  const days: {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
  }[] = []; // 初始化一个空数组，用于存储月视图的每一天的数据
  const monthStart = new Date(
    currentDate.value.getFullYear(), // 当前年份
    currentDate.value.getMonth(), // 当前月份 (0-11)
    1 // 日期设为1，即该月第一天
  );
  // 获取当前显示月份的最后一天
  const monthEnd = new Date(
    currentDate.value.getFullYear(), // 当前年份
    currentDate.value.getMonth() + 1, // 下个月的月份
    0 // 日期设为0，JavaScript会自动计算为上个月的最后一天
  );
  // 获取包含当前月份第一天的周的起始日 (通常是周日)
  const startDate = getStartOfWeek(monthStart);
  // 获取包含当前月份最后一天的周的结束日 (通常是周六)
  const endDate = getEndOfWeek(monthEnd);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 从计算出的周起始日开始迭代，直到周结束日
  let currentDay = new Date(startDate);
  while (currentDay <= endDate) {
    const isCurrentMonth =
      currentDay.getMonth() === currentDate.value.getMonth();
    const isToday = currentDay.getTime() === today.getTime();
    const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6; // 0代表周日, 6代表周六

    // 将当前日期的信息作为一个对象添加到days数组中
    days.push({
      date: new Date(currentDay), // 日期对象
      dayNumber: currentDay.getDate(), // 月份中的第几天 (1-31)
      isCurrentMonth, // 是否属于当前月份
      isToday, // 是否是今天
      isWeekend, // 是否是周末
    });
    currentDay.setDate(currentDay.getDate() + 1);
  }
  return days; // 返回包含所有日期格信息的数组
});

/**
 * 生成了迷你日历中需要展示的所有“日期格子”的数据，包含前补和后补的那些天，确保视图是完整周（从周日到周六）对齐的
 * @returns {Array} - 迷你日历的日期格子数据
 */
const miniCalendarDays = computed(() => {
  // 迷你日历的日期格子数据
  const days: {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }[] = []; // 初始化一个空数组，用于存储迷你日历的每一天的数据
  const monthStart = new Date(
    miniCalendarDate.value.getFullYear(),
    miniCalendarDate.value.getMonth(),
    1
  );
  const monthEnd = new Date(
    miniCalendarDate.value.getFullYear(),
    miniCalendarDate.value.getMonth() + 1,
    0
  );
  const startDate = getStartOfWeek(monthStart);
  const endDate = getEndOfWeek(monthEnd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDay = new Date(selectedDate.value);
  selectedDay.setHours(0, 0, 0, 0);
  let currentDay = new Date(startDate);
  while (currentDay <= endDate) {
    const isCurrentMonth =
      currentDay.getMonth() === miniCalendarDate.value.getMonth();
    const isToday = currentDay.getTime() === today.getTime();
    const isSelected = currentDay.getTime() === selectedDay.getTime();
    days.push({
      date: new Date(currentDay),
      dayNumber: currentDay.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
    });
    currentDay.setDate(currentDay.getDate() + 1);
  }
  return days;
});

/**
 * 生成了周视图中需要展示的所有“日期格子”的数据
 * @returns {Array} - 周视图的日期格子数据
 */
const weekViewDays = computed(() => {
  // 周视图的日期数据
  const days: {
    date: Date;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
    events: any[];
  }[] = []; // 初始化一个空数组，用于存储周视图的每一天的数据
  const startOfWeek = getStartOfWeek(currentDate.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    const isToday = day.getTime() === today.getTime();
    days.push({
      date: new Date(day),
      dayName: weekDays.value[day.getDay()].substring(0, 3), // 使用中文星期缩写
      dayNumber: day.getDate(),
      isToday,
      events: getEventsForDay(day),
    });
  }
  return days;
});

/**
 * 获取日视图中需要展示的所有“事件”的数据
 * @returns {Array} - 日视图的事件数据
 */
const dayViewEvents = computed(() => {
  // 日视图的事件数据
  return getEventsForDay(currentDate.value);
});

// ============================ 辅助函数 ============================
/**
 * 获取给定日期所在周的第一天 (星期日)
 * @param {Date} date - 输入日期
 * @returns {Date} - 该周的第一天
 */
function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 (Sunday) - 6 (Saturday)
  result.setDate(result.getDate() - day);
  return result;
}

/**
 * 获取给定日期所在周的最后一天 (星期六)
 * @param {Date} date - 输入日期
 * @returns {Date} - 该周的最后一天
 */
function getEndOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day));
  return result;
}

/**
 * 获取指定日期的所有事件
 * @param {Date} date - 要获取事件的日期
 * @returns {Array} - 该日期的事件数组，按开始时间排序
 */
function getEventsForDay(date: Date): any[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return events.value
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      // 检查事件是否与给定日期重叠
      return (
        (eventStart >= start && eventStart <= end) || // 事件开始于当天
        (eventEnd >= start && eventEnd <= end) || // 事件结束于当天
        (eventStart <= start && eventEnd >= end) // 事件跨越当天
      );
    })
    .sort((a, b) => {
      // 按开始时间排序，如果开始时间相同则按结束时间排序
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();
      if (aStart === bStart) {
        return new Date(a.end).getTime() - new Date(b.end).getTime();
      }
      return aStart - bStart;
    });
}

/**
 * 格式化事件的开始和结束时间
 * @param {Object} event - 事件对象
 * @returns {string} - 格式化的时间字符串 (例如 "上午10:00 - 上午11:30")
 */
function formatEventTime(event: any): string {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * 格式化日期对象为时间字符串 (例如 "上午10:00")
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化的时间字符串
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    // 使用中文和12小时制
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * 格式化小时数为时间字符串 (例如 "上午9点")
 * @param {number} hour - 小时数 (0-23)
 * @returns {string} - 格式化的小时字符串
 */
function formatHour(hour: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(2025, 0, 1, hour)); // 年月日不重要，仅用于格式化小时
}

/**
 * 计算事件在日视图或周视图中的垂直位置 (top)
 * @param {Object} event - 事件对象
 * @returns {number} - CSS top 值 (像素)
 */
function calculateEventTop(event: any): number {
  const start = new Date(event.start);
  // 每小时64像素
  return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64;
}

/**
 * 计算事件在日视图或周视图中的高度
 * @param {Object} event - 事件对象
 * @returns {number} - CSS height 值 (像素)
 */
function calculateEventHeight(event: any): number {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  // 最小高度24像素，每小时64像素
  return Math.max(durationHours * 64, 24);
}

/**
 * 根据背景颜色计算对比强烈的文本颜色 (黑色或白色)
 * @param {string} hexColor - 十六进制颜色代码 (例如 "#4f46e5")
 * @returns {string} - "#000000" (黑色) 或 "#ffffff" (白色)
 */
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// ========================= 事件处理函数 =========================
/**
 * 切换侧边栏的折叠状态
 */
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

/**
 * 切换分类的激活状态 (用于筛选事件)
 * @param {number} categoryId - 分类ID
 */
function toggleCategory(categoryId: number) {
  const category = categories.value.find((c) => c.id === categoryId);
  if (category) {
    category.active = !category.active;
  }
}

/**
 * 更改当前日历视图 (月、周、日)
 * @param {string} view - 视图ID ("month", "week", "day")
 */
function changeView(view: string) {
  currentView.value = view;
}

/**
 * 导航到上一个或下一个时间段 (月、周、日)
 * @param {"prev" | "next"} direction - 导航方向
 */
function navigateCalendar(direction: "prev" | "next") {
  if (currentView.value === "month") {
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + (direction === "next" ? 1 : -1),
      1
    );
  } else if (currentView.value === "week") {
    const newDate = new Date(currentDate.value);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    currentDate.value = newDate;
  } else if (currentView.value === "day") {
    const newDate = new Date(currentDate.value);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    currentDate.value = newDate;
  }
}

/**
 * 跳转到今天的日期
 */
function goToToday() {
  currentDate.value = new Date();
  selectedDate.value = new Date();
}

/**
 * 迷你日历：导航到上个月
 */
function prevMonth() {
  miniCalendarDate.value = new Date(
    miniCalendarDate.value.getFullYear(),
    miniCalendarDate.value.getMonth() - 1,
    1
  );
}

/**
 * 迷你日历：导航到下个月
 */
function nextMonth() {
  miniCalendarDate.value = new Date(
    miniCalendarDate.value.getFullYear(),
    miniCalendarDate.value.getMonth() + 1,
    1
  );
}

/**
 * 迷你日历：选择一个日期，并更新主日历的当前日期
 * @param {Date} date - 选择的日期
 */
function selectDate(date: Date) {
  selectedDate.value = new Date(date);
  currentDate.value = new Date(date);
}

/**
 * 处理月视图中日期的点击事件
 * @param {Object} day - 被点击的日期对象 (来自 calendarDays)
 * @param {boolean} [isAddEvent=false] - 是否通过点击添加事件按钮触发
 */
function handleDayClick(day: any, isAddEvent = false) {
  if (day.isCurrentMonth) {
    // 仅当点击当前月份的日期时有效
    currentDate.value = new Date(day.date);
    selectedDate.value = new Date(day.date);
    if (isAddEvent) {
      // 如果是添加事件，则打开新建事件模态框
      const startDate = new Date(day.date);
      startDate.setHours(9, 0, 0, 0); // 默认开始时间为上午9点
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0); // 默认结束时间为上午10点
      openNewEventModal(startDate, endDate);
    }
  }
}

/**
 * 处理周视图或日视图中小时格子的点击事件 (用于快速创建事件)
 * @param {Object} day - 包含日期信息的对象
 * @param {number} hour - 被点击的小时 (0-23)
 */
function handleHourClick(day: any, hour: number) {
  const date = new Date(day.date);
  date.setHours(hour, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(hour + 1, 0, 0, 0); // 默认事件持续1小时
  openNewEventModal(date, endDate);
}

/**
 * 打开新建事件模态框
 * @param {Date} [start] - 默认开始时间
 * @param {Date} [end] - 默认结束时间
 */
function openNewEventModal(start?: Date, end?: Date) {
  isNewEvent.value = true;
  const startDate = start || new Date(selectedDate.value);
  if (!start) startDate.setHours(9, 0, 0, 0); // 如果没有提供开始时间，默认为选中日期的上午9点
  const endDate = end || new Date(startDate);
  if (!end) endDate.setHours(startDate.getHours() + 1, 0, 0, 0); // 如果没有提供结束时间，默认为开始时间后1小时

  currentEvent.value = {
    id: Date.now(), // 使用时间戳作为临时ID
    title: "",
    start: formatDateTimeForInput(startDate), // 格式化为 datetime-local input 所需的格式
    end: formatDateTimeForInput(endDate),
    description: "",
    categoryId: categories.value.length > 0 ? categories.value[0].id : 1, // 默认选择第一个分类
    categoryColor:
      categories.value.length > 0 ? categories.value[0].color : "#4f46e5",
    allDay: false,
    syncWithSystem: true,
  };
  showEventModal.value = true;
}

/**
 * 打开事件详情/编辑模态框
 * @param {Object} event - 要编辑的事件对象
 * @todo: 背景是黑色的十分丑陋！需要改进
 */
function openEventDetails(event: any) {
  isNewEvent.value = false;
  currentEvent.value = {
    ...event,
    start: formatDateTimeForInput(new Date(event.start)), // 格式化为 datetime-local input 所需的格式
    end: formatDateTimeForInput(new Date(event.end)),
  };
  showEventModal.value = true;
}

/**
 * 将 Date 对象格式化为 datetime-local input 所需的字符串格式 (YYYY-MM-DDTHH:mm)
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的日期时间字符串
 */
function formatDateTimeForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 关闭事件模态框
 */
function closeEventModal() {
  showEventModal.value = false;
}

/**
 * 保存事件 (新建或更新)
 */
function saveEvent() {
  const eventToSave = {
    ...currentEvent.value,
    start: new Date(currentEvent.value.start), // 将输入框的字符串转回 Date 对象
    end: new Date(currentEvent.value.end),
  };
  if (isNewEvent.value) {
    events.value.push(eventToSave);
  } else {
    const index = events.value.findIndex((e) => e.id === eventToSave.id);
    if (index !== -1) {
      events.value[index] = eventToSave;
    }
  }
  closeEventModal();
}

/**
 * 删除当前模态框中的事件
 */
function deleteEvent() {
  const index = events.value.findIndex((e) => e.id === currentEvent.value.id);
  if (index !== -1) {
    events.value.splice(index, 1);
  }
  closeEventModal();
}

/**
 * 处理事件拖拽开始
 * @param {DragEvent} event - 拖拽事件对象
 * @param {Object} calendarEvent - 被拖拽的日历事件对象
 */
function handleDragStart(event: DragEvent, calendarEvent: any) {
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", calendarEvent.id.toString()); // 设置拖拽数据
    draggedEvent.value = calendarEvent; // 记录被拖拽的事件
  }
}

/**
 * 处理事件拖放
 * @param {DragEvent} event - 拖放事件对象
 * @param {Object} day - 目标日期对象 (来自 calendarDays 或 weekViewDays)
 */
function handleDrop(event: DragEvent, day: any) {
  event.preventDefault();
  if (draggedEvent.value && event.dataTransfer) {
    const eventId = parseInt(event.dataTransfer.getData("text/plain"));
    const eventIndex = events.value.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      const originalEvent = events.value[eventIndex];
      const originalStart = new Date(originalEvent.start);
      const originalEnd = new Date(originalEvent.end);
      const duration = originalEnd.getTime() - originalStart.getTime(); // 计算事件持续时间

      const newStart = new Date(day.date); // 新的开始日期基于目标格子
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes()); // 保留原始时间
      const newEnd = new Date(newStart.getTime() + duration); // 计算新的结束时间

      events.value[eventIndex] = {
        ...originalEvent,
        start: newStart,
        end: newEnd,
      };
    }
  }
  draggedEvent.value = null; // 清除拖拽事件记录
}

// 生命周期钩子
onMounted(() => {
  goToToday(); // 组件挂载后，默认显示今天的日期
});
</script>

<style scoped>
/* 组件的局部样式 */
.calendar-app {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}
</style>
