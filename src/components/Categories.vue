<!-- 
 @component Categories.vue
 @description: 事件分类组件，用于显示和选择事件的分类。 
-->

<template>
  <!-- 分类组件根元素 -->
  <div class="categories mx-4 my-3">
    <!-- 分类头部区域，仅在侧边栏未折叠时显示 -->
    <div
      v-if="!uiStore.sidebarCollapsed"
      class="flex items-center justify-between mb-2"
    >
      <span class="text-sm font-medium text-gray-700">Categories</span>
      <!-- 添加新分类按钮 (当前未实现功能) -->
      <button
        class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
      >
        <i class="fas fa-plus text-xs"></i>
      </button>
    </div>
    <!-- 分类列表区域 -->
    <div class="flex flex-col space-y-1">
      <!-- 遍历 categories 数组，为每个分类创建一个条目 -->
      <div
        v-for="category in eventStore.categories"
        :key="category.id"
        :class="[
          'category-item flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-200',
          category.active ? '' : 'opacity-50', // 如果分类未激活，则降低其不透明度
        ]"
        @click="eventStore.toggleCategory(category.id)"
      >
        <!-- 分类颜色指示器 -->
        <span
          :class="[
            'category-color w-3 h-3 rounded-full',
            uiStore.sidebarCollapsed ? '' : 'mr-3', // 侧边栏折叠时不显示右边距
          ]"
          :style="{ backgroundColor: category.color }"
        ></span>
        <!-- 分类名称，仅在侧边栏未折叠时显示 -->
        <span v-if="!uiStore.sidebarCollapsed" class="text-sm">{{
          category.name
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEventStore } from '../stores/event';
import { useUiStore } from '../stores/ui';

// 使用Pinia仓库
const eventStore = useEventStore();
const uiStore = useUiStore();
</script>