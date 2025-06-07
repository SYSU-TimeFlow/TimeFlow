<!--
  @component: CalendarHeader
  @description: 应用程序头部组件，包含标题、导航按钮、搜索框和窗口控制按钮
  @author: huzch
  @modified: DuSuang
  @date: 2025-05-25
-->

<template>
  <!-- 应用程序头部 -->
  <header class="app-header drag bg-white border-b border-gray-200 px-6 py-3 flex items-center dark:bg-[var(--header-bg)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]">
    <!-- 左侧区域：TimeFlow标题和日历标题 -->
    <div class="header-left flex items-center flex-shrink mr-6">
      <h1
        class="text-xl font-semibold text-gray-800 mr-6 no-drag cursor-pointer transition-colors
          dark:text-[var(--heading-color)] hover:dark:text-blue-400"
        @click="uiStore.toggleSidebar()"
        title="点击切换侧边栏"
      >
        TimeFlow
      </h1>
      <h2 class="text-lg font-medium no-drag dark:text-[var(--heading-color)]">{{ uiStore.calendarTitle }}</h2>
    </div>

    <!-- 中间区域：搜索框和导航按钮 -->
    <div class="header-center flex-1 flex justify-center items-center">
      <!-- 导航按钮组 -->
      <div class="navigation-buttons flex no-drag">
        <button
          @click="uiStore.navigateCalendar('prev')"
          class="nav-button px-2 py-2 rounded-l-md hover:bg-gray-100 cursor-pointer transition-colors
            dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)] dark:hover:bg-[var(--hover-bg)]"
        >
          <i class="fas fa-chevron-left text-base"></i>
        </button>
        <button
          @click="uiStore.navigateCalendar('next')"
          class="nav-button px-2 py-2 rounded-r-md hover:bg-gray-100 cursor-pointer transition-colors
            dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)] dark:hover:bg-[var(--hover-bg)]"
        >
          <i class="fas fa-chevron-right text-base"></i>
        </button>
      </div>

      <!-- 搜索框/模式显示区域 -->
      <div class="search-box relative no-drag ml-1">
        <!-- 模式指示器 -->
        <div
          v-if="!uiStore.isSearchActive"
          class="mode-indicator pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm w-64 h-[32px] flex items-center cursor-pointer
            bg-[#f9f9f9] hover:bg-[#f0f0f0]
            dark:bg-[var(--search-bg)] dark:border-[var(--search-border)] dark:text-[var(--text-primary)]"
          :class="{ 'command-mode': uiStore.appMode === 'command' }"
          @click="activateSearch"
        >
          <span v-if="uiStore.appMode === 'normal'" class="flex items-center w-full dark:text-[var(--text-tertiary)]">
            <i class="fas fa-keyboard mr-2 text-gray-500"></i>
            <span class="text-sm text-gray-400 ml-2">Press / to search</span>
          </span>
          <span v-else-if="uiStore.appMode === 'command'" class="flex items-center w-full dark:text-[var(--text-tertiary)]">
            <i class="fas fa-terminal mr-2 text-blue-500"></i>
            <span class="text-sm text-gray-400 ml-2">Enter command...</span>
          </span>
        </div>

        <!-- 搜索框 -->
        <input
          v-if="uiStore.isSearchActive"
          ref="searchInputRef"
          type="text"
          :placeholder="uiStore.appMode === 'normal' ? 'Search events...' : 'Enter command...'"
          class="pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64
            bg-white text-gray-900 placeholder-[#909090]
            dark:bg-[var(--search-bg)] dark:border-[var(--search-border)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-tertiary)]"
          :class="{
            'command-mode-input': uiStore.appMode === 'command',
            'search-mode-input': uiStore.appMode === 'normal',
          }"
          :value="uiStore.searchInputValue"
          @input="handleInputChange"
          @focus="uiStore.handleSearchFocusAction"
          @blur="handleSearchBlur"
          @keydown="handleSearchKeydown"
        />

        <i
          class="fas absolute left-3 top-1/2 transform -translate-y-1/2 text-sm pointer-events-none"
          :class="
            [
              uiStore.isSearchActive && uiStore.appMode === 'normal'
                ? 'fa-search text-gray-500'
                : '',
              uiStore.isSearchActive && uiStore.appMode === 'command'
                ? 'fa-terminal text-blue-600'
                : '',
              !uiStore.isSearchActive && uiStore.appMode === 'command'
                ? 'fa-terminal text-blue-500'
                : '',
            ]
          "
        ></i>

        <!-- 搜索结果列表 -->
        <div
          v-if="uiStore.showSearchDropdown && uiStore.appMode === 'normal'"
          class="search-results absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto
            dark:bg-[var(--bg-secondary)] dark:border-[var(--border-color)]"
        >
          <ul ref="resultListRef">
            <li
              v-for="(event, index) in uiStore.searchResults"
              :key="event.id"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm dark:hover:bg-[var(--hover-bg)] dark:text-[var(--text-primary)]"
              :class="{ 'search-result-focused': index === uiStore.focusedResultIndex }"
              @mousedown="uiStore.selectSearchResultAction(event)"
            >
              <span v-html="uiStore.getHighlightedHTMLContent(event.title, uiStore.searchQuery)"></span>
              <span v-if="event.eventType === 'todo' || event.eventType === 'both'">
                <span v-if="event.end && new Date(event.end).getFullYear() > 1970" class="text-xs text-gray-500 ml-2">
                  {{ formatEventDate(event.end) }}
                </span>
              </span>
              <span v-else class="text-xs text-gray-500 ml-2">
                {{ formatEventDate(event.start) }}
              </span>
            </li>
            <li
              v-if="uiStore.searchQuery.trim() && uiStore.searchResults.length === 0"
              class="px-4 py-2 text-sm text-gray-500 dark:text-[var(--text-tertiary)]"
            >
              No results found.
            </li>
          </ul>
        </div>
      </div>
      <!-- "今天"按钮 -->
      <button
        @click="uiStore.goToToday()"
        class="nav-button py-1 px-4 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ml-1 no-drag dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)] dark:hover:bg-[var(--hover-bg)]"
      >
        Today
      </button>
    </div>

    <!-- 右侧区域：其他控制按钮 -->
    <div class="header-right no-drag flex items-center flex-shrink-0">
      <!-- 通知铃铛按钮 -->
      <button
        class="header-icon-button p-2 rounded-md transition-colors relative"
        @click="toggleNotification"
        :title="settingStore.notifications ? '点击关闭通知' : '点击开启通知'"
      >
        <i
          class="fas fa-bell"
          :class="{
            'bell-shake': isBellShaking,
            'bell-disabled': !settingStore.notifications,
          }"
        ></i>
        <!-- 斜线覆盖 -->
        <svg
          v-if="!settingStore.notifications"
          class="bell-slash"
          width="22"
          height="22"
          viewBox="0 0 22 22"
        >
          <line
            x1="3"
            y1="19"
            x2="19"
            y2="3"
            stroke="#e63946"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <!-- 主题切换按钮 -->
      <button
        class="header-icon-button p-2 rounded-md transition-colors relative overflow-hidden theme-toggle-btn"
        :title="settingStore.themeMode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
        @click="handleThemeToggle"
        @mouseenter="themeBtnHover = true"
        @mouseleave="themeBtnHover = false"
      >
        <svg
          v-if="settingStore.themeMode === 'light'"
          class="theme-sun"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke="#606060" stroke-width="1.2">
            <line x1="11" y1="1.5" x2="11" y2="4" />
            <line x1="11" y1="18" x2="11" y2="20.5" />
            <line x1="1.5" y1="11" x2="4" y2="11" />
            <line x1="18" y1="11" x2="20.5" y2="11" />
            <line x1="4.5" y1="4.5" x2="6.5" y2="6.5" />
            <line x1="15.5" y1="15.5" x2="17.5" y2="17.5" />
            <line x1="4.5" y1="17.5" x2="6.5" y2="15.5" />
            <line x1="15.5" y1="6.5" x2="17.5" y2="4.5" />
          </g>
          <circle
            cx="11"
            cy="11"
            r="5"
            fill="#fff"
            stroke="#606060"
            stroke-width="2"
          />
        </svg>
        <svg
          v-else
          class="theme-moon"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.5 17.5A9.5 9.5 0 0 1 10 3.26A9.503 9.503 0 0 0 10 22a9.5 9.5 0 0 0 9.5-4.5z"
            fill="#ccc"
          />
        </svg>
      </button>
      <!-- 设置按钮 -->
      <button
        @click="uiStore.toggleSettings()"
        class="header-icon-button p-2 rounded-md transition-colors settings-cog-btn"
        title="打开设置"
        @mouseenter="isCogHovered = true"
        @mouseleave="isCogHovered = false"
      >
        <i
          class="fas fa-cog"
          :style="{
            transform: `rotate(${cogRotation}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }"
        ></i>
      </button>
      <div class="window-actions flex">
        <button
          class="header-icon-button p-1.5 rounded-l-md transition-colors"
          @click="electronAPI.minimize()"
          title="最小化"
        >
          <i class="fas fa-window-minimize"></i>
        </button>
        <button
          class="header-icon-button p-1.5 transition-colors"
          @click="electronAPI.maximize()"
          title="最大化/还原"
        >
          <i class="fas fa-window-maximize"></i>
        </button>
        <button
          class="header-icon-button p-1.5 rounded-r-md text-red-500 hover:text-red-700 transition-colors"
          @click="electronAPI.close()"
          title="关闭应用"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// =================== 依赖与状态 ===================
import { ref, nextTick, onMounted, onUnmounted, watch } from "vue";
import { useUiStore } from "@/stores/ui";
import { useSettingStore } from "@/stores/setting";
import { useEventStore } from "@/stores/event";

const uiStore = useUiStore();
const settingStore = useSettingStore();
const eventStore = useEventStore();
const electronAPI = (window as any).electronAPI;

const resultListRef = ref<HTMLUListElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const isBellShaking = ref(false);
const isCogHovered = ref(false);
const cogRotation = ref(0);
const themeBtnHover = ref(false);

// =================== 通知相关 ===================

// 已通知事件唯一标识集合，防止重复通知
const notifiedEventKeys = ref<Set<string>>(new Set());

// 生成唯一key
function getEventNotifyKey(event: any) {
  const start = event.start ? new Date(event.start).getTime() : 0;
  const end = event.end ? new Date(event.end).getTime() : 0;
  const isTodo =
    (!event.start || new Date(event.start).getFullYear() === 1970) &&
    (event.eventType === "todo" || event.eventType === "both");
  return isTodo ? `${event.id}|${end}` : `${event.id}|${start}|${end}`;
}

// 检查日程并发送通知
const checkAndNotifyEvents = () => {
  if (!settingStore.notifications) return;
  const now = new Date();
  const allEvents = eventStore.events;
  const uniqueEventsMap = new Map<number, any>();
  allEvents.forEach((event) => {
    if (event.id && !uniqueEventsMap.has(event.id)) {
      uniqueEventsMap.set(event.id, event);
    }
  });
  const uniqueEvents = Array.from(uniqueEventsMap.values());
  uniqueEvents.forEach((event) => {
    const notifyKey = getEventNotifyKey(event);
    if (!event.id || notifiedEventKeys.value.has(notifyKey)) return;
    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);
    const isStartValid = start.getFullYear() > 1970 && !isNaN(start.getTime());
    const isEndValid = end.getFullYear() > 1970 && !isNaN(end.getTime());
    if (isStartValid && isEndValid) {
      const diff = (start.getTime() - now.getTime()) / 60000;
      if (diff > 0 && diff <= 15) {
        sendEventNotification(event, "即将开始");
        notifiedEventKeys.value.add(notifyKey);
      }
    } else if (!isStartValid && isEndValid) {
      const diff = (end.getTime() - now.getTime()) / 60000;
      if (diff > 0 && diff <= 30) {
        sendEventNotification(event, "即将结束");
        notifiedEventKeys.value.add(notifyKey);
      }
    }
  });
};

// 发送系统通知
function sendEventNotification(event: any, type: string) {
  let timeInfo = "";
  const now = new Date();
  let targetTime: Date | null = null;
  if (type === "即将开始" && event.start) {
    targetTime = event.start instanceof Date ? event.start : new Date(event.start);
  } else if (type === "即将结束" && event.end) {
    targetTime = event.end instanceof Date ? event.end : new Date(event.end);
  }
  if (targetTime && !isNaN(targetTime.getTime())) {
    const diff = Math.round((targetTime.getTime() - now.getTime()) / 60000);
    if (diff > 0) {
      timeInfo = `还有${diff}分钟`;
    }
  }
  let body = type === "即将开始" ? `${timeInfo}开始` : `${timeInfo}结束`;
  if (window.electronAPI && window.electronAPI.notify) {
    window.electronAPI.notify(`日程提醒：${event.title}`, body);
  }
}

// 通知开关切换
const toggleNotification = () => {
  settingStore.notifications = !settingStore.notifications;
  isBellShaking.value = true;
  setTimeout(() => {
    isBellShaking.value = false;
  }, 600);
  if (!settingStore.notifications) {
    notifiedEventKeys.value.clear();
  }
  settingStore.saveSettings();
};

watch(
  () => settingStore.notifications,
  (newVal) => {
    if (!newVal) {
      notifiedEventKeys.value.clear();
    }
  }
);

// =================== 搜索相关 ===================

// 滚动到当前聚焦的搜索结果项
const scrollToFocusedResult = () => {
  nextTick(() => {
    if (
      resultListRef.value &&
      uiStore.focusedResultIndex > -1 &&
      uiStore.searchResults.length > 0 &&
      uiStore.focusedResultIndex < resultListRef.value.children.length
    ) {
      const focusedItem = resultListRef.value.children[uiStore.focusedResultIndex] as HTMLLIElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  });
};

// 处理搜索框失焦
const handleSearchBlur = () => {
  setTimeout(() => {
    uiStore.handleSearchBlurAction();
    uiStore.toggleSearchActive(false);
    uiStore.setAppMode("normal");
  }, 100);
};

// 处理搜索框键盘事件
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    uiStore.toggleSearchActive(false);
    uiStore.setAppMode("normal");
    uiStore.updateSearchInputValue("");
    event.preventDefault();
  } else if (event.key === "Enter" && uiStore.appMode === "command") {
    const input = event.target as HTMLInputElement;
    const commandSuccess = uiStore.executeCommand(input.value);
    if (commandSuccess) {
      uiStore.updateSearchInputValue("");
      uiStore.toggleSearchActive(false);
      uiStore.setAppMode("normal");
    } else {
      showCommandError(`未知命令: ${input.value}`);
    }
    event.preventDefault();
  } else {
    uiStore.handleKeydownAction(event);
  }
};

// 处理输入变化
const handleInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  uiStore.updateSearchInputValue(input.value);
};

// 激活搜索框
const activateSearch = () => {
  uiStore.toggleSearchActive(true);
  uiStore.setAppMode("normal");
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

// =================== 主题与设置相关 ===================

const handleThemeToggle = () => {
  settingStore.setThemeMode(settingStore.themeMode === "dark" ? "light" : "dark");
};

// 监听悬浮状态，控制设置按钮旋转角度
watch(isCogHovered, (hovered) => {
  if (hovered) {
    cogRotation.value += 90;
  } else {
    cogRotation.value -= 90;
  }
});

// =================== 全局快捷键相关 ===================

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (
    document.activeElement instanceof HTMLInputElement ||
    document.activeElement instanceof HTMLTextAreaElement ||
    document.activeElement?.hasAttribute("contenteditable")
  ) {
    return;
  }
  if (uiStore.appMode === "normal") {
    switch (event.key) {
      case "j":
      case "ArrowDown":
        uiStore.scrollApp("down");
        event.preventDefault();
        break;
      case "k":
      case "ArrowUp":
        uiStore.scrollApp("up");
        event.preventDefault();
        break;
      case "h":
      case "ArrowLeft":
        uiStore.navigateCalendar("prev");
        event.preventDefault();
        break;
      case "l":
      case "ArrowRight":
        uiStore.navigateCalendar("next");
        event.preventDefault();
        break;
      case "a":
        uiStore.toggleEventModal();
        event.preventDefault();
        break;
      case "s":
        uiStore.toggleSettings();
        event.preventDefault();
        break;
      case "/":
        uiStore.toggleSearchActive(true);
        uiStore.setAppMode("normal");
        nextTick(() => {
          searchInputRef.value?.focus();
        });
        event.preventDefault();
        break;
      case ":":
        uiStore.toggleSearchActive(true);
        uiStore.setAppMode("command");
        nextTick(() => {
          searchInputRef.value?.focus();
        });
        event.preventDefault();
        break;
      case " ":
        uiStore.toggleSidebar();
        event.preventDefault();
        break;
      case "1":
        uiStore.changeView("month");
        event.preventDefault();
        break;
      case "2":
        uiStore.changeView("week");
        event.preventDefault();
        break;
      case "3":
        uiStore.changeView("day");
        event.preventDefault();
        break;
      case "4":
        uiStore.changeView("todo-list");
        event.preventDefault();
        break;
      case "?":
        uiStore.toggleHelpModal();
        event.preventDefault();
        break;
    }
  }
};

// =================== 工具函数 ===================

// 格式化事件日期
const formatEventDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};

// 显示命令错误
const showCommandError = (message: string) => {
  console.error(message);
  // TODO: 实现更好的UI反馈
};

// =================== 生命周期 ===================

let notifyTimer: number | undefined;

onMounted(() => {
  uiStore.setScrollUiUpdateCallback(scrollToFocusedResult);
  window.addEventListener("keydown", handleGlobalKeydown);
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  notifyTimer = window.setInterval(checkAndNotifyEvents, 5000);
});

onUnmounted(() => {
  uiStore.clearScrollUiUpdateCallback();
  window.removeEventListener("keydown", handleGlobalKeydown);
  if (notifyTimer) clearInterval(notifyTimer);
});
</script>

<style scoped>
/* ================= 标题栏与布局 ================ */
.app-header {
  height: 48px;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  background-color: var(--header-bg);
  border-color: var(--border-color);
  color: var(--text-primary);
}
.header-left {
  width: 25%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
@media (min-width: 1150px) {
  .header-left {
    overflow: visible;
    text-overflow: clip;
  }
}
.header-center {
  padding-left: 0;
  width: 40%;
}
.header-right {
  width: 20%;
  justify-content: flex-end;
}
.drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}

/* ================= 搜索框与模式指示器 ================ */
.mode-indicator i {
  position: absolute;
  left: 12px;
}
.command-icon {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}
.command-mode-input:focus {
  box-shadow: 0 0 0 3px rgba(74, 134, 232, 0.3);
}
.search-box input {
  height: 32px;
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}
.search-mode-input::placeholder,
.command-mode-input::placeholder {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  font-size: 14px !important;
  font-weight: normal !important;
  color: #909090 !important;
  font-style: normal !important;
  opacity: 1 !important;
}

/* ================= 搜索结果列表 ================ */
.search-results li {
  border-bottom: 1px solid #eee;
}
.search-results li.search-result-focused {
  background-color: #e9ecef;
}
:deep(.search-highlight) {
  background-color: yellow;
  font-weight: bold;
  padding: 0;
  margin: 0;
  color: black;
}

/* ================= 按钮与图标 ================ */
.app-header h2 {
  max-width: 500px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.nav-button {
  color: #606060;
  font-size: var(--base-font-size);
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
button:has(.fa-times) {
  color: #df4040;
}
button:has(.fa-times):hover {
  color: #c62828;
  background-color: rgba(198, 40, 40, 0.1);
}


/* ================= 暗黑模式 ================ */
.dark-mode .search-box input {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}
.dark-mode .search-results {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}
.dark-mode .search-results li {
  border-color: var(--border-color);
}
.dark-mode .search-results li:hover {
  background-color: var(--hover-bg);
}
.dark-mode .nav-button {
  color: var(--text-secondary);
}
.dark-mode .nav-button:hover {
  color: var(--text-primary);
  background-color: var(--hover-bg);
}
.dark-mode :deep(.search-highlight) {
  background-color: rgba(255, 255, 0, 0.3);
  color: var(--text-primary);
}
.dark-mode .app-header h1,
.dark-mode .app-header h2 {
  color: var(--heading-color);
}
.dark-mode .mode-indicator {
  background-color: var(--search-bg);
  border-color: var(--search-border);
}

/* ================= 铃铛动画与禁用 ================ */
.bell-shake {
  animation: bell-shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes bell-shake {
  0% { transform: rotate(0); }
  10% { transform: rotate(-15deg); }
  20% { transform: rotate(10deg); }
  30% { transform: rotate(-10deg); }
  40% { transform: rotate(6deg); }
  50% { transform: rotate(-4deg); }
  60% { transform: rotate(2deg); }
  70% { transform: rotate(-1deg); }
  80% { transform: rotate(1deg); }
  90% { transform: rotate(0); }
  100% { transform: rotate(0); }
}
.bell-disabled {
  color: #bdbdbd !important;
}
.bell-slash {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 18px !important;
  height: 18px !important;
  pointer-events: none;
  z-index: 2;
  transform: rotate(-90deg) translate(-8px, 5px);
}

/* ================= 主题切换按钮 ================ */
.theme-toggle-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* ================= 其他辅助样式 ================ */
.calendar-title {
  font-size: var(--heading-font-size);
}
.nav-button {
  font-size: var(--base-font-size);
}
.view-selector {
  font-size: var(--base-font-size);
}
</style>
