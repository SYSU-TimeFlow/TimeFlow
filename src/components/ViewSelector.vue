<!-- 
 @file ViewSelector.vue
 @description 日历视图选择器组件。
 该组件允许用户在不同的日历视图（如月视图、周视图、日视图）之间切换。
 当侧边栏折叠时，仅显示视图图标；展开时，显示图标和视图名称。
-->
 
<template>
  <!-- 视图选择器根元素 -->
  <div
    :class="[
      'view-selector my-3',
      uiStore.sidebarCollapsed ? 'mx-auto' : 'mx-4',
    ]"
  >
    <!-- "View" 标题，仅在侧边栏未折叠时显示 -->
    <div
      v-if="!uiStore.sidebarCollapsed"
      class="text-sm font-medium mb-2 text-gray-700"
    >
      View
    </div>
    <!-- 视图按钮列表 -->
    <div class="flex flex-col space-y-1">
      <!-- 遍历 calendarViews 数组，为每个视图创建一个切换按钮 -->
      <button
        v-for="view in uiStore.calendarViews"
        :key="view.id"
        @click="uiStore.changeView(view.id)"
        :class="[
          'view-btn flex items-center py-2 px-3 rounded-lg cursor-pointer !rounded-button whitespace-nowrap',
          uiStore.currentView === view.id
            ? 'bg-blue-100 text-blue-600 active'
            : 'hover:bg-gray-200', // 添加active类以便在暗黑模式下识别
        ]"
      >
        <!-- 视图图标 -->
        <i
          :class="`fas ${view.icon} ${uiStore.sidebarCollapsed ? '' : 'mr-3'}`"
        ></i>
        <!-- 视图标签文本，仅在侧边栏未折叠时显示 -->
        <span v-if="!uiStore.sidebarCollapsed">{{ view.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from "../stores/ui";

// 使用Pinia仓库
const uiStore = useUiStore();
</script>

<style scoped>
/* 原有样式保持不变 */

/* 添加暗黑模式下的样式优化 */
.dark-mode .view-btn:hover:not(.active) {
  background-color: var(--hover-bg) !important; /* 使用更接近黑色的悬停颜色 */
  color: var(--text-secondary);
}

/* 暗黑模式下选中的视图 */
.dark-mode .view-btn.active,
.dark-mode .view-btn[class*="bg-blue-100"] {
  background-color: var(--active-item-bg) !important; /* 使用更柔和的背景色 */
  color: var(--heading-color) !important;
  border-left: 2px solid var(--active-item-border);
}

/* 调整视图选择器标题颜色 */
.dark-mode .text-sm.font-medium {
  color: var(--sidebar-title-color) !important;
}
</style>
