<!-- The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work. -->
<template>
  <div class="calendar-app min-h-screen bg-white text-gray-800 flex flex-col">
    <!-- Header with window controls -->
    <header
      class="app-header bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between"
    >
      <div class="flex items-center">
        <h1 class="text-xl font-semibold text-gray-800">Personal Calendar</h1>
      </div>
      <div class="window-controls flex items-center space-x-4">
        <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
          <i class="fas fa-bell"></i>
        </button>
        <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
          <i class="fas fa-cog"></i>
        </button>
        <div class="window-actions flex space-x-2">
          <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
            <i class="fas fa-window-minimize"></i>
          </button>
          <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
            <i class="fas fa-window-maximize"></i>
          </button>
          <button class="text-red-500 hover:text-red-700 cursor-pointer">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </header>
    <!-- Main content area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside
        :class="[
          'sidebar bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
        ]"
      >
        <!-- Sidebar toggle -->
        <button
          @click="toggleSidebar"
          class="sidebar-toggle self-end p-2 m-2 text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i
            :class="
              sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'
            "
          ></i>
        </button>
        <!-- Add Event Button -->
        <button
          @click="openNewEventModal"
          class="add-event-btn mx-4 my-3 py-2 px-4 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-plus mr-2"></i>
          <span v-if="!sidebarCollapsed">Add Event</span>
        </button>
        <!-- Mini Calendar -->
        <div class="mini-calendar mx-4 my-3 bg-white rounded-lg shadow-sm p-3">
          <div class="flex justify-between items-center mb-2">
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">{{
              miniCalendarTitle
            }}</span>
            <div class="flex space-x-1">
              <button
                @click="prevMonth"
                class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
              >
                <i class="fas fa-chevron-left text-xs"></i>
              </button>
              <button
                @click="nextMonth"
                class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
              >
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
          <div
            v-if="!sidebarCollapsed"
            class="grid grid-cols-7 gap-1 text-center"
          >
            <span
              v-for="day in weekDaysShort"
              :key="day"
              class="text-xs text-gray-500"
              >{{ day }}</span
            >
            <div
              v-for="(day, index) in miniCalendarDays"
              :key="index"
              :class="[
                'mini-day text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer',
                day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400',
                day.isToday ? 'bg-blue-100 text-blue-600 font-medium' : '',
                day.isSelected ? 'bg-blue-600 text-white' : '',
              ]"
              @click="selectDate(day.date)"
            >
              {{ day.dayNumber }}
            </div>
          </div>
        </div>
        <!-- View Selector -->
        <div class="view-selector mx-4 my-3">
          <div
            v-if="!sidebarCollapsed"
            class="text-sm font-medium mb-2 text-gray-700"
          >
            View
          </div>
          <div class="flex flex-col space-y-1">
            <button
              v-for="view in calendarViews"
              :key="view.id"
              @click="changeView(view.id)"
              :class="[
                'view-btn flex items-center py-2 px-3 rounded-lg cursor-pointer !rounded-button whitespace-nowrap',
                currentView === view.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-200',
              ]"
            >
              <i
                :class="`fas ${view.icon} ${sidebarCollapsed ? '' : 'mr-3'}`"
              ></i>
              <span v-if="!sidebarCollapsed">{{ view.label }}</span>
            </button>
          </div>
        </div>
        <!-- Categories -->
        <div class="categories mx-4 my-3">
          <div
            v-if="!sidebarCollapsed"
            class="flex items-center justify-between mb-2"
          >
            <span class="text-sm font-medium text-gray-700">Categories</span>
            <button
              class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
            >
              <i class="fas fa-plus text-xs"></i>
            </button>
          </div>
          <div class="flex flex-col space-y-1">
            <div
              v-for="category in categories"
              :key="category.id"
              :class="[
                'category-item flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-200',
                category.active ? '' : 'opacity-50',
              ]"
              @click="toggleCategory(category.id)"
            >
              <span
                :class="[
                  'category-color w-3 h-3 rounded-full',
                  sidebarCollapsed ? '' : 'mr-3',
                ]"
                :style="{ backgroundColor: category.color }"
              ></span>
              <span v-if="!sidebarCollapsed" class="text-sm">{{
                category.name
              }}</span>
            </div>
          </div>
        </div>
        <!-- Sync Status -->
        <div class="sync-status mt-auto mx-4 my-3 flex items-center">
          <span
            :class="[
              'sync-indicator w-2 h-2 rounded-full',
              synced ? 'bg-green-500' : 'bg-yellow-500',
            ]"
          ></span>
          <span v-if="!sidebarCollapsed" class="text-xs text-gray-500 ml-2">
            {{ synced ? "Synced with system calendar" : "Sync pending..." }}
          </span>
        </div>
      </aside>
      <!-- Main Calendar Area -->
      <main class="calendar-main flex-1 flex flex-col overflow-hidden">
        <!-- Calendar Header -->
        <div class="calendar-header p-6 flex items-center justify-between">
          <div class="flex items-center">
            <h2 class="text-2xl font-semibold mr-4">{{ calendarTitle }}</h2>
            <div class="navigation-buttons flex space-x-2">
              <button
                @click="goToToday"
                class="py-1 px-3 border border-gray-300 rounded-md text-sm hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
              >
                Today
              </button>
              <button
                @click="navigateCalendar('prev')"
                class="p-1 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              <button
                @click="navigateCalendar('next')"
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
        <!-- Month View Calendar -->
        <div
          v-if="currentView === 'month'"
          class="calendar-grid flex-1 overflow-auto p-6"
        >
          <!-- Weekday Headers -->
          <div class="grid grid-cols-7 mb-2">
            <div
              v-for="day in weekDays"
              :key="day"
              class="text-sm font-medium text-gray-500 pb-2 text-center"
            >
              {{ day }}
            </div>
          </div>
          <!-- Calendar Days -->
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
              @click="handleDayClick(day)"
              @dragover.prevent
              @drop="handleDrop($event, day)"
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
                  @click.stop="handleDayClick(day, true)"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <!-- Day Events -->
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
                  @click.stop="openEventDetails(event)"
                  draggable="true"
                  @dragstart="handleDragStart($event, event)"
                >
                  <div
                    class="event-time font-medium"
                    :style="{ color: event.categoryColor }"
                    :id="`event-time-${event.id}`"
                    @click.stop="openEventDetails(event)"
                  >
                    {{ event.allDay ? "All day" : formatEventTime(event) }}
                  </div>
                  <div
                    class="event-title font-medium truncate"
                    :style="{ color: getContrastColor(event.categoryColor) }"
                    @click.stop="openEventDetails(event)"
                  >
                    {{ event.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Week View Calendar -->
        <div
          v-else-if="currentView === 'week'"
          class="week-view flex-1 overflow-auto p-6"
        >
          <div class="grid grid-cols-8 h-full border border-gray-200">
            <!-- Time labels column -->
            <div class="time-labels border-r border-gray-200 pt-16">
              <div
                v-for="hour in 24"
                :key="hour"
                class="time-label h-12 -mt-3 text-xs text-gray-500 text-right pr-2"
              >
                {{ formatHour(hour - 1) }}
              </div>
            </div>
            <!-- Days columns -->
            <div
              v-for="(day, index) in weekViewDays"
              :key="index"
              class="day-column relative"
            >
              <!-- Day header -->
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
              <!-- Hour cells -->
              <div class="hours-grid">
                <div
                  v-for="hour in 24"
                  :key="hour"
                  class="hour-cell h-12 border-b border-gray-200 relative"
                  @click="handleHourClick(day, hour - 1)"
                ></div>
              </div>
              <!-- Events -->
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
                  @click.stop="openEventDetails(event)"
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
        <!-- Day View Calendar -->
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
              <!-- Time labels column -->
              <div class="time-labels border-r border-gray-200 pr-4 w-20">
                <div
                  v-for="hour in 24"
                  :key="hour"
                  class="time-label h-16 -mt-3 text-xs text-gray-500 text-right"
                >
                  {{ formatHour(hour - 1) }}
                </div>
              </div>
              <!-- Day column -->
              <div class="day-column flex-1 relative">
                <!-- Hour cells -->
                <div class="hours-grid">
                  <div
                    v-for="hour in 24"
                    :key="hour"
                    class="hour-cell h-16 border-b border-gray-200 relative"
                    @click="handleHourClick(selectedDate, hour - 1)"
                  ></div>
                </div>
                <!-- Events -->
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
                    @click.stop="openEventDetails(event)"
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
                    <div
                      class="event-description text-xs truncate text-gray-600"
                    >
                      {{ event.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <!-- Event Modal -->
    <div
      v-if="showEventModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="event-modal bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden"
        @click.stop
      >
        <div
          class="modal-header p-4 border-b border-gray-200 flex justify-between items-center"
          :style="{ backgroundColor: currentEvent.categoryColor + '33' }"
        >
          <h3 class="text-lg font-semibold">
            {{ isNewEvent ? "New Event" : "Edit Event" }}
          </h3>
          <button
            @click="closeEventModal"
            class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body p-4">
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Title</label
            >
            <input
              v-model="currentEvent.title"
              type="text"
              class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Event title"
            />
          </div>
          <div class="form-row flex space-x-4 mb-4">
            <div class="form-group flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Start</label
              >
              <input
                v-model="currentEvent.start"
                type="datetime-local"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="form-group flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >End</label
              >
              <input
                v-model="currentEvent.end"
                type="datetime-local"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="form-group mb-4">
            <div class="flex items-center mb-2">
              <input
                v-model="currentEvent.allDay"
                type="checkbox"
                id="allDay"
                class="mr-2"
              />
              <label for="allDay" class="text-sm text-gray-700"
                >All day event</label
              >
            </div>
          </div>
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Category</label
            >
            <div class="category-selector flex flex-wrap gap-2">
              <button
                v-for="category in categories"
                :key="category.id"
                :class="[
                  'category-option w-8 h-8 rounded-full border-2',
                  currentEvent.categoryId === category.id
                    ? 'border-gray-800'
                    : 'border-transparent',
                ]"
                :style="{ backgroundColor: category.color }"
                @click="
                  currentEvent.categoryId = category.id;
                  currentEvent.categoryColor = category.color;
                "
                class="cursor-pointer !rounded-button whitespace-nowrap"
              ></button>
            </div>
          </div>
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Description</label
            >
            <textarea
              v-model="currentEvent.description"
              class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
              placeholder="Event description"
            ></textarea>
          </div>
          <div class="form-group mb-4">
            <div class="flex items-center mb-2">
              <input
                v-model="currentEvent.syncWithSystem"
                type="checkbox"
                id="syncWithSystem"
                class="mr-2"
              />
              <label for="syncWithSystem" class="text-sm text-gray-700"
                >Sync with system calendar</label
              >
            </div>
          </div>
        </div>
        <div
          class="modal-footer p-4 border-t border-gray-200 flex justify-end space-x-3"
        >
          <button
            v-if="!isNewEvent"
            @click="deleteEvent"
            class="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer !rounded-button whitespace-nowrap"
          >
            Delete
          </button>
          <button
            @click="closeEventModal"
            class="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            @click="saveEvent"
            class="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer !rounded-button whitespace-nowrap"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from "vue";
// Calendar views
const calendarViews = [
  { id: "month", label: "Month", icon: "fa-calendar-alt" },
  { id: "week", label: "Week", icon: "fa-calendar-week" },
  { id: "day", label: "Day", icon: "fa-calendar-day" },
];
// Categories
const categories = ref([
  { id: 1, name: "Work", color: "#4f46e5", active: true },
  { id: 2, name: "Personal", color: "#10b981", active: true },
  { id: 3, name: "Family", color: "#f59e0b", active: true },
  { id: 4, name: "Health", color: "#ef4444", active: true },
  { id: 5, name: "Other", color: "#8b5cf6", active: true },
]);
// Calendar state
const currentView = ref("month");
const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const miniCalendarDate = ref(new Date());
const sidebarCollapsed = ref(false);
const synced = ref(true);
const draggedEvent = ref(null);
// Event modal state
const showEventModal = ref(false);
const isNewEvent = ref(true);
const currentEvent = ref({
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
// Sample events data
const events = ref([
  {
    id: 1,
    title: "Team Meeting",
    start: new Date(2025, 4, 18, 10, 0),
    end: new Date(2025, 4, 18, 11, 30),
    description: "Weekly team sync-up",
    categoryId: 1,
    categoryColor: "#4f46e5",
    allDay: false,
    syncWithSystem: true,
  },
  {
    id: 2,
    title: "Dentist Appointment",
    start: new Date(2025, 4, 20, 14, 0),
    end: new Date(2025, 4, 20, 15, 0),
    description: "Regular checkup",
    categoryId: 4,
    categoryColor: "#ef4444",
    allDay: false,
    syncWithSystem: true,
  },
  {
    id: 3,
    title: "Birthday Party",
    start: new Date(2025, 4, 22, 18, 0),
    end: new Date(2025, 4, 22, 22, 0),
    description: "John's birthday celebration",
    categoryId: 3,
    categoryColor: "#f59e0b",
    allDay: false,
    syncWithSystem: true,
  },
  {
    id: 4,
    title: "Project Deadline",
    start: new Date(2025, 4, 25, 0, 0),
    end: new Date(2025, 4, 25, 23, 59),
    description: "Final submission for Q2 project",
    categoryId: 1,
    categoryColor: "#4f46e5",
    allDay: true,
    syncWithSystem: true,
  },
  {
    id: 5,
    title: "Gym Session",
    start: new Date(2025, 4, 19, 7, 0),
    end: new Date(2025, 4, 19, 8, 30),
    description: "Morning workout",
    categoryId: 4,
    categoryColor: "#ef4444",
    allDay: false,
    syncWithSystem: false,
  },
]);
// Computed properties
const weekDays = computed(() => [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);
const weekDaysShort = computed(() => [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
]);
const calendarTitle = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };
  if (currentView.value === "week") {
    return `Week of ${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(getStartOfWeek(currentDate.value))} - ${new Intl.DateTimeFormat(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    ).format(getEndOfWeek(currentDate.value))}`;
  } else if (currentView.value === "day") {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(currentDate.value);
  }
  return new Intl.DateTimeFormat("en-US", options).format(currentDate.value);
});
const miniCalendarTitle = computed(() => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(miniCalendarDate.value);
});
const dayViewTitle = computed(() => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(currentDate.value);
});
// Calendar days for month view
const calendarDays = computed(() => {
  const days = [];
  const monthStart = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    0
  );
  const startDate = getStartOfWeek(monthStart);
  const endDate = getEndOfWeek(monthEnd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let currentDay = new Date(startDate);
  while (currentDay <= endDate) {
    const isCurrentMonth =
      currentDay.getMonth() === currentDate.value.getMonth();
    const isToday = currentDay.getTime() === today.getTime();
    const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
    days.push({
      date: new Date(currentDay),
      dayNumber: currentDay.getDate(),
      isCurrentMonth,
      isToday,
      isWeekend,
    });
    currentDay.setDate(currentDay.getDate() + 1);
  }
  return days;
});
// Mini calendar days
const miniCalendarDays = computed(() => {
  const days = [];
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
// Week view days
const weekViewDays = computed(() => {
  const days = [];
  const startOfWeek = getStartOfWeek(currentDate.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    const isToday = day.getTime() === today.getTime();
    days.push({
      date: new Date(day),
      dayName: weekDays.value[day.getDay()].substring(0, 3),
      dayNumber: day.getDate(),
      isToday,
      events: getEventsForDay(day),
    });
  }
  return days;
});
// Day view events
const dayViewEvents = computed(() => {
  return getEventsForDay(currentDate.value);
});
// Helper functions
function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  return result;
}
function getEndOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day));
  return result;
}
function getEventsForDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return events.value
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
function formatEventTime(event: any): string {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return `${formatTime(start)} - ${formatTime(end)}`;
}
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
function formatHour(hour: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(2025, 0, 1, hour));
}
function calculateEventTop(event: any): number {
  const start = new Date(event.start);
  return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64; // 64px per hour (16px * 4)
}
function calculateEventHeight(event: any): number {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.max(durationHours * 64, 24); // Minimum height of 24px
}
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
// Event handlers
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
function toggleCategory(categoryId: number) {
  const category = categories.value.find((c) => c.id === categoryId);
  if (category) {
    category.active = !category.active;
  }
}
function changeView(view: string) {
  currentView.value = view;
}
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
function goToToday() {
  currentDate.value = new Date();
  selectedDate.value = new Date();
}
function prevMonth() {
  miniCalendarDate.value = new Date(
    miniCalendarDate.value.getFullYear(),
    miniCalendarDate.value.getMonth() - 1,
    1
  );
}
function nextMonth() {
  miniCalendarDate.value = new Date(
    miniCalendarDate.value.getFullYear(),
    miniCalendarDate.value.getMonth() + 1,
    1
  );
}
function selectDate(date: Date) {
  selectedDate.value = new Date(date);
  currentDate.value = new Date(date);
}
function handleDayClick(day: any, isAddEvent: boolean = false) {
  if (day.isCurrentMonth) {
    currentDate.value = new Date(day.date);
    selectedDate.value = new Date(day.date);
    if (isAddEvent) {
      const startDate = new Date(day.date);
      startDate.setHours(9, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0);
      openNewEventModal(startDate, endDate);
    }
  }
}
function handleHourClick(day: any, hour: number) {
  const date = new Date(day.date);
  date.setHours(hour, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(hour + 1, 0, 0, 0);
  openNewEventModal(date, endDate);
}
function openNewEventModal(start?: Date, end?: Date) {
  isNewEvent.value = true;
  const startDate = start || new Date(selectedDate.value);
  if (!start) {
    startDate.setHours(9, 0, 0, 0);
  }
  const endDate = end || new Date(startDate);
  if (!end) {
    endDate.setHours(startDate.getHours() + 1, 0, 0, 0);
  }
  currentEvent.value = {
    id: Date.now(),
    title: "",
    start: formatDateTimeForInput(startDate),
    end: formatDateTimeForInput(endDate),
    description: "",
    categoryId: 1,
    categoryColor: categories.value[0].color,
    allDay: false,
    syncWithSystem: true,
  };
  showEventModal.value = true;
}
function openEventDetails(event: any) {
  isNewEvent.value = false;
  currentEvent.value = {
    ...event,
    start: formatDateTimeForInput(new Date(event.start)),
    end: formatDateTimeForInput(new Date(event.end)),
  };
  showEventModal.value = true;
}
function formatDateTimeForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
function closeEventModal() {
  showEventModal.value = false;
}
function saveEvent() {
  const eventToSave = {
    ...currentEvent.value,
    start: new Date(currentEvent.value.start),
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
function deleteEvent() {
  const index = events.value.findIndex((e) => e.id === currentEvent.value.id);
  if (index !== -1) {
    events.value.splice(index, 1);
  }
  closeEventModal();
}
function handleDragStart(event: DragEvent, calendarEvent: any) {
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", calendarEvent.id.toString());
    draggedEvent.value = calendarEvent;
  }
}
function handleDrop(event: DragEvent, day: any) {
  event.preventDefault();
  if (draggedEvent.value && event.dataTransfer) {
    const eventId = parseInt(event.dataTransfer.getData("text/plain"));
    const eventIndex = events.value.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      const originalEvent = events.value[eventIndex];
      const originalStart = new Date(originalEvent.start);
      const originalEnd = new Date(originalEvent.end);
      const duration = originalEnd.getTime() - originalStart.getTime();
      const newStart = new Date(day.date);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
      const newEnd = new Date(newStart.getTime() + duration);
      events.value[eventIndex] = {
        ...originalEvent,
        start: newStart,
        end: newEnd,
      };
    }
  }
  draggedEvent.value = null;
}
// Lifecycle hooks
onMounted(() => {
  // Initialize with current date
  goToToday();
});
</script>
<style scoped>
.calendar-app {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}
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
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
.hour-cell:hover {
  background-color: #f9fafb;
}
/* Animation for modal */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.event-modal {
  animation: fadeIn 0.2s ease-out;
}
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
