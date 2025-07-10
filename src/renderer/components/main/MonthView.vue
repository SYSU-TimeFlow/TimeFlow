<template>
  <!-- 月视图容器 -->
  <div class="calendar-grid flex-1 overflow-visible p-6 min-h-[800px]">
    <!-- 星期头部 -->
    <div class="grid grid-cols-7 mb-2">
      <div
        v-for="day in getWeekDayNames(settingStore.weekStart)"
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
        v-for="(day, index) in getMonthDays(
          new Date(uiStore.currentDate),
          settingStore.weekStart
        )"
        :key="index"
        :class="[
          'calendar-day border border-gray-200 h-auto min-h-[120px] max-h-[180px] p-1 pb-2 relative flex flex-col transition-all duration-200 ease-in-out hover:bg-gray-50 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/30 hover:z-[5]',
          day.isCurrentMonth ? '' : 'bg-gray-200',
          day.isToday ? 'today relative after:absolute after:top-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-600' : '',
          day.isWeekend ? 'weekend' : '',
        ]"
        @click="uiStore.handleDayClick(day, true)"
        @dragover.prevent
        @drop="uiStore.handleMonthDrop($event, day)"
      >
        <!-- 日期头部，包含日期数字和添加事件按钮 -->
        <div
          :class="[
            'day-header flex justify-between items-center p-1 rounded-t bg-inherit flex-shrink-0 mb-1',
            day.isToday ? 'bg-blue-50' : '',
          ]"
        >
          <span
            :class="[
              'day-number text-sm',
              day.isToday
                ? 'text-blue-600 font-semibold'
                : day.isCurrentMonth
                ? (settingStore.themeMode !== 'dark' ? 'text-gray-800' : 'text-gray-400')
                : (settingStore.themeMode !== 'dark' ? 'text-gray-400' : 'text-gray-800'),
            ]"
          >
            {{ day.dayNumber }}
          </span>
          <!-- 添加农历显示 -->
          <span
            v-if="settingStore.showLunar"
            class="lunar-date text-xs block mt-0.5"
            :class="{
              'lunar-month text-blue-500 font-medium': getLunarDate(new Date(day.date)).month,
            }"
          >
            {{
              getLunarDate(new Date(day.date)).month ||
              getLunarDate(new Date(day.date)).day
            }}
          </span>
        </div>
        <!-- 当天事件列表容器 -->
        <div
          class="day-events mt-1 space-y-1 pb-2 custom-scrollbar flex-grow overflow-auto"
        >
          <!-- 单个事件项 -->
          <div
            v-for="event in eventStore.getEventsForDay(new Date(day.date))"
            :key="event.id"
            :class="[
              'event-item text-xs p-1 rounded overflow-hidden cursor-pointer transition-all duration-150 ease-in-out hover:transform hover:-translate-y-px hover:scale-[1.01] hover:shadow-lg hover:z-[15] active:transform active:translate-y-0 active:scale-100 active:shadow-blue-500/50 relative border-l-[3px]',
              event.allDay ? 'all-day-event' : '',
              event.eventType === 'both' ? 'both-event flex flex-col' : '',
            ]"
            :style="{
              backgroundColor: event.categoryColor + '33',
              borderLeftColor: event.categoryColor,
            }"
            @click.stop="
              event.eventType === 'both'
                ? uiStore.openEditTodoModal(event)
                : uiStore.openEventDetails(event)
            "
            draggable="true"
            @dragstart="uiStore.handleDragStart($event, event)"
          >
            <!-- 事件时间 -->
            <div class="flex items-center">
              <!-- 自定义圆形复选框 -->
              <div
                v-if="event.eventType === 'both'"
                class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1 transition-transform hover:scale-125"
                :class="
                  event.completed
                    ? 'bg-indigo-500 border-indigo-600'
                    : 'bg-white border-gray-300'
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
                  color: 'var(--event-font-color)',
                  textDecoration:
                    event.eventType === 'both' && event.completed
                      ? 'line-through'
                      : 'none',
                  opacity: event.eventType === 'both' && event.completed ? 0.7 : 1,
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
              class="event-title font-medium truncate mb-1"
              :style="{
                color: 'var(--event-font-color)',
                textDecoration:
                  event.eventType === 'both' && event.completed
                    ? 'line-through'
                    : 'none',
                opacity: event.eventType === 'both' && event.completed ? 0.7 : 1,
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
import { useUiStore } from "../../stores/ui";
import { useEventStore } from "../../stores/event";
import { useSettingStore } from "../../stores/setting";
import {
  formatTime,
  formatEventTime,
  getContrastColor,
  getLunarDate,
  getMonthDays,
  getWeekDayNames,
} from "../../utils";

const uiStore = useUiStore();
const eventStore = useEventStore();
const settingStore = useSettingStore();
</script>

<style scoped>
.calendar-day {
  background-color: var(--bg-secondary);
  border-color: var(--border-color) !important;
}

.lunar-month {
  color: #388bfd !important;
  font-weight: 500;
}

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