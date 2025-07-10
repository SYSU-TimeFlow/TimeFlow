<template>
  <!-- 周视图容器 -->
  <div class="week-view flex-1 overflow-visible p-4 min-h-[600px]">
    <!-- 周视图网格布局 -->
    <div class="grid grid-cols-1 max-h-[1664px] rounded-lg shadow-sm">
      <!-- sticky头部：日期栏+全天事件栏 -->
      <div class="sticky top-0 z-30 backdrop-blur-md backdrop-saturate-125 bg-white/70">
        <!-- 周视图头部，显示本周7天 -->
        <div class="grid grid-cols-[80px_repeat(7,1fr)] border-gray-200">
          <!-- 左侧空白，用于对齐时间轴 -->
          <div></div>
          <!-- 渲染每一天的表头（星期几和日期） -->
          <div
            v-for="(day, idx) in getWeekDays(
              new Date(uiStore.currentDate),
              settingStore.weekStart
            )"
            :key="idx"
            class="day-header flex flex-col items-center justify-center p-2 "
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
        <!-- 全天事件栏 -->
        <div
          v-if="
            getWeekDays(
              new Date(uiStore.currentDate),
              settingStore.weekStart
            ).some((day) =>
              eventStore
                .getEventsForDay(new Date(day.date))
                .some((e) => e.allDay)
            )
          "
          class="grid grid-cols-[80px_repeat(7,1fr)] h-[28px] min-h-[28px] max-h-[28px]"
        >
          <div
            class="flex items-center justify-center text-xs font-semibold text-gray-500 h-[28px]"
          >
            全天
          </div>
          <div
            v-for="(day, idx) in getWeekDays(
              new Date(uiStore.currentDate),
              settingStore.weekStart
            )"
            :key="'allday-' + idx"
            class="relative h-full overflow-hidden"
          >
            <template
              v-for="(group, groupIdx) in getEventGroups(
                eventStore
                  .getEventsForDay(new Date(day.date))
                  .filter((e) => e.allDay)
              )"
              :key="'allday-group-' + groupIdx"
            >
              <div
                v-for="(event, eventIdx) in group"
                :key="event.id"
                class="allday-bar absolute rounded px-2 py-0 truncate cursor-pointer border-l-2 h-5"
                :style="{
                  top: `${groupIdx * 24 + 6}px`,
                  left: `calc(${(100 / group.length) * eventIdx}% + 2px)`,
                  width: `calc(${100 / group.length}% - 4px)`,
                  backgroundColor: event.categoryColor + '22',
                  borderColor: event.categoryColor,
                  color: getContrastColor(event.categoryColor),
                  zIndex: 10 + groupIdx,
                }"
                @click.stop="
                  event.eventType === 'both'
                    ? uiStore.openEditTodoModal(event)
                    : uiStore.openEventDetails(event)
                "
              >
                <span
                  class="event-title text-sm font-medium truncate"
                  :style="{
                    color: 'var(--event-font-color)',
                  }"
                >
                  {{ event.title }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
      <!-- 周视图主体内容 -->
      <div class="flex h-full pt-3">
        <!-- 左侧时间标签列 -->
        <div class="time-labels pr-4 w-20">
          <!-- 渲染24小时的时间标签 -->
          <div
            v-for="hour in 24"
            :key="`hour-${hour}-${currentTime.getTime()}`"
            class="time-label h-16 text-xs text-gray-500 text-right flex items-start justify-end transition-opacity duration-300 ease-in-out"
            :class="{ 'opacity-0': uiStore.shouldHideHourLabel(hour - 1) }"
          >
            {{ formatHour(hour - 1, settingStore.hour24) }}
          </div>
        </div>
        <!-- 事件网格区：每一列代表一天 -->
        <div class="flex-1 grid grid-cols-7 relative">
          <!-- 实时时间线 -->
          <div
            v-if="uiStore.currentView === 'week'"
            class="current-time-line absolute left-0 right-0 pointer-events-none z-30"
            :style="{
              top: `${uiStore.calculateCurrentTimeLine()}px`,
            }"
            :key="currentTime.getTime()"
          >
            <div class="time-text absolute -left-[75px] -top-2 w-15 text-right text-blue-500 font-medium" style="font-size: calc(var(--small-text-font-size) * 0.9);">{{ uiStore.getCurrentTimeText() }}</div>
            <div class="time-line absolute left-0 right-0 h-0.5 bg-blue-500 top-0"></div>
          </div>
          <!-- 小时格子背景 -->
          <div v-for="hour in 24" :key="hour" class="contents">
            <div
              v-for="(day, idx) in getWeekDays(
                new Date(uiStore.currentDate),
                settingStore.weekStart
              )"
              :key="idx"
              class="hour-cell relative cursor-pointer select-none translate-y-2 z-[1] transition-colors duration-150 hover:after:content-[''] hover:after:absolute hover:after:inset-0 hover:after:border hover:after:border-blue-500 hover:after:pointer-events-none hover:after:z-[2] hover:bg-blue-50"
              @click="uiStore.handleHourClick({date: day.date}, hour - 1)"
              @dragover.prevent
              @drop="uiStore.handleWeekDrop($event, {
                date: day.date,
                hour: hour - 1,
              })"
            ></div>
          </div>
          <!-- 周视图的每小时横线 -->
          <div
            v-for="h_idx in 24"
            :key="`week-line-${h_idx}`"
            class="absolute left-0 right-0 h-px z-0"
            :style="{
              top: `${(h_idx - 1) * 64 + 8}px`,
              backgroundColor: 'var(--border-color)',
            }"
          ></div>
          <!-- 事件渲染区域 -->
          <div
            v-for="(day, idx) in getWeekDays(
              new Date(uiStore.currentDate),
              settingStore.weekStart
            )"
            :key="idx"
            class="absolute left-0 top-0 h-full"
            :style="{
              width: `calc(100% / 7)`,
              left: `calc(${(100 * idx) / 7}% )`,
            }"
          >
            <template
              v-for="(group, groupIdx) in getEventGroups(
                eventStore
                  .getEventsForDay(new Date(day.date))
                  .filter((e) => !e.allDay)
              )"
              :key="groupIdx"
            >
              <!-- 重叠事件显示+N -->
              <template v-if="group.length > 1">
                <div
                  class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer flex items-center justify-center text-2xl font-bold z-20"
                  :style="{
                    top: `${
                      Math.min(...group.map((e) => calculateEventTop(e))) + 8
                    }px`,
                    height: `${
                      Math.max(
                        ...group.map(
                          (e) =>
                            calculateEventTop(e) + calculateEventHeight(e)
                        )
                      ) -
                        Math.min(...group.map((e) => calculateEventTop(e))) ||
                      64
                    }px`,
                    left: '4px',
                    right: '4px',
                    backgroundColor: group[0].categoryColor + '33',
                    borderLeft: `3px solid ${group[0].categoryColor}`,
                    color: group[0].categoryColor,
                  }"
                  @click="
                    uiStore.currentView = 'day';
                    uiStore.currentDate = day.date;
                  "
                >
                  +{{ group.length }}
                </div>
              </template>
              <template v-else>
                <!-- 正常显示不重叠的事件 -->
                <div
                  v-for="event in group"
                  :key="event.id"
                  :class="[
                    'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer transition-all duration-150 ease-in-out hover:-translate-y-px hover:shadow-lg hover:z-20 hover:border-l-4 border-l-[3px]',
                    event.eventType === 'both' ? 'both-event-week flex flex-col' : '',
                  ]"
                  :style="{
                    top: `${
                      event.allDay ? 8 : calculateEventTop(event) + 8
                    }px`,
                    height: `${
                      event.allDay ? 1536 : calculateEventHeight(event)
                    }px`,
                    left: '4px',
                    right: '4px',
                    backgroundColor: event.categoryColor + '33',
                    borderLeftColor: event.categoryColor,
                    zIndex: '10',
                    transform:
                      uiStore.draggedEvent?.id === event.id
                        ? `translateY(${uiStore.calculateDragOffset(event)})`
                        : 'none',
                  }"
                  @click.stop="
                    event.eventType === 'both'
                      ? uiStore.openEditTodoModal(event)
                      : uiStore.openEventDetails(event)
                  "
                  draggable="true"
                  @dragstart="uiStore.handleDragStart($event, event)"
                >
                  <!-- 事件调整大小手柄 -->
                  <div
                    v-if="!event.allDay"
                    class="event-resize-handle top-handle absolute left-0 right-0 top-0 h-1.5 cursor-ns-resize z-20 hover:bg-blue-500/30"
                    @mousedown.stop="
                      uiStore.handleWeekEventResize($event, event, 'top')
                    "
                    @click.stop
                  ></div>
                  <div
                    v-if="!event.allDay"
                    class="event-resize-handle bottom-handle absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize z-20 hover:bg-blue-500/30"
                    @mousedown.stop="
                      uiStore.handleWeekEventResize($event, event, 'bottom')
                    "
                    @click.stop
                  ></div>
                  <div class="flex items-center w-full">
                    <!-- 复选框 -->
                    <div
                      v-if="event.eventType === 'both'"
                      class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1"
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
                    <div
                      class="event-time text-xs font-medium"
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
                          ? formatTime(
                              new Date(event.end),
                              settingStore.hour24
                            )
                          : formatEventTime(event, settingStore.hour24)
                      }}
                    </div>
                  </div>
                  <div
                    class="event-title text-sm font-medium truncate"
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
                  <div
                    v-if="event.description"
                    class="event-description text-xs truncate text-gray-600"
                    :style="{
                      textDecoration:
                        event.eventType === 'both' && event.completed
                          ? 'line-through'
                          : 'none',
                      opacity: event.eventType === 'both' && event.completed ? 0.7 : 1,
                    }"
                  >
                    {{ event.description }}
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUiStore } from "../../stores/ui";
import { useEventStore } from "../../stores/event";
import { useSettingStore } from "../../stores/setting";
import {
  formatHour,
  formatTime,
  formatEventTime,
  calculateEventHeight,
  calculateEventTop,
  getContrastColor,
  getEventGroups,
  getWeekDays,
} from "../../utils";

defineProps<{
  currentTime: Date;
}>();

const uiStore = useUiStore();
const eventStore = useEventStore();
const settingStore = useSettingStore();

onMounted(() => {
  uiStore.scrollToCurrentTimeLine();
});
</script>

<style scoped>
.time-label {
  color: var(--text-tertiary);
  font-size: var(--small-text-font-size);
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

.dark-mode .hour-cell:hover {
  background-color: var(--hour-cell-hover);
}

.dark-mode .sticky.top-0.z-30 {
  background-color: rgba(30, 32, 40, 0.55);
  backdrop-filter: blur(8px) saturate(1.2);
  -webkit-backdrop-filter: blur(8px) saturate(1.2);
}
</style>