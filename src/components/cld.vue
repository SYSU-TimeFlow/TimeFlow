<template>
  <div class="calendar-app min-h-screen bg-white text-gray-800 flex flex-col">
    <header class="app-header bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
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
    <div class="flex flex-1 overflow-hidden">
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
      <CalendarMain
        :current-view="currentView"
        :current-date="currentDate"
        :calendar-days="calendarDays"
        :week-view-days="weekViewDays"
        :day-view-events="dayViewEvents"
        :events="events"
        :calendar-title="calendarTitle"
        :day-view-title="dayViewTitle"
        @navigate-calendar="navigateCalendar"
        @go-to-today="goToToday"
        @handle-day-click="handleDayClick"
        @handle-hour-click="handleHourClick"
        @open-event-details="openEventDetails"
      />
    </div>
    <EventModal
      :show-event-modal="showEventModal"
      :is-new-event="isNewEvent"
      :current-event="currentEvent"
      :categories="categories"
      @close-event-modal="closeEventModal"
      @save-event="saveEvent"
      @delete-event="deleteEvent"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import Sidebar from "./Sidebar.vue";
import CalendarMain from "./CalendarMain.vue";
import EventModal from "./EventModal.vue";

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
  const options = { month: "long", year: "numeric" };
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
const dayViewEvents = computed(() => {
  return getEventsForDay(currentDate.value);
});

// Helper functions
function getStartOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  return result;
}
function getEndOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day));
  return result;
}
function getEventsForDay(date) {
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

// Event handlers
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
function toggleCategory(categoryId) {
  const category = categories.value.find((c) => c.id === categoryId);
  if (category) {
    category.active = !category.active;
  }
}
function changeView(view) {
  currentView.value = view;
}
function navigateCalendar(direction) {
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
function selectDate(date) {
  selectedDate.value = new Date(date);
  currentDate.value = new Date(date);
}
function handleDayClick(day, isAddEvent = false) {
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
function handleHourClick(day, hour) {
  const date = new Date(day.date);
  date.setHours(hour, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(hour + 1, 0, 0, 0);
  openNewEventModal(date, endDate);
}
function openNewEventModal(start, end) {
  isNewEvent.value = true;
  const startDate = start || new Date(selectedDate.value);
  if (!start) startDate.setHours(9, 0, 0, 0);
  const endDate = end || new Date(startDate);
  if (!end) endDate.setHours(startDate.getHours() + 1, 0, 0, 0);
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
function openEventDetails(event) {
  isNewEvent.value = false;
  currentEvent.value = {
    ...event,
    start: formatDateTimeForInput(new Date(event.start)),
    end: formatDateTimeForInput(new Date(event.end)),
  };
  showEventModal.value = true;
}
function formatDateTimeForInput(date) {
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
function handleDragStart(event, calendarEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", calendarEvent.id.toString());
    draggedEvent.value = calendarEvent;
  }
}
function handleDrop(event, day) {
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
  goToToday();
});
</script>

<style scoped>
.calendar-app {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}
</style>