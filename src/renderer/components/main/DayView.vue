<!-- 
 @component DayView.vue
 @description: 日视图组件，负责展示日历的日视图，包含全天事件和时间轴事件的显示,并且提供每个小时时段提供交互功能,同时支持拖拽和调整事件的大小。
 
 主要功能：
 1. 显示24小时时间轴
 2. 渲染全天事件和定时事件
 3. 支持事件拖拽和大小调整
 4. 显示实时时间线
 5. 提供时间段点击交互
 6. 支持待办事项的完成状态切换
-->

<template>
  <div class="day-view flex-1 overflow-visible p-4 min-h-[600px]">
    <div class="grid grid-cols-1 max-h-[1664px] rounded-lg shadow-sm">
      <!-- 日视图头部区域 -->
      <div class="day-header text-center p-4"></div>
      
      <!-- 全天事件显示区域 -->
      <div
        v-if="
          eventStore
            .getEventsForDay(new Date(uiStore.currentDate))
            .some((e) => e.allDay)
        "
        class="sticky top-0 z-30 h-[28px] min-h-[28px] max-h-[28px]"
      >
        <div class="flex items-center h-full">
          <div
            class="flex items-center justify-center text-xs font-semibold text-gray-500 h-[28px] w-16 flex-shrink-0"
          >
            全天
          </div>
          <div class="flex-1 relative h-full overflow-hidden">
            <!-- 渲染全天事件组 - 按组显示，避免重叠 -->
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
                    color: 'var(--event-font-color)',
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
        <!-- 左侧时间标签列 - 显示24小时的时间标签 -->
        <div class="time-labels pr-4 w-20">
          <div
            v-for="hour in 24"
            :key="`hour-${hour}-${currentTime.getTime()}`"
            class="time-label h-16 text-xs text-gray-500 text-right flex items-start justify-end transition-opacity duration-300 ease-in-out"
            :class="{ 'opacity-0': uiStore.shouldHideHourLabel(hour - 1) }"
          >
            {{ formatHour(hour - 1, settingStore.hour24) }}
          </div>
        </div>
        <div class="day-column flex-1 relative">
          <!-- 时间轴基础结构 -->
          <div class="time-axis relative h-full">
            <!-- 创建24条水平分隔线，标识每个整小时点 -->
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-line absolute left-0 right-0 h-px"
              :style="{
                top: `${(hour - 1) * 64 + 8}px`,
                backgroundColor: 'var(--border-color)',
              }"
            ></div>
            
            <!-- 时间格子交互系统 - 为每个小时时段提供交互功能 -->
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-slot h-16 relative cursor-pointer select-none translate-y-2 z-[1] transition-colors duration-150 hover:after:content-[''] hover:after:absolute hover:after:inset-0 hover:after:border hover:after:border-blue-500 hover:after:pointer-events-none hover:after:z-[2]"
              @click="
                uiStore.handleHourClick({ date: uiStore.currentDate }, hour - 1)
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
          <div class="events absolute top-0 left-0 right-0 z-10">
            <!-- 实时时间线 - 仅在日视图中显示 -用实线显示当前时间-->
            <div
              v-if="uiStore.currentView === 'day'"
              class="current-time-line absolute left-0 right-0 pointer-events-none z-30"
              :style="{
                top: `${uiStore.calculateCurrentTimeLine()}px`,
              }"
              :key="currentTime.getTime()"
            >
              <div
                class="time-text absolute -left-[75px] -top-2 w-15 text-right text-blue-500 font-medium"
                style="font-size: calc(var(--small-text-font-size) * 0.9)"
              >
                {{ uiStore.getCurrentTimeText() }}
              </div>
              <div
                class="time-line absolute left-0 right-0 h-0.5 bg-blue-500 top-0"
              ></div>
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
              <!-- 渲染组内的每个事件 判断当前事件的类别，并且通过计算事件开始时间和结束时间来得出所创建事件的高度-->
              <div
                v-for="(event, idx) in group"
                :key="event.id"
                :class="[
                  'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer transition-all duration-150 ease-in-out hover:-translate-y-px hover:shadow-lg hover:z-20 hover:border-l-4 border-l-[3px]',
                  event.eventType === 'both'
                    ? 'both-event-week flex flex-col'
                    : '',
                ]"
                :style="{
                  top:
                    event.eventType === 'both'
                      ? '8px'
                      : `${event.allDay ? 8 : calculateEventTop(event, new Date(uiStore.currentDate)) + 8}px`,
                  height:
                    event.eventType === 'both'
                      ? `${
                          ((new Date(event.end).getHours() * 60 +
                            new Date(event.end).getMinutes()) /
                            60) *
                          64
                        }px`
                      : `${
                          event.allDay ? 1536 : calculateEventHeight(event, new Date(uiStore.currentDate))
                        }px`,
                  left: `calc(${(100 / group.length) * idx}% + 4px)`,
                  width: `calc(${100 / group.length}% - 8px)`,
                  backgroundColor: event.categoryColor + '33',
                  borderLeftColor: event.categoryColor,
                  zIndex: '10',
                  transform:
                    uiStore.draggedEvent && uiStore.draggedEvent.id === event.id
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
                <!-- 顶部调整大小手柄 可以拖拽事件的上边框进行修改事件的开始时间-->
                <div
                  v-if="!event.allDay"
                  class="event-resize-handle top-handle absolute left-0 right-0 top-0 h-1.5 cursor-ns-resize z-20 hover:bg-blue-500/30"
                  @mousedown.stop="
                    uiStore.handleDayEventResize($event, event, 'top')
                  "
                  @click.stop
                ></div>
                
                <!-- 底部调整大小手柄 可以拖拽事件的下边框进行修改事件的截止时间-->
                <div
                  v-if="!event.allDay"
                  class="event-resize-handle bottom-handle absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize z-20 hover:bg-blue-500/30"
                  @mousedown.stop="
                    uiStore.handleDayEventResize($event, event, 'bottom')
                  "
                  @click.stop
                ></div>
                
                <!-- 事件内容区域 -->
                <div class="flex items-center w-full">
                  <!-- 待办事项复选框 对于待办事项的事件可以勾选复选框表明完成该todo事项-->
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
                      opacity:
                        event.eventType === 'both' && event.completed ? 0.7 : 1,
                    }"
                  >
                    {{
                      event.allDay 
                        ? "All Day"
                        : event.eventType === "both"
                        ? formatTime(new Date(event.end), settingStore.hour24)
                        : !isSameDay(new Date(event.start), new Date(event.end))
                        ? getCrossDayLabel(event, uiStore.currentDate, settingStore.hour24)
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
                    opacity:
                      event.eventType === 'both' && event.completed ? 0.7 : 1,
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
                    opacity:
                      event.eventType === 'both' && event.completed ? 0.7 : 1,
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
import { onMounted } from "vue";
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
  isSameDay,
  getCrossDayLabel,
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

.time-axis .time-line {
  background-color: var(--border-color);
}

.dark-mode .time-slot:hover {
  background-color: var(--hour-cell-hover);
}

.time-slot:hover {
  background-color: rgb(239 246 255); 
}
</style>
