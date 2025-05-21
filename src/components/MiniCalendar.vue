<template>
  <div class="mini-calendar mx-4 my-3 bg-white rounded-lg shadow-sm p-3">
    <div class="flex justify-between items-center mb-2">
      <span v-if="!sidebarCollapsed" class="text-sm font-medium">{{
        miniCalendarTitle
      }}</span>
      <div class="flex space-x-1">
        <button
          @click="$emit('prev-month')"
          class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-chevron-left text-xs"></i>
        </button>
        <button
          @click="$emit('next-month')"
          class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-chevron-right text-xs"></i>
        </button>
      </div>
    </div>
    <div v-if="!sidebarCollapsed" class="grid grid-cols-7 gap-1 text-center">
      <span
        v-for="day in weekDaysShort"
        :key="day"
        class="text-xs text-gray-500"
      >
        {{ day }}
      </span>
      <div
        v-for="(day, index) in miniCalendarDays"
        :key="index"
        :class="[
          'mini-day text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer',
          day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400',
          day.isToday ? 'bg-blue-100 text-blue-600 font-medium' : '',
          day.isSelected ? 'bg-blue-600 text-white' : '',
        ]"
        @click="$emit('select-date', day.date)"
      >
        {{ day.dayNumber }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { defineProps, defineEmits } from 'vue';
const props = defineProps({
  miniCalendarDate: Date,
  selectedDate: Date,
  miniCalendarDays: Array,
  sidebarCollapsed: Boolean,
});
defineEmits(["prev-month", "next-month", "select-date"]);

const weekDaysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const miniCalendarTitle = computed(() => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(props.miniCalendarDate);
});
</script>
