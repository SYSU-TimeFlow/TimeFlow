<!--
  @component: CalendarHeader
  @description: 应用程序头部组件，包含标题、导航按钮、搜索框和窗口控制按钮
  @author: huzch
  @modified: DuSuang
  @date: 2025-05-25
-->

<template>
  <!-- 应用程序头部 -->
  <header
    class="app-header drag border-b px-6 py-3 flex items-center bg-[var(--header-bg)] border-[var(--border-color)] text-[var(--text-primary)] h-12"
  >
    <!-- 左侧区域：TimeFlow标题和日历标题 -->
    <div class="header-left flex items-center flex-shrink mr-6 w-1/4 overflow-hidden whitespace-nowrap text-ellipsis sm:overflow-visible sm:text-clip">
      <h1
        class="text-xl font-semibold mr-6 no-drag cursor-pointer transition-colors duration-200
          hover:text-[#4a86e8]
          text-[var(--heading-color)] dark:text-[var(--heading-color)]"
        @click="uiStore.toggleSidebar()"
        title="点击切换侧边栏"
      >
        TimeFlow
      </h1>
      <!-- 日历标题 -->
      <h2
        class="text-lg font-medium no-drag max-w-[500px] whitespace-nowrap text-ellipsis
          text-[var(--heading-color)] dark:text-[var(--heading-color)]"
      >
        {{ uiStore.calendarTitle }}
      </h2>
    </div>

    <!-- 中间区域：搜索框和导航按钮 -->
    <div class="header-center flex-1 flex justify-center items-center pl-0 w-2/5">
      <!-- 导航按钮组，移动到搜索框左侧 -->
      <div class="navigation-buttons flex no-drag">
        <!-- "上一个"导航按钮 -->
        <button
          @click="uiStore.navigateCalendar('prev')"
          class="nav-button px-2 py-2 rounded-l-md hover:bg-gray-100 cursor-pointer transition-colors min-w-[40px] flex justify-center items-center m-0 text-[#606060] text-base transition-all duration-200 hover:text-[#4a86e8] hover:bg-[rgba(74,134,232,0.1)]"
        >
          <i class="fas fa-chevron-left text-base"></i>
        </button>
        <!-- "下一个"导航按钮，移除边框 -->
        <button
          @click="uiStore.navigateCalendar('next')"
          class="nav-button px-2 py-2 rounded-r-md hover:bg-gray-100 cursor-pointer transition-colors min-w-[40px] flex justify-center items-center m-0 text-[#606060] text-base transition-all duration-200 hover:text-[#4a86e8] hover:bg-[rgba(74,134,232,0.1)]"
        >
          <i class="fas fa-chevron-right text-base"></i>
        </button>
      </div>

      <!-- 改造的搜索框/模式显示区域 -->
      <div class="search-box relative no-drag ml-1">
        <!-- 模式指示器，非搜索状态显示 -->
        <div
          v-if="!uiStore.isSearchActive"
          class="mode-indicator pl-8 pr-4 py-1 border rounded-md text-sm w-64 h-[32px] flex items-center cursor-pointer
            bg-[var(--bg-secondary)] border-[var(--border-color)]
            hover:bg-[var(--hover-bg)]
            dark:bg-[var(--bg-tertiary)] dark:border-[var(--border-color)] dark:hover:bg-[var(--hover-bg)]"
          :class="{ 'command-mode': uiStore.appMode === 'command' }"
          @click="activateSearch"
        >
          <span
            v-if="uiStore.appMode === 'normal'"
            class="flex items-center w-full leading-[1.5] text-[14px]"
          >
            <i class="fas fa-keyboard mr-2 text-gray-500 absolute left-3"></i>
            <span class="text-sm text-gray-400 ml-2">Press / to search</span>
          </span>
          <span
            v-else-if="uiStore.appMode === 'command'"
            class="flex items-center w-full leading-[1.5] text-[14px]"
          >
            <i class="fas fa-terminal mr-2 text-blue-500 absolute left-3"></i>
            <span class="text-sm text-gray-400 ml-2">Enter command...</span>
          </span>
        </div>

        <!-- 搜索框，搜索状态显示 -->
        <input
          v-if="uiStore.isSearchActive"
          ref="searchInputRef"
          type="text"
          :placeholder="
            uiStore.appMode === 'normal'
              ? 'Search events...'
              : 'Enter command...'
          "
          class="pl-8 pr-4 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 h-8
            bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]
            placeholder-[#909090] placeholder:text-sm placeholder:font-normal
            dark:bg-[var(--bg-tertiary)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
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
          class="search-results absolute left-0 right-0 mt-1 border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto
            bg-[var(--bg-secondary)] border-[var(--border-color)]
            dark:bg-[var(--bg-tertiary)] dark:border-[var(--border-color)]"
        >
          <ul ref="resultListRef" class="list-none p-0 m-0">
            <li
              v-for="(event, index) in uiStore.searchResults"
              :key="event.id"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-[var(--border-color)] last:border-b-0
                dark:hover:bg-[var(--hover-bg)]"
              :class="{
                'search-result-focused bg-[#e9ecef] dark:bg-[var(--selected-bg)]': index === uiStore.focusedResultIndex,
              }"
              @mousedown="uiStore.selectSearchResultAction(event)"
            >
              <span
                v-html="
                  uiStore.getHighlightedHTMLContent(
                    event.title,
                    uiStore.searchQuery
                  )
                "
              ></span>
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
              v-if="
                uiStore.searchQuery.trim() &&
                uiStore.searchResults.length === 0
              "
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
        class="nav-button py-1 px-4 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ml-1 no-drag
          text-[var(--text-secondary)] text-base transition-all duration-200
          hover:text-[#4a86e8] hover:bg-[rgba(74,134,232,0.1)]
          dark:text-[var(--text-primary)]"
      >
        Today
      </button>
    </div>

    <!-- 右侧区域：其他控制按钮 -->
    <div class="header-right no-drag flex items-center flex-shrink-0 w-1/5 justify-end">
      <!-- 通知铃铛按钮 -->
      <button
        class="header-icon-button p-2 rounded-md transition-colors relative text-[#606060] transition-all duration-200 hover:text-[#4a86e8] hover:bg-[rgba(74,134,232,0.1)]"
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
      <!-- 主题切换按钮（放在铃铛和设置按钮之间） -->
      <button
        class="header-icon-button p-2 rounded-md transition-colors relative overflow-hidden theme-toggle-btn text-[#606060] transition-all duration-200 hover:text-[#4a86e8] hover:bg-[rgba(74,134,232,0.1)]"
        :title="
          settingStore.themeMode === 'dark'
            ? '切换到亮色模式'
            : '切换到暗色模式'
        "
        @click="handleThemeToggle"
        @mouseenter="themeBtnHover = true"
        @mouseleave="themeBtnHover = false"
      >
        <!-- 亮模式：灰色太阳 -->
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
        <!-- 暗模式：新的月亮图标 -->
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
        class="header-icon-button p-2 rounded-md transition-colors settings-cog-btn text-[#606060] transition-all duration-200 hover:text-[#4a86e8] hover:bg-[rgba(74,134,232,0.1)]"
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
          class="header-icon-button p-1.5 rounded-l-md transition-colors m-0"
          @click="electronAPI.minimize()"
          title="最小化"
        >
          <i class="fas fa-window-minimize text-[var(--text-secondary)]"></i>
        </button>
        <button
          class="header-icon-button p-1.5 transition-colors m-0"
          @click="electronAPI.maximize()"
          title="最大化/还原"
        >
          <i class="fas fa-window-maximize text-[var(--text-secondary)]"></i>
        </button>
        <button
          class="header-icon-button p-1.5 rounded-r-md text-red-500 hover:text-red-700 transition-colors m-0"
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
import { ref, nextTick, onMounted, onUnmounted, watch } from "vue";
import { useUiStore } from "@/stores/ui";
import { useSettingStore } from "@/stores/setting";
import { useEventStore } from "@/stores/event";

// 仓库
const uiStore = useUiStore();
const settingStore = useSettingStore();
const eventStore = useEventStore();

// Electron API
const electronAPI = (window as any).electronAPI;

// refs
const resultListRef = ref<HTMLUListElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const isBellShaking = ref(false);
const isCogHovered = ref(false);
const cogRotation = ref(0);
const themeBtnHover = ref(false);

// 通知相关
const notifiedEventKeys = ref<Set<string>>(new Set());

// ---------- 事件通知相关 ----------
function getEventNotifyKey(event: any) {
  const start = event.start ? new Date(event.start).getTime() : 0;
  const end = event.end ? new Date(event.end).getTime() : 0;
  const isTodo =
    (!event.start || new Date(event.start).getFullYear() === 1970) &&
    (event.eventType === "todo" || event.eventType === "both");
  return isTodo ? `${event.id}|${end}` : `${event.id}|${start}|${end}`;
}

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

    const start =
      event.start instanceof Date ? event.start : new Date(event.start);
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

function sendEventNotification(event: any, type: string) {
  let timeInfo = "";
  const now = new Date();
  let targetTime: Date | null = null;

  if (type === "即将开始" && event.start) {
    targetTime =
      event.start instanceof Date ? event.start : new Date(event.start);
  } else if (type === "即将结束" && event.end) {
    targetTime = event.end instanceof Date ? event.end : new Date(event.end);
  }

  if (targetTime && !isNaN(targetTime.getTime())) {
    const diff = Math.round((targetTime.getTime() - now.getTime()) / 60000);
    if (diff > 0) {
      timeInfo = `还有${diff}分钟`;
    }
  }

  let body = "";
  if (type === "即将开始") {
    body = `${timeInfo}开始`;
  } else {
    body = `${timeInfo}结束`;
  }

  if (window.electronAPI && window.electronAPI.notify) {
    window.electronAPI.notify(`日程提醒：${event.title}`, body);
  }
}

// ---------- 搜索相关 ----------
const scrollToFocusedResult = () => {
  nextTick(() => {
    if (
      resultListRef.value &&
      uiStore.focusedResultIndex > -1 &&
      uiStore.searchResults.length > 0 &&
      uiStore.focusedResultIndex < resultListRef.value.children.length
    ) {
      const focusedItem = resultListRef.value.children[
        uiStore.focusedResultIndex
      ] as HTMLLIElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  });
};

const handleInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  uiStore.updateSearchInputValue(value);
};

const handleSearchBlur = () => {
  setTimeout(() => {
    uiStore.handleSearchBlurAction();
    uiStore.toggleSearchActive(false);
    uiStore.setAppMode("normal");
  }, 100);
};

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

const activateSearch = () => {
  uiStore.toggleSearchActive(true);
  uiStore.setAppMode("normal");
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

const formatEventDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};

const showCommandError = (message: string) => {
  console.error(message);
  // TODO: 实现更好的UI反馈
};

// ---------- 主题与通知按钮相关 ----------
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

const handleThemeToggle = () => {
  settingStore.setThemeMode(
    settingStore.themeMode === "dark" ? "light" : "dark"
  );
};

// ---------- 全局快捷键 ----------
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

// ---------- 生命周期 ----------
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

// ---------- 监听 ----------
watch(
  () => settingStore.notifications,
  (newVal) => {
    if (!newVal) {
      notifiedEventKeys.value.clear();
    }
  }
);

watch(isCogHovered, (hovered) => {
  if (hovered) {
    cogRotation.value += 90;
  } else {
    cogRotation.value -= 90;
  }
});
</script>

<style scoped>
/* 仅保留 Tailwind 无法覆盖的功能性样式 */

/* 可拖动区域 */
.drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}

/* 搜索结果高亮 */
:deep(.search-highlight) {
  background-color: yellow;
  font-weight: bold;
  padding: 0;
  margin: 0;
  color: black;
}
:global(.dark-mode) :deep(.search-highlight) {
  background-color: rgba(255, 255, 0, 0.3);
  color: var(--text-primary);
}

/* 铃铛动画与禁用 */
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

/* 齿轮旋转动画 */
.settings-cog-btn i {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 命令模式动画 */
.command-icon {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

/* 主题切换按钮布局 */
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
</style>
