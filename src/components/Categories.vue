<template>
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
        @click="$emit('toggle-category', category.id)"
      >
        <span
          :class="[
            'category-color w-3 h-3 rounded-full',
            sidebarCollapsed ? '' : 'mr-3',
          ]"
          :style="{ backgroundColor: category.color }"
        ></span>
        <span v-if="!sidebarCollapsed" class="text-sm">{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: Array,
  sidebarCollapsed: Boolean,
});
defineEmits(["toggle-category"]);
</script>