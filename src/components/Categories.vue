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
      <!-- 添加新分类按钮 -->
      <button
        @click="eventStore.openNewCategoryModal"
        class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
        title="添加新分类"
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
      >
        <!-- 点击圆点切换激活状态 -->
        <span
          :class="[
            'category-color w-3 h-3 rounded-full',
            uiStore.sidebarCollapsed ? '' : 'mr-3', // 侧边栏折叠时不显示右边距
          ]"
          :style="{ backgroundColor: category.color }"
          @click="eventStore.toggleCategory(category.id)"
        ></span>
        <!-- 分类名称，仅在侧边栏未折叠时显示 -->
        <span
          v-if="!uiStore.sidebarCollapsed"
          class="text-sm flex-1"
          @click="eventStore.toggleCategory(category.id)"
        >
          {{ category.name }}
        </span>
        <!-- 编辑按钮，仅在侧边栏未折叠且鼠标悬停时显示 -->
        <button
          v-if="!uiStore.sidebarCollapsed"
          @click="eventStore.openCategoryDetails(category)"
          class="edit-button text-gray-400 hover:text-gray-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          title="编辑分类"
        >
          <i class="fas fa-edit text-xs"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEventStore } from "../stores/event";
import { useUiStore } from "../stores/ui";

// 使用Pinia仓库
const eventStore = useEventStore();
const uiStore = useUiStore();
</script>

<style scoped>
/* 修改字号相关的样式 */
.category-title {
  font-size: var(--heading-font-size);
}

.category-item {
  font-size: var(--base-font-size);
}

.category-description {
  font-size: var(--small-text-font-size);
}

.category-item {
  position: relative;
}

.category-item:hover .edit-button {
  opacity: 1 !important;
}

.edit-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}

/* 原有样式保持不变 */

/* 暗黑模式下分类项悬停效果 */
.dark-mode .category-item:hover {
  background-color: var(
    --hover-bg
  ) !important; /* 使用与view-btn相同的悬停颜色 */
  color: var(--text-secondary);
  border-color: transparent;
}

/* 暗黑模式下激活的分类项 */
.dark-mode .category-item.active {
  background-color: var(--active-item-bg) !important;
  color: var(--heading-color);
}

/* 编辑按钮颜色调整 */
.dark-mode .edit-button {
  color: var(--text-tertiary);
}

.dark-mode .edit-button:hover {
  color: var(--heading-color);
}

/* 调整分类标题颜色 */
.dark-mode .text-sm.font-medium {
  color: var(--sidebar-title-color) !important;
}
</style>
