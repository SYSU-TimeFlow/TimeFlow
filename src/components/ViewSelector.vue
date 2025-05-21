<template>
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
        @click="$emit('change-view', view.id)"
        :class="[
          'view-btn flex items-center py-2 px-3 rounded-lg cursor-pointer !rounded-button whitespace-nowrap',
          currentView === view.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200',
        ]"
      >
        <i :class="`fas ${view.icon} ${sidebarCollapsed ? '' : 'mr-3'}`"></i>
        <span v-if="!sidebarCollapsed">{{ view.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  calendarViews: Array,
  currentView: String,
  sidebarCollapsed: Boolean,
});
defineEmits(["change-view"]);
</script>