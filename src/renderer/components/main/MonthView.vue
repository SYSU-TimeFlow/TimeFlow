<!--
  MonthView.vue - 月视图组件
  
  功能概述：
  - 显示完整的月历视图，包含7x6的日期网格
  - 支持农历显示（可配置）
  - 显示每日事件和待办事项
  - 支持事件拖拽移动
  - 响应式设计，支持深色模式
  - 支持周起始日配置
  - 事件项支持完成状态切换
  - 支持跨天事件显示
  
  主要功能：
  1. 日历渲染：基于当前日期生成月视图网格
  2. 事件管理：显示、编辑、拖拽事件
  3. 待办管理：支持待办事项的完成状态切换
  4. 交互操作：点击日期、拖拽事件、悬停效果
  5. 主题适配：支持明暗主题切换
  6. 国际化：支持农历显示和时间格式配置
-->

<template>
  <!-- 月视图主容器 - 设置基础布局和最小高度 -->
  <div class="calendar-grid flex-1 overflow-visible p-6 min-h-[800px]">
    <!-- 固定星期头部 - 始终显示在顶部，带毛玻璃效果 -->
    <div
      class="sticky top-0 z-30 backdrop-blur-md backdrop-saturate-125 bg-white/70 rounded-lg"
    >
      <!-- 7列网格布局显示星期名称 -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in getWeekDayNames(settingStore.weekStart)"
          :key="day"
          class="text-sm font-medium text-gray-500 pb-2 text-center"
        >
          {{ day }}
        </div>
      </div>
    </div>
    
    <!-- 日期格子容器 - 7列6行的网格布局 -->
    <div class="grid grid-cols-7 grid-rows-6 gap-1 h-full">
      <!-- 单个日期格子 - 遍历生成当月所有日期 -->
      <div
        v-for="(day, index) in getMonthDays(
          new Date(uiStore.currentDate),
          settingStore.weekStart
        )"
        :key="index"
        :class="[
          // 基础样式：边框、高度、内边距、过渡效果和悬停效果
          'calendar-day border border-gray-200 h-auto min-h-[120px] max-h-[180px] p-1 pb-2 relative flex flex-col transition-all duration-200 ease-in-out hover:bg-gray-50 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/30 hover:z-[5]',
          // 非当前月份的日期使用灰色背景
          day.isCurrentMonth ? '' : 'bg-gray-200',
          // 今天的日期添加蓝色顶部边框
          day.isToday
            ? 'today relative after:absolute after:top-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-600'
            : '',
          // 周末标识
          day.isWeekend ? 'weekend' : '',
        ]"
        @click="uiStore.handleDayClick(day, true)"
        @dragover.prevent
        @drop="uiStore.handleMonthDrop($event, day)"
      >
        <!-- 日期头部区域 - 包含日期数字和农历信息 -->
        <div
          :class="[
            'day-header flex justify-between items-center p-1 rounded-t bg-inherit flex-shrink-0 mb-1',
            // 今天的日期头部使用蓝色背景
            day.isToday ? 'bg-blue-50' : '',
          ]"
        >
          <!-- 日期数字显示 -->
          <span
            :class="[
              'day-number text-sm',
              // 根据是否为今天、当前月份和主题模式设置不同颜色
              day.isToday
                ? 'text-blue-600 font-semibold'
                : day.isCurrentMonth
                ? settingStore.themeMode !== 'dark'
                  ? 'text-gray-800'
                  : 'text-gray-400'
                : settingStore.themeMode !== 'dark'
                ? 'text-gray-400'
                : 'text-gray-800',
            ]"
          >
            {{ day.dayNumber }}
          </span>
          
          <!-- 农历显示 - 根据设置决定是否显示 -->
          <span
            v-if="settingStore.showLunar"
            class="lunar-date text-xs block mt-0.5"
            :class="{
              // 农历月份显示时使用蓝色高亮
              'lunar-month text-blue-500 font-medium': getLunarDate(
                new Date(day.date)
              ).month,
            }"
          >
            {{
              // 优先显示农历月份，否则显示农历日期
              getLunarDate(new Date(day.date)).month ||
              getLunarDate(new Date(day.date)).day
            }}
          </span>
        </div>
        
        <!-- 当天事件列表容器 - 可滚动的事件显示区域 -->
        <div
          class="day-events mt-1 space-y-1 pb-2 custom-scrollbar flex-grow overflow-auto"
        >
          <!-- 单个事件项 - 遍历当天的所有事件 -->
          <div
            v-for="event in eventStore.getEventsForDay(new Date(day.date))"
            :key="event.id"
            :class="[
              // 基础样式：文本大小、内边距、圆角、悬停效果等
              'event-item text-xs p-1 rounded overflow-hidden cursor-pointer transition-all duration-150 ease-in-out hover:transform hover:-translate-y-px hover:scale-[1.01] hover:shadow-lg hover:z-[15] active:transform active:translate-y-0 active:scale-100 active:shadow-blue-500/50 relative border-l-[3px]',
              // 全天事件样式
              event.allDay ? 'all-day-event' : '',
              // 既是事件又是待办的项目使用flex布局
              event.eventType === 'both' ? 'both-event flex flex-col' : '',
            ]"
            :style="{
              // 使用分类颜色作为背景色（透明度33%）和左边框颜色
              backgroundColor: event.categoryColor + '33',
              borderLeftColor: event.categoryColor,
            }"
            @click.stop="
              // 根据事件类型决定点击后的操作
              event.eventType === 'both'
                ? uiStore.openEditTodoModal(event)
                : uiStore.openEventDetails(event)
            "
            draggable="true"
            @dragstart="uiStore.handleDragStart($event, event)"
          >
            <!-- 事件时间区域 -->
            <div class="flex items-center">
              <!-- 待办事项的自定义圆形复选框 -->
              <div
                v-if="event.eventType === 'both'"
                class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1 transition-transform hover:scale-125"
                :class="
                  // 根据完成状态设置不同的背景色和边框色
                  event.completed
                    ? 'bg-indigo-500 border-indigo-600'
                    : 'bg-white border-gray-300'
                "
                @click.stop="eventStore.toggleTodo(event.id)"
              >
                <!-- 已完成时显示勾选图标 -->
                <i
                  v-if="event.completed"
                  class="fas fa-check text-white text-[9px]"
                ></i>
              </div>
              
              <!-- 时间显示 -->
              <div
                class="event-time font-medium"
                :style="{
                  color: 'var(--event-font-color)',
                  // 已完成的待办事项显示删除线
                  textDecoration:
                    event.eventType === 'both' && event.completed
                      ? 'line-through'
                      : 'none',
                  // 已完成的待办事项降低透明度
                  opacity:
                    event.eventType === 'both' && event.completed ? 0.7 : 1,
                }"
              >
                {{
                  // 根据事件类型和持续时间显示不同的时间格式
                  event.allDay
                    ? "All day"
                    : event.eventType === "both"
                    ? formatTime(new Date(event.end), settingStore.hour24)
                    : !isSameDay(new Date(event.start), new Date(event.end))
                    ? getCrossDayLabel(event, day.date, settingStore.hour24)
                    : formatEventTime(event, settingStore.hour24)
                }}
              </div>
            </div>
            
            <!-- 事件标题 -->
            <div
              class="event-title font-medium truncate mb-1"
              :style="{
                color: 'var(--event-font-color)',
                // 已完成的待办事项显示删除线
                textDecoration:
                  event.eventType === 'both' && event.completed
                    ? 'line-through'
                    : 'none',
                // 已完成的待办事项降低透明度
                opacity:
                  event.eventType === 'both' && event.completed ? 0.7 : 1,
              }"
            >
              {{ event.title }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入所需的状态管理store
import { useUiStore } from "../../stores/ui";
import { useEventStore } from "../../stores/event";
import { useSettingStore } from "../../stores/setting";

// 导入工具函数
import {
  formatTime,        // 格式化时间显示
  formatEventTime,   // 格式化事件时间范围
  getContrastColor,  // 获取对比色
  getLunarDate,      // 获取农历日期
  getMonthDays,      // 获取月份日期数组
  getWeekDayNames,   // 获取星期名称数组
  isSameDay,         // 判断是否为同一天
  getCrossDayLabel,  // 获取跨天事件标签
} from "../../utils";

// 初始化store实例
const uiStore = useUiStore();          // UI状态管理
const eventStore = useEventStore();    // 事件数据管理
const settingStore = useSettingStore(); // 用户设置管理
</script>

<style scoped>
/* 日历日期格子的基础样式 */
.calendar-day {
  background-color: var(--bg-secondary);
  border-color: var(--border-color) !important;
}

/* 深色模式下的粘性头部样式 */
.dark-mode .sticky.top-0.z-30 {
  background-color: rgba(30, 32, 40, 0.55);
  backdrop-filter: blur(8px) saturate(1.2);
  -webkit-backdrop-filter: blur(8px) saturate(1.2);
}

/* 农历月份的特殊样式 */
.lunar-month {
  color: #388bfd !important;
  font-weight: 500;
}

/* 响应式字体大小设置 */
.day-number {
  font-size: var(--base-font-size);
}

.event-title {
  font-size: var(--base-font-size);
}

.event-time {
  font-size: var(--small-text-font-size);
}
</style>
