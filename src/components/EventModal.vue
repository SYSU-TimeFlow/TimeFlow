<template>
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
          @click="$emit('close-event-modal')"
          class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body p-4">
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            v-model="currentEvent.title"
            type="text"
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Event title"
          />
        </div>
        <div class="form-row flex space-x-4 mb-4">
          <div class="form-group flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Start</label>
            <input
              v-model="currentEvent.start"
              type="datetime-local"
              class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="form-group flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">End</label>
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
            <label for="allDay" class="text-sm text-gray-700">All day event</label>
          </div>
        </div>
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
            <label for="syncWithSystem" class="text-sm text-gray-700">
              Sync with system calendar
            </label>
          </div>
        </div>
      </div>
      <div
        class="modal-footer p-4 border-t border-gray-200 flex justify-end space-x-3"
      >
        <button
          v-if="!isNewEvent"
          @click="$emit('delete-event')"
          class="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          Delete
        </button>
        <button
          @click="$emit('close-event-modal')"
          class="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
        >
          Cancel
        </button>
        <button
          @click="$emit('save-event')"
          class="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showEventModal: Boolean,
  isNewEvent: Boolean,
  currentEvent: Object,
  categories: Array,
});
defineEmits(["close-event-modal", "save-event", "delete-event"]);
</script>

<style scoped>
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
</style>