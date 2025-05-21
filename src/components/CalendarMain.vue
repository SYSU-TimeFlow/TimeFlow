<template>
  <main class="calendar-main flex-1 flex flex-col overflow-hidden">
    <div class="calendar-header p-6 flex items-center justify-between">
      <div class="flex items-center">
        <h2 class="text-2xl font-semibold mr-4">{{ calendarTitle }}</h2>
        <div class="navigation-buttons flex space-x-2">
          <button
            @click="$emit('go-to-today')"
            class="py-1 px-3 border border-gray-300 rounded-md text-sm hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            Today
          </button>
          <button
            @click="$emit('navigate-calendar', 'prev')"
            class="p-1 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <button
            @click="$emit('navigate-calendar', 'next')"
            class="p-1 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <div class="flex items-center space-x-3">
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
        <button
          class="p-2 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-filter text-gray-600"></i>
        </button>
      </div>
    </div>
    <div
      v-if="currentView === 'month'"
      class="calendar-grid flex-1 overflow-auto p-6"
    >
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-sm font-medium text-gray-500 pb-2 text-center"
        >
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7 grid-rows-6 gap-1 h-full">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[
            'calendar-day border border-gray-200 h-[180px] p-1 relative overflow-hidden',
            day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
            day.isToday ? 'today' : '',
            day.isWeekend ? 'weekend' : '',
          ]"
          @click="$emit('handle-day-click', day)"
          @dragover.prevent
          @drop="$emit('handle-drop', $event, day)"
        >
          <div
            :class="[
              'day-header flex justify-between items-center p-1 rounded-t',
              day.isToday ? 'bg-blue-50' : '',
            ]"
          >
            <span
              :class="[
                'day-number text-sm',
                day.isToday
                  ? 'text-blue-600 font-semibold'
                  : day.isCurrentMonth
                  ? 'text-gray-800'
                  : 'text-gray-400',
              ]"
            >
              {{ day.dayNumber }}
            </span>
            <button
              v-if="day.isCurrentMonth"
              class="add-event-day text-xs text-gray-400 hover:text-gray-600 cursor-pointer !rounded-button whitespace-nowrap"
              @click.stop="$emit('handle-day-click', day, true)"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div
            class="day-events mt-1 space-y-1 h-[130px] overflow-y-auto custom-scrollbar"
          >
            <div
              v-for="event in getEventsForDay(day.date)"
              :key="event.id"
              :class="[
                'event-item text-xs p-1 rounded overflow-hidden cursor-pointer',
                event.allDay ? 'all-day-event' : '',
              ]"
              :style="{
                backgroundColor: event.categoryColor + '33',
                borderLeft: `3px solid ${event.categoryColor}`,
              }"
              @click.stop="$emit('open-event-details', event)"
              draggable="true"
              @dragstart="$emit('handle-drag-start', $event, event)"
            >
              <div
                class="event-time font-medium"
                :style="{ color: event.categoryColor }"
              >
                {{ event.allDay ? "All day" : formatEventTime(event) }}
              </div>
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
    <div
      v-else-if="currentView === 'week'"
      class="week-view flex-1 overflow-auto p-6"
    >
      <div class="grid grid-cols-8 h-full border border-gray-200">
        <div class="time-labels border-r border-gray-200 pt-16">
          <div
            v-for="hour in 24"
            :key="hour"
            class="time-label h-12 -mt-3 text-xs text-gray-500 text-right pr-2"
          >
            {{ formatHour(hour - 1) }}
          </div>
        </div>
        <div
          v-for="(day, index) in weekViewDays"
          :key="index"
          class="day-column relative"
        >
          <div
            class="day-header text-center p-2 border-b border-gray-200 sticky top-0 bg-white z-10"
          >
            <div class="text-sm font-medium">{{ day.dayName }}</div>
            <div
              :class="[
                'text-lg rounded-full w-8 h-8 flex items-center justify-center mx-auto',
                day.isToday ? 'bg-blue-600 text-white' : '',
              ]"
            >
              {{ day.dayNumber }}
            </div>
          </div>
          <div class="hours-grid">
            <div
              v-for="hour in 24"
              :key="hour"
              class="hour-cell h-12 border-b border-gray-200 relative"
              @click="$emit('handle-hour-click', day, hour - 1)"
            ></div>
          </div>
          <div class="events absolute top-16 left-0 right-0">
            <div
              v-for="event in day.events"
              :key="event.id"
              class="week-event absolute rounded-sm px-1 overflow-hidden cursor-pointer"
              :style="{
                top: `${calculateEventTop(event)}px`,
                height: `${calculateEventHeight(event)}px`,
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
    <div
      v-else-if="currentView === 'day'"
      class="day-view flex-1 overflow-auto p-6"
    >
      <div class="grid grid-cols-1 h-full border border-gray-200">
        <div
          class="day-header text-center p-4 border-b border-gray-200 bg-white"
        >
          <div class="text-2xl font-semibold">{{ dayViewTitle }}</div>
        </div>
        <div class="flex h-full">
          <div class="time-labels border-r border-gray-200 pr-4 w-20">
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-label h-16 -mt-3 text-xs text-gray-500 text-right"
            >
              {{ formatHour(hour - 1) }}
            </div>
          </div>
          <div class="day-column flex-1 relative">
            <div class="hours-grid">
              <div
                v-for="hour in 24"
                :key="hour"
                class="hour-cell h-16 border-b border-gray-200 relative"
                @click="$emit('handle-hour-click', currentDate, hour - 1)"
              ></div>
            </div>
            <div class="events absolute top-0 left-0 right-0">
              <div
                v-for="event in dayViewEvents"
                :key="event.id"
                class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer"
                :style="{
                  top: `${calculateEventTop(event)}px`,
                  height: `${calculateEventHeight(event)}px`,
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
import { defineProps } from "vue";

const props = defineProps({
  currentView: String,
  currentDate: Date,
  calendarDays: Array,
  weekViewDays: Array,
  dayViewEvents: Array,
  events: Object, // 确保 events 是数组类型
  calendarTitle: String,
  dayViewTitle: String,
});
// const { events } = toRefs(props); // 使用 toRefs 解包 Ref
defineEmits([
  "navigate-calendar",
  "go-to-today",
  "handle-day-click",
  "handle-hour-click",
  "open-event-details",
  "handle-drag-start",
  "handle-drop",
]);

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getEventsForDay(date) {
  // Check if props.events and props.events.value exist
  if (!props.events || !props.events.value) {
    console.warn('Events are not available');
    return [];
  }
  const eventsArray = props.events.value;
  if (!Array.isArray(eventsArray)) {
    console.warn('Events is not an array');
    return [];
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return eventsArray
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        (eventStart >= start && eventStart <= end) ||
        (eventEnd >= start && eventEnd <= end) ||
        (eventStart <= start && eventEnd >= end)
      );
    })
    .sort((a, b) => {
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();
      if (aStart === bStart) {
        return new Date(a.end).getTime() - new Date(b.end).getTime();
      }
      return aStart - bStart;
    });
}
function formatEventTime(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return `${formatTime(start)} - ${formatTime(end)}`;
}
function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
function formatHour(hour) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(2025, 0, 1, hour));
}
function calculateEventTop(event) {
  const start = new Date(event.start);
  return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64;
}
function calculateEventHeight(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.max(durationHours * 64, 24);
}
function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
</script>

<style scoped>
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
.calendar-day:hover {
  background-color: #f9fafb;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
.hour-cell:hover {
  background-color: #f9fafb;
}
</style>
