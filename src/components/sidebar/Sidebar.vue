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
      v-if="uiStore.currentView !== 'todo-list'"
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
      v-if="uiStore.currentView === 'todo-list'"
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

    <!-- 迷你日历组件 -->
    <!-- <MiniCalendar /> -->
    <!-- 视图选择器组件 -->
    <ViewSelector />
    <!-- 分类列表，它不会在 todo 视图显示 -->
    <Categories v-if="uiStore.currentView !== 'todo-list'" />

    <!-- 反馈按钮 -->
    <button
      class="feedback-btn mx-4 mt-auto mb-4 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 transition cursor-pointer !rounded-button whitespace-nowrap"
      @click="showFeedbackModal = true"
    >
      <i
        :class="[
          'fas fa-comment-alt',
          !uiStore.sidebarCollapsed ? 'mr-2' : '', // 根据折叠状态设置边距
        ]"
      ></i>
      <span v-if="!uiStore.sidebarCollapsed">我要反馈</span>
    </button>

    <!-- 反馈问卷弹窗 -->
    <div
      v-if="showFeedbackModal"
      class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
      @click="showFeedbackModal = false"
    >
      <div class="bg-white rounded-lg w-[600px] h-[600px] relative" @click.stop>
        <!-- 关闭按钮 -->
        <button
          @click="showFeedbackModal = false"
          class="absolute right-2 top-2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
        <!-- 问卷iframe -->
        <iframe
          src="https://www.wjx.cn/vm/QmIwc3u.aspx"
          class="w-full h-full rounded-lg"
          frameborder="0"
        ></iframe>
      </div>
    </div>
  </aside>
</template>

<script setup>
import ViewSelector from "./ViewSelector.vue";
import Categories from "./Categories.vue";
import { useUiStore } from "@/stores/ui";
import { useSettingStore } from "@/stores/setting";
import { ref } from "vue";

// 使用Pinia仓库
const uiStore = useUiStore();
const settingStore = useSettingStore();

// 控制反馈弹窗显示
const showFeedbackModal = ref(false);
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

/* 添加暗黑模式下侧边栏标题颜色 */
.dark-mode .sidebar .text-xl,
.dark-mode .sidebar h1,
.dark-mode .sidebar h2,
.dark-mode .sidebar h3 {
  color: var(--heading-color);
}

/* 调整侧边栏其他元素颜色 */
.dark-mode .sidebar-nav-item {
  color: var(--text-secondary);
}

.dark-mode .sidebar-nav-item.active {
  color: var(--heading-color);
  background-color: #2a3241; /* 更改为柔和的蓝灰色 */
  border-left: 2px solid #4a88e5; /* 添加蓝色边框作为选中指示 */
}

.dark-mode .sidebar-toggle:hover {
  color: var(--heading-color);
}

/* 暗黑模式下调整添加事件按钮颜色 */
.dark-mode .add-event-btn {
  background-color: #3a5277; /* 更柔和的蓝色 */
  color: #e2e8f0;
}

.dark-mode .add-event-btn:hover {
  background-color: #445c85; /* 悬停时略深一点 */
}

/* 调整同步状态文本颜色 */
.dark-mode .sync-status span:last-child {
  color: var(--text-secondary);
}

/* 调整侧边栏标题颜色为更亮的灰色 */
.dark-mode .sidebar .text-sm.font-medium,
.dark-mode .sidebar h3,
.dark-mode .sidebar .text-gray-700 {
  color: var(--sidebar-title-color) !important;
}

/* 修改字号相关的样式 */
.sidebar-title {
  font-size: var(--heading-font-size);
}

.nav-item {
  font-size: var(--base-font-size);
}

.nav-item-icon {
  font-size: var(--base-font-size);
}

/* 反馈按钮样式 */
.feedback-btn {
  border: 1px solid var(--border-color);
}

.dark-mode .feedback-btn {
  background-color: #2a3241;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.dark-mode .feedback-btn:hover {
  background-color: #3a5277;
  color: var(--text-primary);
}
</style>
