<!--
  @component: CalendarHeader
  @description: 应用程序头部组件，包含标题、导航按钮、搜索框和窗口控制按钮
  @author: huzch
  @modified: lijzh89
  @date: 2025-05-25
-->

<template>
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
          :style="{
            color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
          }"
        >
          <i class="fas fa-chevron-left text-base"></i>
        </button>
        <!-- "下一个"导航按钮，移除边框 -->
        <button
          @click="uiStore.navigateCalendar('next')"
          class="nav-button px-4 py-2 rounded-r-md hover:bg-gray-100 cursor-pointer transition-colors"
          :style="{
            color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
          }"
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
          :style="{
            color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
            backgroundColor:
              settingStore.themeMode === 'dark' ? '#1e2235' : '#ffffff',
            borderColor:
              settingStore.themeMode === 'dark' ? '#2a2f3d' : '#d1d5db',
          }"
        />
        <i
          class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
          :style="{
            color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
          }"
        ></i>
      </div>
      <!-- "今天"按钮 -->
      <button
        @click="uiStore.goToToday()"
        class="nav-button today-button py-1 px-4 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ml-1"
        :style="{
          color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
        }"
      >
        Today
      </button>
    </div>

    <!-- 右侧区域：其他控制按钮 -->
    <div class="header-right no-drag flex items-center flex-shrink-0">
      <!-- 保留原有按钮 -->
      <button
        class="header-icon-button p-2 rounded-md transition-colors"
        :style="{
          color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
        }"
      >
        <i class="fas fa-bell"></i>
      </button>
      <!-- 设置按钮 -->
      <button
        @click="settingStore.toggleSettings"
        class="header-icon-button p-2 rounded-md transition-colors"
        title="打开设置"
        :style="{
          color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
        }"
      >
        <i class="fas fa-cog"></i>
      </button>
      <div class="window-actions flex">
        <button
          class="header-icon-button p-1.5 rounded-l-md transition-colors"
          @click="electronAPI.minimize()"
          :style="{
            color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
          }"
        >
          <i class="fas fa-window-minimize"></i>
        </button>
        <button
          class="header-icon-button p-1.5 transition-colors"
          @click="electronAPI.maximize()"
          :style="{
            color: settingStore.themeMode === 'dark' ? '#ffffff' : '#606060',
          }"
        >
          <i class="fas fa-window-maximize"></i>
        </button>
        <button
          class="header-icon-button p-1.5 rounded-r-md transition-colors"
          @click="electronAPI.close()"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";

// 引入各个仓库
const uiStore = useUiStore();
const settingStore = useSettingStore();

// 引入preload中定义的electronAPI
// 该API用于与Electron主进程进行通信
const electronAPI = (window as any).electronAPI;
</script>

<style scoped>
.calendar-header {
  padding: 1rem;
  border-bottom: 1px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-selector {
  display: flex;
  gap: 0.5rem;
}

.view-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.view-button.active {
  background-color: #2563eb;
  color: white;
}

.navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-button {
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.nav-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav-button i {
  font-size: 1rem;
}

.current-date {
  font-size: 1.25rem;
  font-weight: 600;
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-button i {
  font-size: 1rem;
}

.action-button.primary {
  background-color: #2563eb;
  color: white;
}

.action-button.primary:hover {
  background-color: #1d4ed8;
}

.action-button.secondary {
  background-color: #f3f4f6;
}

.action-button.secondary:hover {
  background-color: #e5e7eb;
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

/* 深色模式下的所有文字和图标 */
.dark .app-header {
  background-color: #0d1117;
  border-color: #30363d;
}

.dark .app-header h1,
.dark .app-header h2,
.dark .nav-button,
.dark .header-icon-button,
.dark .fa-search,
.dark .fas,
.dark .search-box input,
.dark .search-box input::placeholder {
  color: #c9d1d9 !important;
}

.dark .nav-button:hover,
.dark .header-icon-button:hover {
  color: #58a6ff !important;
  background-color: rgba(88, 166, 255, 0.2) !important;
}

.dark .search-box input {
  background-color: #161b22;
  border-color: #30363d;
}

.dark .search-box input:focus {
  border-color: #58a6ff;
  background-color: #161b22;
}

/* 深色模式下的Today按钮 */
.dark .today-button {
  color: #c9d1d9 !important;
}

.dark .today-button:hover {
  color: #58a6ff !important;
  background-color: rgba(88, 166, 255, 0.2) !important;
}
</style>
