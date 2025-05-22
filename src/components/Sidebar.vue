<!--
    @file Sidebar.vue
    @description 日历应用的侧边栏组件。
    该组件包含添加事件按钮、迷你日历、视图选择器、分类列表以及同步状态指示器。
    侧边栏可以展开或折叠。
-->
<template>
  <!-- 侧边栏容器 -->
  <aside
    :class="[
      'sidebar bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300',
      sidebarCollapsed ? 'w-16' : 'w-64', // 根据 sidebarCollapsed 状态动态调整宽度
    ]"
  >
    <!-- 侧边栏折叠/展开切换按钮 -->
    <button
      @click="$emit('toggle-sidebar')"
      :class="[
        'sidebar-toggle text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap transition-all',
        sidebarCollapsed ? 'mx-auto my-3 w-8 h-8 flex items-center justify-center rounded-full' : 'self-end p-2 m-2', // 根据折叠状态设置不同的边距
      ]"
    >
      <i
        :class="
          sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left' // 根据折叠状态切换图标
        "
      ></i>
    </button>
    <!-- 添加新事件按钮 -->
    <button
      @click="$emit('open-new-event-modal')"
      class="add-event-btn mx-4 my-3 py-2 px-4 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition cursor-pointer !rounded-button whitespace-nowrap"
    >
      <i 
        :class="[
          'fas fa-plus',
          !sidebarCollapsed ? 'mr-2' : '' // 根据折叠状态设置边距
        ]"
      ></i>
      <span v-if="!sidebarCollapsed">Add Event</span>
      <!-- 仅在侧边栏展开时显示文字 -->
    </button>
    <!-- 迷你日历组件 -->
    <MiniCalendar
      :mini-calendar-date="miniCalendarDate"
      :selected-date="selectedDate"
      :mini-calendar-days="miniCalendarDays"
      :sidebar-collapsed="sidebarCollapsed"
      @prev-month="$emit('prev-month')"
      @next-month="$emit('next-month')"
      @select-date="$emit('select-date', $event)"
    />
    <!-- 视图选择器组件 -->
    <ViewSelector
      :calendar-views="calendarViews"
      :current-view="currentView"
      :sidebar-collapsed="sidebarCollapsed"
      @change-view="$emit('change-view', $event)"
    />
    <!-- 分类列表组件 -->
    <Categories
      :categories="categories"
      :sidebar-collapsed="sidebarCollapsed"
      @toggle-category="$emit('toggle-category', $event)"
    />
    <!-- 同步状态指示器，固定在侧边栏底部 -->
    <div class="sync-status mt-auto mx-4 my-3 flex items-center">
      <!-- 同步状态小圆点 -->
      <span
        :class="[
          'sync-indicator w-2 h-2 rounded-full',
          synced ? 'bg-green-500' : 'bg-yellow-500',
        ]"
      ></span>
      <!-- 同步状态文本，仅在侧边栏展开时显示 -->
      <span v-if="!sidebarCollapsed" class="text-xs text-gray-500 ml-2">
        {{ synced ? "Synced with system calendar" : "Sync pending..." }}
      </span>
    </div>
  </aside>
</template>

<script setup>
import MiniCalendar from "./MiniCalendar.vue";
import ViewSelector from "./ViewSelector.vue";
import Categories from "./Categories.vue";

/**
 * @typedef {Object} CalendarView
 * @property {string} id - 视图的唯一标识符 (例如 'dayGridMonth', 'timeGridWeek')
 * @property {string} name - 视图的显示名称 (例如 'Month', 'Week')
 */

/**
 * @typedef {Object} Category
 * @property {string} id - 分类的唯一标识符
 * @property {string} name - 分类的名称
 * @property {string} color - 分类的颜色代码
 * @property {boolean} active - 分类是否激活
 */

/**
 * @typedef {Object} MiniCalendarDay
 * @property {Date} date - 日期对象
 * @property {number} dayNumber - 月份中的日期数字
 * @property {boolean} isCurrentMonth - 是否属于当前显示的月份
 * @property {boolean} isToday - 是否是今天
 * @property {boolean} isSelected - 是否被选中
 */

defineProps({
  /**
   * 指示侧边栏是否已折叠
   * @type {Boolean}
   */
  sidebarCollapsed: Boolean,
  /**
   * 迷你日历当前显示的月份的日期对象
   * @type {Date}
   */
  miniCalendarDate: Date,
  /**
   * 可用的日历视图列表
   * @type {Array<CalendarView>}
   */
  calendarViews: Array,
  /**
   * 当前激活的日历视图ID
   * @type {String}
   */
  currentView: String,
  /**
   * 事件分类对象的数组
   * @type {Array<Category>}
   */
  categories: Array,
  /**
   * 指示日历是否已与系统日历同步
   * @type {Boolean}
   */
  synced: Boolean,
  /**
   * 构成迷你日历网格的日期数据数组
   * @type {Array<MiniCalendarDay>}
   */
  miniCalendarDays: Array,
  /**
   * 当前主日历选中的日期对象
   * @type {Date}
   */
  selectedDate: Date,
});

defineEmits([
  /**
   * 切换侧边栏折叠/展开状态的事件
   * @event toggle-sidebar
   */
  "toggle-sidebar",
  /**
   * 迷你日历切换到上一个月的事件
   * @event prev-month
   */
  "prev-month",
  /**
   * 迷你日历切换到下一个月的事件
   * @event next-month
   */
  "next-month",
  /**
   * 在迷你日历中选择日期的事件
   * @event select-date
   * @type {Date} - 被选中的日期对象
   */
  "select-date",
  /**
   * 更改日历视图的事件
   * @event change-view
   * @type {String} - 新视图的ID
   */
  "change-view",
  /**
   * 切换分类激活状态的事件
   * @event toggle-category
   * @type {String} - 被切换分类的ID
   */
  "toggle-category",
  /**
   * 打开创建新事件模态框的事件
   * @event open-new-event-modal
   */
  "open-new-event-modal",
]);
</script>
