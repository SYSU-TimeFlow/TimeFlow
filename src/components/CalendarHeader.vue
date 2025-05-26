<!--
  @component: CalendarHeader
  @description: 应用程序头部组件，包含标题、导航按钮、搜索框和窗口控制按钮
  @author: huzch
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
          :value="eventStore.searchInputValue"
          @input="eventStore.updateSearchInputValue(($event.target as HTMLInputElement).value)"
          @focus="eventStore.handleSearchFocusAction"
          @blur="eventStore.handleSearchBlurAction"
          @keydown="eventStore.handleKeydownAction"
        />
        <i
          class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
        ></i>
        <!-- 搜索结果列表 -->
        <div
          v-if="eventStore.showSearchDropdown"
          class="search-results absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
        >
          <ul ref="resultListRef">
            <li
              v-for="(event, index) in eventStore.searchResults"
              :key="event.id"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              :class="{ 'search-result-focused': index === eventStore.focusedResultIndex }"
              @mousedown="eventStore.selectSearchResultAction(event)"
            >
              <span v-html="eventStore.getHighlightedHTMLContent(event.title, eventStore.searchQuery)"></span>
              <span class="text-xs text-gray-500 ml-2">{{
                formatEventDate(event.start)
              }}</span>
            </li>
            <li
              v-if="eventStore.searchQuery.trim() && eventStore.searchResults.length === 0"
              class="px-4 py-2 text-sm text-gray-500"
            >
              No results found.
            </li>
          </ul>
        </div>
      </div>
      <!-- "今天"按钮 -->
      <button
        @click="uiStore.goToToday()"
        class="nav-button py-1 px-4 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ml-1 no-drag"
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
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from "vue"; // 引入 onMounted, onUnmounted
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";
import { useEventStore } from "../stores/event"; 

// 引入各个仓库
const uiStore = useUiStore();
const settingStore = useSettingStore();
const eventStore = useEventStore(); 

// 引入preload中定义的electronAPI
const electronAPI = (window as any).electronAPI;

const resultListRef = ref<HTMLUListElement | null>(null); 

// 滚动到当前聚焦的搜索结果项
const scrollToFocusedResult = () => {
  nextTick(() => {
    if (
      resultListRef.value &&
      eventStore.focusedResultIndex > -1 &&
      eventStore.searchResults.length > 0 &&
      eventStore.focusedResultIndex < resultListRef.value.children.length // 确保索引有效
    ) {
      const focusedItem = resultListRef.value.children[
        eventStore.focusedResultIndex
      ] as HTMLLIElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  });
};

// 组件挂载时注册滚动回调
onMounted(() => {
  eventStore.setScrollUiUpdateCallback(scrollToFocusedResult);
});

// 组件卸载时清除滚动回调
onUnmounted(() => {
  eventStore.clearScrollUiUpdateCallback();
});

// 格式化事件日期，用于在搜索结果中显示
const formatEventDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};
</script>

<style scoped>
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

.search-results {
  /* 确保结果列表在其他元素之上 */
  z-index: 1000;
}

.search-results ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.search-results li {
  border-bottom: 1px solid #eee;
}

.search-results li:last-child {
  border-bottom: none;
}

.search-results li.search-result-focused {
  background-color: #e9ecef; /* 类似 Tailwind bg-gray-200 的颜色 */
}

:deep(.search-highlight) {
  background-color: yellow;
  font-weight: bold;
  padding: 0; /* 避免mark标签自带的padding影响布局 */
  margin: 0;  /* 避免mark标签自带的margin影响布局 */
  color: black; /* 确保高亮文本颜色清晰 */
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
