<!-- 
 @component WeekView.vue
 @description: 周视图组件，负责展示日历的周视图，包含7天的布局显示，全天事件和时间轴事件的渲染，并且提供每个小时时段的交互功能，同时支持事件拖拽和调整大小。
 
 主要功能：
 1. 显示7天的日期头部布局
 2. 显示24小时时间轴
 3. 渲染全天事件和定时事件
 4. 支持事件拖拽和大小调整
 5. 显示实时时间线
 6. 提供时间段点击交互
 7. 支持待办事项的完成状态切换
 8. 支持重叠事件的聚合显示
-->

<template>
  <!-- 周视图容器 -->
  <div class="week-view flex-1 overflow-visible p-4 min-h-[600px]">
    <!-- 周视图网格布局 -->
    <div class="grid grid-cols-1 max-h-[1664px] rounded-lg shadow-sm">
      <!-- sticky头部：日期栏+全天事件栏 -->
      <div
        class="sticky top-0 z-30 backdrop-blur-md backdrop-saturate-125 bg-white/70"
      >
        <!-- 周视图头部，显示本周7天 - 包含星期几名称和日期数字 -->
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
            class="day-header flex flex-col items-center justify-center p-2"
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
        
        <!-- 全天事件栏 - 仅在有全天事件时显示 -->
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
          <!-- 全天事件标签 -->
          <div
            class="flex items-center justify-center text-xs font-semibold text-gray-500 h-[28px]"
          >
            全天
          </div>
          
          <!-- 渲染每一天的全天事件 -->
          <div
            v-for="(day, idx) in getWeekDays(
              new Date(uiStore.currentDate),
              settingStore.weekStart
            )"
            :key="'allday-' + idx"
            class="relative h-full overflow-hidden"
          >
            <!-- 渲染全天事件组 - 按组显示，避免重叠 -->
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
        <!-- 左侧时间标签列 - 显示24小时的时间标签 -->
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
          <!-- 实时时间线 - 仅在周视图中显示 -->
          <div
            v-if="uiStore.currentView === 'week'"
            class="current-time-line absolute left-0 right-0 pointer-events-none z-30"
            :style="{
              top: `${uiStore.calculateCurrentTimeLine()}px`,
            }"
            :key="currentTime.getTime()"
          >
            <!-- 时间文本显示 -->
            <div
              class="time-text absolute -left-[75px] -top-2 w-15 text-right text-blue-500 font-medium"
              style="font-size: calc(var(--small-text-font-size) * 0.9)"
            >
              {{ uiStore.getCurrentTimeText() }}
            </div>
            <!-- 时间线条 -->
            <div
              class="time-line absolute left-0 right-0 h-0.5 bg-blue-500 top-0"
            ></div>
          </div>
          
          <!-- 小时格子背景 - 为每个小时时段提供交互功能 -->
          <div v-for="hour in 24" :key="hour" class="contents">
            <div
              v-for="(day, idx) in getWeekDays(
                new Date(uiStore.currentDate),
                settingStore.weekStart
              )"
              :key="idx"
              class="hour-cell relative cursor-pointer select-none translate-y-2 z-[1] transition-colors duration-150 hover:after:content-[''] hover:after:absolute hover:after:inset-0 hover:after:border hover:after:border-blue-500 hover:after:pointer-events-none hover:after:z-[2] hover:bg-blue-50"
              @click="uiStore.handleHourClick({ date: day.date }, hour - 1)"
              @dragover.prevent
              @drop="
                uiStore.handleWeekDrop($event, {
                  date: day.date,
                  hour: hour - 1,
                })
              "
            ></div>
          </div>
          
          <!-- 周视图的每小时横线 - 创建24条水平分隔线，标识每个整小时点 -->
          <div
            v-for="h_idx in 24"
            :key="`week-line-${h_idx}`"
            class="absolute left-0 right-0 h-px z-0"
            :style="{
              top: `${(h_idx - 1) * 64 + 8}px`,
              backgroundColor: 'var(--border-color)',
            }"
          ></div>
          
          <!-- 事件渲染区域 - 为每一天创建事件容器 -->
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
            <!-- 渲染当天的事件组 -->
            <template
              v-for="(group, groupIdx) in getEventGroups(
                eventStore
                  .getEventsForDay(new Date(day.date))
                  .filter((e) => !e.allDay)
              )"
              :key="groupIdx"
            >
              <!-- 重叠事件显示+N - 当多个事件重叠时显示聚合数量 -->
              <template v-if="group.length > 1">
                <div
                  class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer flex items-center justify-center text-2xl font-bold z-20"
                  :style="{
                    top: `${
                      Math.min(...group.map((e) => calculateEventTop(e, new Date(day.date)))) + 8
                    }px`,
                    height: `${
                      Math.max(
                        ...group.map(
                          (e) => calculateEventTop(e, new Date(day.date)) + calculateEventHeight(e, new Date(day.date))
                        )
                      ) - Math.min(...group.map((e) => calculateEventTop(e, new Date(day.date)))) ||
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
              
              <!-- 正常显示不重叠的事件 -->
              <template v-else>
                <div
                  v-for="event in group"
                  :key="event.id"
                  :class="[
                    'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer transition-all duration-150 ease-in-out hover:-translate-y-px hover:shadow-lg hover:z-20 hover:border-l-4 border-l-[3px]',
                    event.eventType === 'both'
                      ? 'both-event-week flex flex-col'
                      : '',
                  ]"
                  :style="{
                    top: `${event.allDay ? 8 : calculateEventTop(event, new Date(day.date)) + 8}px`,
                    height: `${
                      event.allDay ? 1536 : calculateEventHeight(event, new Date(day.date))
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
                  <!-- 顶部调整大小手柄 - 可以拖拽事件的上边框进行修改事件的开始时间 -->
                  <div
                    v-if="!event.allDay"
                    class="event-resize-handle top-handle absolute left-0 right-0 top-0 h-1.5 cursor-ns-resize z-20 hover:bg-blue-500/30"
                    @mousedown.stop="
                      uiStore.handleWeekEventResize($event, event, 'top')
                    "
                    @click.stop
                  ></div>
                  
                  <!-- 底部调整大小手柄 - 可以拖拽事件的下边框进行修改事件的截止时间 -->
                  <div
                    v-if="!event.allDay"
                    class="event-resize-handle bottom-handle absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize z-20 hover:bg-blue-500/30"
                    @mousedown.stop="
                      uiStore.handleWeekEventResize($event, event, 'bottom')
                    "
                    @click.stop
                  ></div>
                  
                  <!-- 事件内容区域 -->
                  <div class="flex items-center w-full">
                    <!-- 待办事项复选框 - 对于待办事项的事件可以勾选复选框表明完成该todo事项 -->
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
                    
                    <!-- 事件时间显示 -->
                    <div
                      class="event-time text-xs font-medium"
                      :style="{
                        color: 'var(--event-font-color)',
                        textDecoration:
                          event.eventType === 'both' && event.completed
                            ? 'line-through'
                            : 'none',
                        opacity:
                          event.eventType === 'both' && event.completed
                            ? 0.7
                            : 1,
                      }"
                    >
                      {{
                        event.allDay
                          ? "All Day"
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
                  
                  <!-- 事件描述 -->
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
              </template>
            </template>
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
  getWeekDays,
  getCrossDayLabel,
  isSameDay,
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
