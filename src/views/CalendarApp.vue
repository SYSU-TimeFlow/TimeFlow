<!--
  @component: CalendarApp
  @description: App主界面，承载其他子页面。包括侧边栏、主日历视图（月、周、日）、事件创建/编辑模态框以及各种交互功能。
  @author: liaohr
  @modified: duxuan
  @date: 2025-05-24
-->

<template>
  <!-- 主日历应用程序容器 -->
  <div class="calendar-app min-h-screen bg-white text-gray-800 flex flex-col">
    <!-- 应用程序头部 -->
    <header
      class="app-header drag bg-white border-b border-gray-200 px-6 py-3 flex items-center"
    >
      <!-- 左侧区域：TimeFlow标题和日历标题 -->
      <div class="header-left flex items-center flex-shrink-0 mr-6">
        <h1
          class="text-xl font-semibold text-gray-800 mr-6 no-drag cursor-pointer"
          @click="uiStore.toggleSidebar()"
          title="点击切换侧边栏"
        >
          TimeFlow
        </h1>
        <!-- 日历标题 -->
        <h2 class="text-lg font-medium no-drag">{{ uiStore.calendarTitle }}</h2>
      </div>

      <!-- 中间区域：搜索框和导航按钮 -->
      <div class="header-center flex-1 flex justify-center items-center">
        <!-- 导航按钮组，移动到搜索框左侧 -->
        <div class="navigation-buttons flex no-drag">
          <!-- "上一个"导航按钮 -->
          <button
            @click="uiStore.navigateCalendar('prev')"
            class="nav-button px-4 py-2 rounded-l-md hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <i class="fas fa-chevron-left text-base"></i>
          </button>
          <!-- "下一个"导航按钮，移除边框 -->
          <button
            @click="uiStore.navigateCalendar('next')"
            class="nav-button px-4 py-2 rounded-r-md hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <i class="fas fa-chevron-right text-base"></i>
          </button>
        </div>

        <!-- 搜索框 -->
        <div class="search-box relative no-drag ml-1">
          <input
            type="text"
            placeholder="Search events..."
            class="pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
          <i
            class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
          ></i>
        </div>
        <!-- "今天"按钮 -->
        <button
          @click="uiStore.goToToday()"
          class="nav-button py-1 px-4 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ml-1"
        >
          Today
        </button>
      </div>

      <!-- 右侧区域：其他控制按钮 -->
      <div class="header-right no-drag flex items-center flex-shrink-0">
        <!-- 保留原有按钮 -->
        <button class="header-icon-button p-2 rounded-md transition-colors">
          <i class="fas fa-bell"></i>
        </button>
        <!-- 设置按钮 -->
        <button
          @click="settingStore.toggleSettings"
          class="header-icon-button p-2 rounded-md transition-colors"
          title="打开设置"
        >
          <i class="fas fa-cog"></i>
        </button>
        <div class="window-actions flex">
          <button
            class="header-icon-button p-1.5 rounded-l-md transition-colors"
            @click="electronAPI.minimize()"
          >
            <i class="fas fa-window-minimize"></i>
          </button>
          <button
            class="header-icon-button p-1.5 transition-colors"
            @click="electronAPI.maximize()"
          >
            <i class="fas fa-window-maximize"></i>
          </button>
          <button
            class="header-icon-button p-1.5 rounded-r-md text-red-500 hover:text-red-700 transition-colors"
            @click="electronAPI.close()"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </header>
    <!-- 主内容区域，包含侧边栏和日历视图 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏组件 -->
      <Sidebar />
      <!-- 主日历区域组件 -->
      <CalendarMain />
    </div>
    <!-- 事件模态框组件 (用于创建/编辑事件) -->
    <EventModal />

    <!-- 分类模态框组件 (用于创建/编辑分类) -->
    <CategoryModal />

    <!-- 设置模态框，仅在showSettings为true时显示 -->
    <Setting />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import Sidebar from "../components/Sidebar.vue";
import CalendarMain from "../components/CalendarMain.vue";
import EventModal from "../components/EventModal.vue";
import CategoryModal from "../components/CategoryModal.vue"; // 导入分类模态框组件
import Setting from "../components/Setting.vue"; // 导入设置组件
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";

// 引入preload中定义的electronAPI
// 该API用于与Electron主进程进行通信
const electronAPI = (window as any).electronAPI;

// 使用UI仓库仅用于初始化
const uiStore = useUiStore();
const settingStore = useSettingStore();

// 生命周期钩子
onMounted(() => {
  // 加载设置
  settingStore.loadSettings();

  // 组件挂载后，默认显示今天的日期
  uiStore.goToToday();
});
</script>

<style scoped>
.calendar-app {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

/* 标题栏高度调整 */
.app-header {
  height: 48px;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* 区域布局控制 */
.header-left {
  width: 25%;
}

.header-center {
  width: 55%;
}

.header-right {
  width: 20%;
  justify-content: flex-end;
}

/* 可拖动区域 */
.drag {
  -webkit-app-region: drag;
}

/* 排除拖动区域（如按钮） */
.no-drag {
  -webkit-app-region: no-drag;
}

/* 搜索框样式调整 */
.search-box input {
  height: 32px;
}

/* 日历标题优化 */
.app-header h2 {
  max-width: 500px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 标题点击效果 */
.app-header h1 {
  transition: color 0.2s;
}

.app-header h1:hover {
  color: #4a86e8;
}

/* 导航按钮和图标按钮统一样式 */
.nav-button {
  color: #606060;
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-button:hover {
  color: #4a86e8;
  background-color: rgba(74, 134, 232, 0.1);
}

.header-icon-button {
  color: #606060;
  transition: all 0.2s ease;
}

.header-icon-button:hover {
  color: #4a86e8;
  background-color: rgba(74, 134, 232, 0.1);
}

/* 关闭按钮特殊样式 */
button:has(.fa-times) {
  color: #df4040;
}

button:has(.fa-times):hover {
  color: #c62828;
  background-color: rgba(198, 40, 40, 0.1);
}

/* 导航按钮特别样式 */
.navigation-buttons .nav-button {
  min-width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0; /* 确保没有外边距 */
}

/* 窗口操作按钮组样式 */
.window-actions button {
  margin: 0; /* 移除按钮间距 */
}

/* 右侧按钮组样式 */
.header-right button {
  margin-left: -1px; /* 使按钮边缘重叠 */
}

.header-right button:first-child {
  margin-left: 0; /* 第一个按钮不需要负margin */
}

/* 增大导航图标尺寸 */
.fa-chevron-left,
.fa-chevron-right {
  font-size: 16px;
}
</style>
