<template>
  <aside
    :class="[
      'sidebar bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300',
      sidebarCollapsed ? 'w-16' : 'w-64',
    ]"
  >
    <button
      @click="$emit('toggle-sidebar')"
      class="sidebar-toggle self-end p-2 m-2 text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
    >
      <i
        :class="sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"
      ></i>
    </button>
    <button
      @click="$emit('open-new-event-modal')"
      class="add-event-btn mx-4 my-3 py-2 px-4 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition cursor-pointer !rounded-button whitespace-nowrap"
    >
      <i class="fas fa-plus mr-2"></i>
      <span v-if="!sidebarCollapsed">Add Event</span>
    </button>
    <MiniCalendar
      :mini-calendar-date="miniCalendarDate"
      :selected-date="selectedDate"
      :mini-calendar-days="miniCalendarDays"
      @prev-month="$emit('prev-month')"
      @next-month="$emit('next-month')"
      @select-date="$emit('select-date', $event)"
    />
    <ViewSelector
      :calendar-views="calendarViews"
      :current-view="currentView"
      :sidebar-collapsed="sidebarCollapsed"
      @change-view="$emit('change-view', $event)"
    />
    <Categories
      :categories="categories"
      :sidebar-collapsed="sidebarCollapsed"
      @toggle-category="$emit('toggle-category', $event)"
    />
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
</template>

<script setup>
import MiniCalendar from "./MiniCalendar.vue";
import ViewSelector from "./ViewSelector.vue";
import Categories from "./Categories.vue";

defineProps({
  sidebarCollapsed: Boolean,
  miniCalendarDate: Date,
  calendarViews: Array,
  currentView: String,
  categories: Array,
  synced: Boolean,
  miniCalendarDays: Array,
  selectedDate: Date,
});
defineEmits([
  "toggle-sidebar",
  "prev-month",
  "next-month",
  "select-date",
  "change-view",
  "toggle-category",
  "open-new-event-modal",
]);
</script>