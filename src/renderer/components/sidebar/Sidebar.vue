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
        uiStore.sidebarCollapsed
          ? 'w-8 h-8 flex items-center justify-center rounded-full'
          : 'p-2',
        uiStore.showToggleButton
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4', // 悬停时显示，离开时隐藏
      ]"
      style="top: 50%; transform: translateY(-50%)"
    >
      <i
        :class="
          uiStore.sidebarCollapsed
            ? 'fas fa-chevron-right'
            : 'fas fa-chevron-left' // 根据折叠状态切换图标
        "
      ></i>
    </button>
    <!-- 添加新事件按钮 -->
    <button
      v-if="uiStore.currentView !== 'todo'"
      @click="uiStore.openNewEventModal()"
      class="add-event-btn mx-4 my-3 py-2 px-4 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition cursor-pointer !rounded-button whitespace-nowrap"
    >
      <i
        :class="[
          'fas fa-plus',
          !uiStore.sidebarCollapsed ? 'mr-2' : '', // 根据折叠状态设置边距
        ]"
      ></i>
      <!-- 仅在侧边栏展开时显示文字 -->
      <span v-if="!uiStore.sidebarCollapsed">Add Event</span>
    </button>
    <!-- 仅在待办视图显示 Add Todo 按钮-->
    <button
      v-if="uiStore.currentView === 'todo'"
      @click="uiStore.openNewTodoModal()"
      class="add-event-btn mx-4 my-3 py-2 px-4 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition cursor-pointer !rounded-button whitespace-nowrap"
    >
      <i
        :class="[
          'fas fa-plus',
          !uiStore.sidebarCollapsed ? 'mr-2' : '', // 根据折叠状态设置边距
        ]"
      ></i>
      <span v-if="!uiStore.sidebarCollapsed">Add Event</span>
    </button>

    <!-- 视图选择器组件 -->
    <ViewSelector />
    <!-- 分类列表，所有视图都显示 -->
    <Categories />

    <!-- 反馈按钮 -->
    <button
      class="feedback-btn mx-4 mt-auto mb-4 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 transition cursor-pointer !rounded-button whitespace-nowrap"
      @click="uiStore.showFeedbackModal = true"
    >
      <i
        :class="[
          'fas fa-comment-alt',
          !uiStore.sidebarCollapsed ? 'mr-2' : '', // 根据折叠状态设置边距
        ]"
      ></i>
      <span v-if="!uiStore.sidebarCollapsed">FeedBack</span>
    </button>

    <!-- 反馈弹窗 -->
    <FeedBackPage v-if="uiStore.showFeedbackModal" />
  </aside>
</template>

<script setup>
import ViewSelector from "./ViewSelector.vue";
import Categories from "./Categories.vue";
import FeedBackPage from "../pages/FeedBackPage.vue";
import { useUiStore } from "../../stores/ui";
// import { useSettingStore } from "@/stores/setting";
// import { ref } from "vue";

// 使用Pinia仓库
const uiStore = useUiStore();
// const settingStore = useSettingStore();

// 控制反馈弹窗显示
// const showFeedbackModal = ref(false);
</script>

<style scoped>
/* 基础样式 */
.sidebar {
  background-color: var(--bg-sidebar);
  border-color: var(--border-color);
  color: var(--text-primary);
  transition: width 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s,
    border-color 0.2s, color 0.2s;
}

.sidebar-nav-item {
  color: var(--text-secondary);
}

.sidebar-nav-item.active {
  color: var(--text-primary);
  background-color: var(--active-bg);
}

/* 确保按钮在侧边栏右边界处 */
.sidebar-toggle {
  transform: translateY(-50%); /* 垂直居中 */
}

/* 侧边栏悬停时显示按钮 */
.sidebar:hover .sidebar-toggle {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* 修改字号相关的样式 */
.sidebar-title {
  font-size: var(--font-size-base);
}

.nav-item {
  font-size: var(--font-size-base);
}

.nav-item-icon {
  font-size: var(--font-size-base);
}

/* 反馈按钮样式 */
.feedback-btn {
  background-color: var(--bg-sidebar);
  color: var(--text-secondary);
}

.feedback-btn:hover {
  background-color: var(--hover-bg);
  color: var(--text-primary);
}
</style>
