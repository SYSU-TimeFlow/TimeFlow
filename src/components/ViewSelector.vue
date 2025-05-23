/**
 * @file ViewSelector.vue
 * @description 日历视图选择器组件。
 * 该组件允许用户在不同的日历视图（如月视图、周视图、日视图）之间切换。
 * 当侧边栏折叠时，仅显示视图图标；展开时，显示图标和视图名称。
 */
<template>
  <!-- 视图选择器根元素 -->
  <div :class="[
    'view-selector my-3',
    uiStore.sidebarCollapsed ? 'mx-auto' : 'mx-4', // 根据折叠状态设置不同的边距
  ]">
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
          uiStore.currentView === view.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200', // 当前选中视图高亮显示
        ]"
      >
        <!-- 视图图标 -->
        <i :class="`fas ${view.icon} ${uiStore.sidebarCollapsed ? '' : 'mr-3'}`"></i> <!-- 根据侧边栏折叠状态调整图标右边距 -->
        <!-- 视图标签文本，仅在侧边栏未折叠时显示 -->
        <span v-if="!uiStore.sidebarCollapsed">{{ view.label }}</span>
      </button>
      <!-- 新增 ToDo 按钮 -->
      <button
        @click="$emit('change-view', 'todo')"
        :class="[
          'view-btn flex items-center py-2 px-3 rounded-lg cursor-pointer !rounded-button whitespace-nowrap',
          currentView === 'todo' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200',
        ]"
      >
        <i :class="`fas fa-list-check ${sidebarCollapsed ? '' : 'mr-3'}`"></i>
        <span v-if="!sidebarCollapsed">ToDo</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../stores/ui';

// 使用Pinia仓库
const uiStore = useUiStore();
</script>