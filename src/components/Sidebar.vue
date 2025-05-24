<template>
  <!-- 侧边栏容器 -->
  <aside
    :class="[
      'sidebar bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 relative',
      uiStore.sidebarCollapsed ? 'w-16' : 'w-64', // 根据 sidebarCollapsed 状态动态调整宽度
    ]"
    @mouseenter="uiStore.showToggleButton = true"
    @mouseleave="uiStore.showToggleButton = false"
  >
    <!-- 侧边栏折叠/展开切换按钮 -->
    <button
      @click="uiStore.toggleSidebar"
      :class="[
        'sidebar-toggle text-gray-500 hover:text-gray-700 cursor-pointer absolute right-0 transition-all duration-200',
        uiStore.sidebarCollapsed ? 'w-8 h-8 flex items-center justify-center rounded-full' : 'p-2',
        uiStore.showToggleButton ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4' // 悬停时显示，离开时隐藏
      ]"
      style="top: 50%; transform: translateY(-50%);" 
    >
      <i
        :class="
          uiStore.sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left' // 根据折叠状态切换图标
        "
      ></i>
    </button>
    <!-- 添加新事件按钮 -->
    <button
      @click="eventStore.openNewEventModal()"
      class="add-event-btn mx-4 my-3 py-2 px-4 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition cursor-pointer !rounded-button whitespace-nowrap"
    >
      <i 
        :class="[
          'fas fa-plus',
          !uiStore.sidebarCollapsed ? 'mr-2' : '' // 根据折叠状态设置边距
        ]"
      ></i>
      <span v-if="!uiStore.sidebarCollapsed">Add Event</span>
      <!-- 仅在侧边栏展开时显示文字 -->
    </button>
    <!-- 迷你日历组件 -->
    <!-- <MiniCalendar /> -->
    <!-- 视图选择器组件 -->
    <ViewSelector />
    <!-- 分类列表组件 -->
    <Categories />
    <!-- 同步状态指示器，固定在侧边栏底部 -->
    <div class="sync-status mt-auto mx-4 my-3 flex items-center">
      <!-- 同步状态小圆点 -->
      <span
        :class="[
          'sync-indicator w-2 h-2 rounded-full',
          settingStore.synced ? 'bg-green-500' : 'bg-yellow-500',
        ]"
      ></span>
      <!-- 同步状态文本，仅在侧边栏展开时显示 -->
      <span v-if="!uiStore.sidebarCollapsed" class="text-xs text-gray-500 ml-2">
        {{ settingStore.synced ? "Synced with system calendar" : "Sync pending..." }}
      </span>
    </div>
  </aside>
</template>

<script setup>
// import MiniCalendar from "./MiniCalendar.vue";
import ViewSelector from "./ViewSelector.vue";
import Categories from "./Categories.vue";
import { useEventStore } from '../stores/event';
import { useUiStore } from '../stores/ui';
import { useSettingStore } from '../stores/setting';
import { ref } from 'vue';

// 使用Pinia仓库
const eventStore = useEventStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();

</script>

<style scoped>
/* 确保按钮在侧边栏右边界处 */
.sidebar-toggle {
  transform: translateY(-50%); /* 垂直居中 */
}

/* 侧边栏悬停时显示按钮 */
.sidebar:hover .sidebar-toggle {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}
</style>
