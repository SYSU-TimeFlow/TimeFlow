<!-- 
 @component ViewSelector.vue
 @description: 日历视图选择器组件，允许用户在不同的日历视图（月视图、周视图、日视图、待办视图）之间切换，支持侧边栏折叠状态的适配。
 
 主要功能：
 1. 显示所有可用的日历视图选项
 2. 支持视图切换交互
 3. 高亮显示当前激活的视图
 4. 适配侧边栏折叠/展开状态
 5. 提供视图图标和标签显示
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
    <div class="flex flex-col space-y-1" data-tutorial="view-switcher">
      <!-- 遍历 calendarViews 数组，为每个视图创建一个切换按钮 -->
      <button
        v-for="view in uiStore.calendarViews"
        :key="view.id"
        @click="uiStore.changeView(view.id)"
        :class="[
          'view-btn flex items-center py-2 px-3 rounded-lg cursor-pointer !rounded-button whitespace-nowrap',
          uiStore.currentView === view.id
            ? 'bg-blue-100 text-blue-600 active'
            : 'hover:bg-gray-200', 
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
import { useUiStore } from "../../stores/ui";

// 使用Pinia仓库
const uiStore = useUiStore();
</script>

<style scoped>
.text-sm {
  font-size: var(--font-size-sm);
}

.view-btn {
  font-size: var(--font-size-base);
}

.view-btn i {
  font-size: var(--font-size-base);
}

.dark-mode .view-btn:hover:not(.active) {
  background-color: var(--hover-bg) !important;
  color: var(--text-secondary);
}

.dark-mode .view-btn.active,
.dark-mode .view-btn[class*="bg-blue-100"] {
  background-color: var(--active-item-bg) !important;
  color: var(--heading-color) !important;
}

.dark-mode .text-sm.font-medium {
  color: var(--sidebar-title-color) !important;
}
</style>
