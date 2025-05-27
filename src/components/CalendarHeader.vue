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
          class="nav-button px-2 py-2 rounded-l-md hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <i class="fas fa-chevron-left text-base"></i>
        </button>
        <!-- "下一个"导航按钮，移除边框 -->
        <button
          @click="uiStore.navigateCalendar('next')"
          class="nav-button px-2 py-2 rounded-r-md hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <i class="fas fa-chevron-right text-base"></i>
        </button>
      </div>

      <!-- 改造的搜索框/模式显示区域 -->
      <div class="search-box relative no-drag ml-1">
        <!-- 模式指示器，非搜索状态显示 -->
        <div
          v-if="!uiStore.isSearchActive"
          class="mode-indicator pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm w-64 h-[32px] flex items-center cursor-pointer"
          :class="{ 'command-mode': uiStore.appMode === 'command' }"
          @click="activateSearch"
        >
          <span
            v-if="uiStore.appMode === 'normal'"
            class="flex items-center w-full"
          >
            <i class="fas fa-keyboard mr-2 text-gray-500"></i>
            <span class="text-sm text-gray-400 ml-2">Press / to search</span>
          </span>
          <span
            v-else-if="uiStore.appMode === 'command'"
            class="flex items-center w-full"
          >
            <i class="fas fa-terminal mr-2 text-blue-500"></i>
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
          class="pl-8 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          :class="{
            'command-mode-input': uiStore.appMode === 'command',
            'search-mode-input': uiStore.appMode === 'normal',
          }"
          :value="eventStore.searchInputValue"
          @input="handleInputChange"
          @focus="eventStore.handleSearchFocusAction"
          @blur="handleSearchBlur"
          @keydown="handleSearchKeydown"
        />

        <i
          class="fas absolute left-3 top-1/2 transform -translate-y-1/2 text-sm pointer-events-none"
          :class=" [
            uiStore.isSearchActive && uiStore.appMode === 'normal'
              ? 'fa-search text-gray-500'
              : '',
            uiStore.isSearchActive && uiStore.appMode === 'command'
              ? 'fa-terminal text-blue-600'
              : '',
            !uiStore.isSearchActive && uiStore.appMode === 'command'
              ? 'fa-terminal text-blue-500'
              : '',
          ]"
        ></i>

        <!-- 搜索结果列表 -->
        <div
          v-if="eventStore.showSearchDropdown && uiStore.appMode === 'normal'"
          class="search-results absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
        >
          <ul ref="resultListRef">
            <li
              v-for="(event, index) in eventStore.searchResults"
              :key="event.id"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              :class="{
                'search-result-focused':
                  index === eventStore.focusedResultIndex,
              }"
              @mousedown="eventStore.selectSearchResultAction(event)"
            >
              <span
                v-html="
                  eventStore.getHighlightedHTMLContent(
                    event.title,
                    eventStore.searchQuery
                  )
                "
              ></span>
              <span class="text-xs text-gray-500 ml-2">{{
                formatEventDate(event.start)
              }}</span>
            </li>
            <li
              v-if="
                eventStore.searchQuery.trim() &&
                eventStore.searchResults.length === 0
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
        class="nav-button py-1 px-4 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ml-1 no-drag"
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
        :title="isNotificationEnabled ? '点击关闭通知' : '点击开启通知'"
      >
        <i
          class="fas fa-bell"
          :class="{
            'bell-shake': isBellShaking,
            'bell-disabled': !isNotificationEnabled,
          }"
        ></i>
        <!-- 斜线覆盖 -->
        <svg
          v-if="!isNotificationEnabled"
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
import { ref, nextTick, onMounted, onUnmounted } from "vue";
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
const searchInputRef = ref<HTMLInputElement | null>(null);

const isNotificationEnabled = ref(true); // 通知开关
const isBellShaking = ref(false); // 控制震动动画

// 已通知事件ID集合，防止重复通知
const notifiedEventIds = ref<Set<number>>(new Set());

// 切换通知状态并触发动画
const toggleNotification = () => {
  isNotificationEnabled.value = !isNotificationEnabled.value;
  isBellShaking.value = true;
  setTimeout(() => {
    isBellShaking.value = false;
  }, 600);
  if (!isNotificationEnabled.value) {
    notifiedEventIds.value.clear(); // 关闭通知时清空已通知事件
  }
};

// 检查日程并发送通知
const checkAndNotifyEvents = () => {
  if (!isNotificationEnabled.value) return;
  const now = new Date();

  // 合并日历事件和Todo事件，按id去重
  const allEvents = [
    ...eventStore.events.filter(e => e.eventType !== "todo"),
    ...eventStore.events.filter(e => e.eventType === "todo"),
  ];
  const uniqueEventsMap = new Map<number, any>();
  allEvents.forEach(event => {
    if (event.id && !uniqueEventsMap.has(event.id)) {
      uniqueEventsMap.set(event.id, event);
    }
  });
  const uniqueEvents = Array.from(uniqueEventsMap.values());

  uniqueEvents.forEach((event) => {
    if (!event.id || notifiedEventIds.value.has(event.id)) return;
    const start =
      event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);

    // 1. 有开始和截止时间，且距离开始时间<=15分钟
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diff = (start.getTime() - now.getTime()) / 60000;
      if (diff > 0 && diff <= 15) {
        sendEventNotification(event, "即将开始");
        notifiedEventIds.value.add(event.id);
      }
    }
    // 2. 只有截止时间，且距离截止<=30分钟
    else if (
      (!start || isNaN(start.getTime())) &&
      end &&
      !isNaN(end.getTime())
    ) {
      const diff = (end.getTime() - now.getTime()) / 60000;
      if (diff > 0 && diff <= 30) {
        sendEventNotification(event, "即将结束");
        notifiedEventIds.value.add(event.id);
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
      timeInfo = `（还有${diff}分钟）`;
    }
  }

  let body = "";
  if (type === "即将开始") {
    body = `日程${type}${event.title}：${timeInfo}开始`;
  } else {
    body = `日程${type}${event.title}：${timeInfo}结束`;
  }

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      const n = new Notification(`日程提醒：${event.title}`, {
        body,
        silent: false,
      });
      setTimeout(() => n.close(), 3000);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          sendEventNotification(event, type);
        }
      });
    }
  }
}

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

let notifyTimer: number | undefined;

onMounted(() => {
  eventStore.setScrollUiUpdateCallback(scrollToFocusedResult);

  // 注册全局键盘事件
  window.addEventListener("keydown", handleGlobalKeydown);
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  notifyTimer = window.setInterval(checkAndNotifyEvents, 5000);//每隔5秒检查一次
});

// 组件卸载时清除滚动回调
onUnmounted(() => {
  eventStore.clearScrollUiUpdateCallback();

  // 清除全局键盘事件
  window.removeEventListener("keydown", handleGlobalKeydown);
  if (notifyTimer) clearInterval(notifyTimer);
});

// 格式化事件日期，用于在搜索结果中显示
const formatEventDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};

// 处理搜索框失焦
const handleSearchBlur = () => {
  // 延迟处理，防止点击搜索结果时结果框消失过快
  setTimeout(() => {
    eventStore.handleSearchBlurAction();
    uiStore.toggleSearchActive(false);
    uiStore.setAppMode("normal");
  }, 100);
};

// 处理搜索框键盘事件
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    uiStore.toggleSearchActive(false);
    uiStore.setAppMode("normal");
    eventStore.updateSearchInputValue(""); // 清空搜索/命令内容
    // 阻止默认的ESC行为
    event.preventDefault();
  } else if (event.key === "Enter" && uiStore.appMode === "command") {
    // 处理命令提交
    const input = event.target as HTMLInputElement;
    // 直接传入输入值，executeCommand内部会处理冒号前缀
    const commandSuccess = uiStore.executeCommand(input.value);

    if (commandSuccess) {
      // 命令执行成功后清空输入框并关闭搜索
      eventStore.updateSearchInputValue("");
      uiStore.toggleSearchActive(false);
      uiStore.setAppMode("normal");
    } else {
      // 命令无法识别时显示反馈
      showCommandError(`未知命令: ${input.value}`);
    }

    event.preventDefault();
  } else {
    // 处理普通搜索逻辑
    eventStore.handleKeydownAction(event);
  }
};

// 显示命令错误的函数
const showCommandError = (message: string) => {
  // 这里可以添加UI反馈，比如一个短暂的通知或者在命令框下方显示错误信息
  console.error(message);
  // TODO: 实现更好的UI反馈
};

// 处理全局键盘事件
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // 如果是在输入框、textarea等元素中则不拦截
  if (
    document.activeElement instanceof HTMLInputElement ||
    document.activeElement instanceof HTMLTextAreaElement ||
    document.activeElement?.hasAttribute("contenteditable")
  ) {
    return;
  }

  // Normal模式快捷键
  if (uiStore.appMode === "normal") {
    switch (event.key) {
      case "j":
      case "ArrowDown": // 添加向下箭头键
        uiStore.scrollApp("down");
        event.preventDefault();
        break;
      case "k":
      case "ArrowUp": // 添加向上箭头键
        uiStore.scrollApp("up");
        event.preventDefault();
        break;
      case "h":
      case "ArrowLeft": // 添加向左箭头键
        uiStore.navigateCalendar("prev");
        event.preventDefault();
        break;
      case "l":
      case "ArrowRight": // 添加向右箭头键
        uiStore.navigateCalendar("next");
        event.preventDefault();
        break;
      case "a":
        eventStore.toggleEventModal();
        event.preventDefault();
        break;
      case "s":
        settingStore.toggleSettings();
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

// 处理输入变化
const handleInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  eventStore.updateSearchInputValue(value);
};

// 激活搜索框
const activateSearch = () => {
  uiStore.toggleSearchActive(true);
  uiStore.setAppMode("normal");
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};
</script>

<style scoped>
/* 标题栏高度调整 */
.app-header {
  height: 48px;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  background-color: var(--header-bg);
  border-color: var(--border-color);
  color: var(--text-primary);
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

/* 模式指示器样式优化 */
.mode-indicator {
  cursor: default;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  padding-left: 2rem; /* 确保左侧图标有足够空间 */
}

.mode-indicator:hover {
  background-color: #f0f0f0;
}

.mode-indicator i {
  position: absolute;
  left: 12px; /* 确保图标位置一致 */
}

/* 模式指示器文本统一样式 */
.mode-indicator span {
  line-height: 1.5;
  font-size: 14px;
}

/* 搜索模式特殊样式 */
.search-mode-input {
  border-color: #ced4da;
  background-color: #ffffff;
}

.search-mode-input:focus {
  border-color: #4a86e8;
}

/* Command模式特殊样式 */
.command-mode {
  border-color: #4a86e8;
  background-color: rgba(74, 134, 232, 0.05);
  border-width: 1px;
  border-style: solid;
}

.command-mode-input {
  border-color: #4a86e8;
  background-color: rgba(74, 134, 232, 0.05);
  border-width: 2px;
  border-style: solid;
  font-family: "Consolas", "Monaco", monospace;
  color: #1a56db;
  font-weight: 500;
}

.command-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

/* 确保命令模式下的聚焦状态也有特殊样式 */
.command-mode-input:focus {
  box-shadow: 0 0 0 3px rgba(74, 134, 232, 0.3);
}

/* 搜索框样式优化 */
.search-box input {
  height: 32px;
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

/* 统一所有模式下placeholder的样式 */
.search-box input::placeholder {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif !important;
  font-size: 14px !important;
  font-weight: normal !important;
  color: #909090 !important;
  font-style: normal !important;
  opacity: 1 !important;
}

/* 覆盖任何可能的浏览器默认样式 */
.search-mode-input::placeholder,
.command-mode-input::placeholder {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif !important;
  font-size: 14px !important;
  font-weight: normal !important;
  color: #909090 !important;
  font-style: normal !important;
  opacity: 1 !important;
}

/* 确保结果列表在其他元素之上 */
.search-results {
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
  margin: 0; /* 避免mark标签自带的margin影响布局 */
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

/* 暗黑模式下的搜索框优化 */
.dark-mode .search-box input {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.dark-mode .search-box input::placeholder {
  color: var(--text-tertiary);
}

/* 暗黑模式下的搜索结果列表 */
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

.dark-mode .search-results li.search-result-focused {
  background-color: var(--selected-bg);
  color: var(--text-primary);
}

/* 暗黑模式下的导航按钮 */
.dark-mode .nav-button {
  color: var(--text-secondary);
}

.dark-mode .nav-button:hover {
  color: var(--text-primary);
  background-color: var(--hover-bg);
}

/* 修复暗黑模式下的高亮标记 */
.dark-mode :deep(.search-highlight) {
  background-color: rgba(255, 255, 0, 0.3);
  color: var(--text-primary);
}

/* 在暗黑模式样式部分添加/修改 */

/* 标题颜色改为深蓝色 */
.dark-mode .app-header h1,
.dark-mode .app-header h2 {
  color: var(--heading-color);
}

/* 搜索框样式统一 */
.dark-mode .mode-indicator {
  background-color: var(--search-bg);
  border-color: var(--search-border);
}

.dark-mode .search-box input {
  background-color: var(--search-bg);
  border-color: var(--search-border);
  color: var(--text-primary);
}

/* 命令模式样式微调 */
.dark-mode .command-mode {
  background-color: rgba(74, 136, 229, 0.1);
  border-color: #4a88e5;
}

.dark-mode .command-mode-input:focus {
  box-shadow: 0 0 0 2px rgba(74, 136, 229, 0.3);
}

/* 修复暗黑模式下的搜索框placeholder颜色 */
.dark-mode .search-box input::placeholder,
.dark-mode .search-mode-input::placeholder,
.dark-mode .command-mode-input::placeholder {
  color: var(--text-tertiary) !important;
}

/* 修复模式指示器文本颜色 */
.dark-mode .mode-indicator span {
  color: var(--text-tertiary);
}

/* 铃铛按钮震动动画 */
.bell-shake {
  animation: bell-shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes bell-shake {
  0% { transform: rotate(0);}
  10% { transform: rotate(-15deg);}
  20% { transform: rotate(10deg);}
  30% { transform: rotate(-10deg);}
  40% { transform: rotate(6deg);}
  50% { transform: rotate(-4deg);}
  60% { transform: rotate(2deg);}
  70% { transform: rotate(-1deg);}
  80% { transform: rotate(1deg);}
  90% { transform: rotate(0);}
  100% { transform: rotate(0);}
}

/* 铃铛禁用状态样式 */
.bell-disabled {
  color: #bdbdbd !important;
}

/* 铃铛斜线覆盖样式 */
.bell-slash {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 18px !important;
  height: 18px !important;
  pointer-events: none;
  z-index: 2;
  /* 旋转和微调位置，让斜线自然穿过铃铛 */
  transform: rotate(-90deg) translate(-8px, 5px);
}
</style>
