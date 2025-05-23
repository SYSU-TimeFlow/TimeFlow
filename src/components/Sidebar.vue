<!--
    @file Sidebar.vue
    @description 日历应用的侧边栏组件。
    该组件包含添加事件按钮、迷你日历、视图选择器、分类列表以及同步状态指示器。
    侧边栏可以展开或折叠。
-->
<template>
  <!-- 侧边栏容器 -->
  <aside
    :class="[
      'sidebar bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300',
      uiStore.sidebarCollapsed ? 'w-16' : 'w-64', // 根据 sidebarCollapsed 状态动态调整宽度
    ]"
  >
    <!-- 侧边栏折叠/展开切换按钮 -->
    <button
      @click="uiStore.toggleSidebar"
      :class="[
        'sidebar-toggle text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap transition-all',
        uiStore.sidebarCollapsed ? 'mx-auto my-3 w-8 h-8 flex items-center justify-center rounded-full' : 'self-end p-2 m-2', // 根据折叠状态设置不同的边距
      ]"
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
    <MiniCalendar />
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
import MiniCalendar from "./MiniCalendar.vue";
import ViewSelector from "./ViewSelector.vue";
import Categories from "./Categories.vue";
import { useEventStore } from '../stores/event';
import { useUiStore } from '../stores/ui';
import { useSettingStore } from '../stores/setting';

// 使用Pinia仓库
const eventStore = useEventStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
</script>