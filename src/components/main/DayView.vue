<template>
  <!-- 日视图容器 -->
  <div class="day-view flex-1 overflow-visible p-4 min-h-[600px]">
    <!-- 日视图网格布局 -->
    <div class="grid grid-cols-1 max-h-[1664px] rounded-lg shadow-sm">
      <!-- 日视图头部 -->
      <div
        class="day-header text-center p-4 "
      >
      </div>
      <!-- 全天事件栏 -->
      <div
        v-if="
          eventStore
            .getEventsForDay(new Date(uiStore.currentDate))
            .some((e) => e.allDay)
        "
        class="sticky top-0 z-30  h-[28px] min-h-[28px] max-h-[28px]"
      >
        <div class="flex items-center h-full">
          <div
            class="flex items-center justify-center text-xs font-semibold text-gray-500 h-[28px] w-16 flex-shrink-0"
          >
            全天
          </div>
          <div class="flex-1 relative h-full overflow-hidden">
            <template
              v-for="(group, groupIdx) in getEventGroups(
                eventStore
                  .getEventsForDay(new Date(uiStore.currentDate))
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
                    color: getContrastColor(event.categoryColor),
                    textDecoration:
                      event.eventType === 'both' && event.completed
                        ? 'line-through'
                        : 'none',
                  }"
                >
                  {{ event.title }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
      <!-- 日视图主体内容 -->
      <div class="flex h-full pt-3">
        <!-- 左侧时间标签列 -->
        <div class="time-labels pr-4 w-20">
          <div
            v-for="hour in 24"
            :key="`hour-${hour}-${currentTime.getTime()}`"
            class="time-label h-16 text-xs text-gray-500 text-right translate-y-2 flex items-start justify-end transition-opacity duration-300 ease-in-out"
            :class="{ 'opacity-0': uiStore.shouldHideHourLabel(hour - 1) }"
          >
            {{ formatHour(hour - 1, settingStore.hour24) }}
          </div>
        </div>
        <!-- 事件显示列 -->
        <div class="day-column flex-1 relative">
          <!-- 时间轴背景 -->
          <div class="time-axis relative h-full">
            <!-- 整点时间线 -->
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-line absolute left-0 right-0 h-px"
              :style="{
                top: `${(hour - 1) * 64 + 8}px`,
                backgroundColor: 'var(--border-color)',
              }"
            ></div>
            <!-- 时间格子 -->
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-slot h-16 relative transition-colors duration-150 hover:before:content-[''] hover:before:absolute hover:before:inset-2 hover:before:bg-blue-50 hover:before:z-[1] hover:after:content-[''] hover:after:absolute hover:after:inset-2 hover:after:border hover:after:border-blue-500 hover:after:pointer-events-none hover:after:z-[2]"
              @click="
                uiStore.handleHourClick(
                  { date: uiStore.currentDate },
                  hour - 1
                )
              "
              @dragover.prevent
              @drop="
                uiStore.handleDayDrop($event, {
                  date: uiStore.currentDate,
                  hour: hour - 1,
                })
              "
            ></div>
          </div>
          <!-- 事件渲染区域 -->
          <div class="events absolute top-0 left-0 right-0 z-10">
            <!-- 实时时间线 -->
            <div
              v-if="uiStore.currentView === 'day'"
              class="current-time-line absolute left-0 right-0 pointer-events-none z-30"
              :style="{
                top: `${uiStore.calculateCurrentTimeLine()}px`,
              }"
              :key="currentTime.getTime()"
            >
              <div class="time-text absolute -left-[75px] -top-2 w-15 text-right text-blue-500 font-medium" style="font-size: calc(var(--small-text-font-size) * 0.9);">{{ uiStore.getCurrentTimeText() }}</div>
              <div class="time-line absolute left-0 right-0 h-0.5 bg-blue-500 top-0"></div>
            </div>
            <!-- 日视图事件渲染 -->
            <div
              v-for="(group, groupIdx) in getEventGroups(
                eventStore
                  .getEventsForDay(new Date(uiStore.currentDate))
                  .filter((e) => !e.allDay)
              )"
              :key="groupIdx"
            >
              <div
                v-for="(event, idx) in group"
                :key="event.id"
                :class="[
                  'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer transition-all duration-150 ease-in-out hover:-translate-y-px hover:shadow-lg hover:z-20 hover:border-l-4 border-l-[3px]',
                  event.eventType === 'both' ? 'both-event-week flex flex-col' : '',
                ]"
                :style="{
                  top:
                    event.eventType === 'both'
                      ? '8px'
                      : `${
                          event.allDay ? 8 : calculateEventTop(event) + 8
                        }px`,
                  height:
                    event.eventType === 'both'
                      ? `${
                          ((new Date(event.end).getHours() * 60 +
                            new Date(event.end).getMinutes()) /
                            60) *
                          64
                        }px`
                      : `${
                          event.allDay ? 1536 : calculateEventHeight(event)
                        }px`,
                  left: `calc(${(100 / group.length) * idx}% + 4px)`,
                  width: `calc(${100 / group.length}% - 8px)`,
                  backgroundColor: event.categoryColor + '33',
                  borderLeftColor: event.categoryColor,
                  zIndex: '10',
                  transform:
                    uiStore.draggedEvent &&
                    uiStore.draggedEvent.id === event.id
                      ? `translateY(${uiStore.calculateDragOffset(event)})`
                      : 'none',
                  pointerEvents: uiStore.draggedEvent
                    ? uiStore.draggedEvent.id === event.id
                      ? 'auto'
                      : 'none'
                    : 'auto',
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
                    uiStore.handleDayEventResize($event, event, 'top')
                  "
                  @click.stop
                ></div>
                <div
                  v-if="!event.allDay"
                  class="event-resize-handle bottom-handle absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize z-20 hover:bg-blue-500/30"
                  @mousedown.stop="
                    uiStore.handleDayEventResize($event, event, 'bottom')
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
                      opacity: event.eventType === 'both' && event.completed ? 0.7 : 1,
                    }"
                  >
                    {{
                      event.eventType === "both"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useEventStore } from "@/stores/event";
import { useSettingStore } from "@/stores/setting";
import {
  formatHour,
  formatTime,
  formatEventTime,
  calculateEventHeight,
  calculateEventTop,
  getContrastColor,
  getEventGroups,
} from "@/utils";

defineProps<{
  currentTime: Date;
}>();

const uiStore = useUiStore();
const eventStore = useEventStore();
const settingStore = useSettingStore();
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

.time-axis .time-line {
  background-color: var(--border-color);
}
</style>