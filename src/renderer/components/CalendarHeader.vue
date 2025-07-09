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
    class="app-header drag px-6 py-3 flex items-center h-12"
  >
    <!-- 左侧区域：TimeFlow标题和日历标题 -->
    <div class="header-left flex items-center flex-shrink mr-6 w-1/4 truncate">
      <h1
        class="font-semibold mr-6 no-drag cursor-pointer transition-colors
          text-[var(--heading-color)] hover:text-[#4a86e8]"
        @click="uiStore.toggleSidebar()"
        title="点击切换侧边栏"
      >
        TimeFlow
      </h1>
      <!-- 日历标题 -->
      <h2
        class="font-medium no-drag truncate text-[var(--heading-color)]"
      >
        {{ uiStore.calendarTitle }}
      </h2>
    </div>

    <!-- 中间区域：搜索框和导航按钮 -->
    <div class="header-center flex-1 flex justify-center items-center w-2/5">
      <!-- 导航按钮组，移动到搜索框左侧 -->
      <div class="navigation-buttons flex no-drag">
        <!-- "上一个"导航按钮 -->
        <button
          @click="uiStore.navigateCalendar('prev')"
          class="header-icon-button px-2 py-2 rounded-l-md cursor-pointer min-w-[40px] transition-colors"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <!-- "今天"按钮 -->
        <button
          @click="uiStore.goToToday()"
          class="header-icon-button py-1 px-4 cursor-pointer no-drag border-y border-x-0 border-[var(--border-color)]"
        >
          Today
        </button>
        <!-- "下一个"导航按钮 -->
        <button
          @click="uiStore.navigateCalendar('next')"
          class="header-icon-button px-2 py-2 rounded-r-md cursor-pointer min-w-[40px] transition-colors"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- 改造的搜索框/模式显示区域 -->
      <div class="search-box relative no-drag ml-1">
        <!-- 模式指示器，非搜索状态显示 -->
        <div
          v-if="!uiStore.isSearchActive"
          class="mode-indicator pl-8 pr-4 py-1 border rounded-md w-64 h-8 flex items-center cursor-pointer
            hover:bg-[var(--hover-bg)]"
          @click="activateSearch"
        >
          <span
            class="flex items-center w-full leading-[1.5]"
          >
            <i class="fas fa-keyboard mr-2 absolute left-3"></i>
            <span class="ml-2">Press / to search</span>
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
          class="pl-8 pr-4 py-1 border rounded-md focus:outline-none w-64 h-8
            placeholder-gray-400"
          :value="uiStore.searchInputValue"
          @input="handleInputChange"
          @focus="uiStore.handleSearchFocusAction"
          @blur="handleSearchBlur"
          @keydown="handleSearchKeydown"
        />

        <i
          class="fas absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          :class="[
              uiStore.isSearchActive && uiStore.appMode === 'normal'
                ? 'fa-search'
                : '',
              uiStore.isSearchActive && uiStore.appMode === 'command'
                ? 'fa-terminal text-blue-600'
                : '',
          ]"
        ></i>

        <!-- 搜索结果列表 -->
        <div
          v-if="uiStore.showSearchDropdown && uiStore.appMode === 'normal'"
          class="search-results absolute left-0 right-0 mt-1 border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto
            "
        >
          <ul ref="resultListRef" class="list-none p-0 m-0">
            <li
              v-for="(event, index) in uiStore.searchResults"
              :key="event.id"
              class="px-4 py-2 cursor-pointer border-b border-[var(--border-color)] last:border-b-0"
              :class="{
                'bg-[var(--selected-bg)]': index === uiStore.focusedResultIndex,
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
                <span v-if="event.end && new Date(event.end).getFullYear() > 1970" class="text-xs ml-2">
                  {{ formatEventDate(event.end) }}
                </span>
              </span>
              <span v-else class="text-xs ml-2">
                {{ formatEventDate(event.start) }}
              </span>
            </li>
            <li
              v-if="
                uiStore.searchQuery.trim() &&
                uiStore.searchResults.length === 0
              "
              class="px-4 py-2"
            >
              No results found.
            </li>
          </ul>
        </div>
      </div>
      <!-- 新增：麦克风按钮 -->
      <button
        @click="handleSpeechRecognition"
        class="header-icon-button py-1 px-3 rounded-md cursor-pointer no-drag ml-2"
        title="语音输入"
      >
        <i class="fas fa-microphone"></i>
      </button>
    </div>

    <!-- 右侧区域：其他控制按钮 -->
    <div class="header-right no-drag flex items-center flex-shrink-0 w-1/5 justify-end">
      <!-- 导入课程按钮 -->
      <button
        class="header-icon-button p-1.5 rounded-md relative"
        @click="eventStore.importScheduleFromFile"
        title="导入课程"
      >
        <i class="fas fa-file-import"></i>
      </button>
      <!-- 通知铃铛按钮 -->
      <button
        class="header-icon-button p-1.5 rounded-md relative"
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
        class="header-icon-button p-1.5 rounded-md relative transition-colors"
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
          viewBox="0 0 22 22"
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
        class="header-icon-button p-1.5 rounded-md transition-colors"
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
          <i class="fas fa-window-minimize"></i>
        </button>
        <button
          class="header-icon-button p-1.5 transition-colors m-0"
          @click="electronAPI.maximize()"
          title="最大化/还原"
        >
          <i class="fas fa-window-maximize"></i>
        </button>
        <button
          class="p-1.5 rounded-r-md text-red-500 hover:bg-[rgba(213,121,130,0.25)] transition-colors m-0"
          @click="electronAPI.close()"
          title="关闭应用"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- 新增：语音识别弹窗 -->
  <div v-if="isSpeechModalVisible" class="speech-modal-overlay">
    <div class="speech-modal-content no-drag">
      <h3 class="speech-modal-title">语音输入</h3>
      <p class="speech-status">{{ speechStatus }}</p>
      <div ref="transcriptDivRef" class="speech-transcript" contenteditable="true"></div>
      <div class="speech-modal-actions">
        <button @click="handleSpeechCancel" class="speech-btn-cancel">取消</button>
        <button @click="handleSpeechDone" class="speech-btn-done">完成</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from "vue";
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";
import { useEventStore } from "../stores/event";

const uiStore = useUiStore();
const settingStore = useSettingStore();
const eventStore = useEventStore();

const electronAPI = (window as any).electronAPI;

const resultListRef = ref<HTMLUListElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const isBellShaking = ref(false); // 控制震动动画
const isCogHovered = ref(false);
const cogRotation = ref(0);
const themeBtnHover = ref(false);

// ==================== 语音识别功能 (新实现) ====================
const isSpeechModalVisible = ref(false);
const speechStatus = ref("点击“完成”或“取消”");
const transcriptDivRef = ref<HTMLDivElement | null>(null);
let recognition: any = null; // SpeechRecognition 实例
let finalTranscript = '';

const handleSpeechRecognition = async () => {
  // 检查 electronAPI 是否可用
  if (!electronAPI || !electronAPI.processNaturalLanguage) {
    speechStatus.value = "错误：自然语言处理功能不可用。";
    isSpeechModalVisible.value = true;
    return;
  }

  isSpeechModalVisible.value = true;
  speechStatus.value = "请输入事件描述，例如“明天下午3点开会”";
  finalTranscript = ''; // 重置之前的记录
  
  nextTick(() => {
    if (transcriptDivRef.value) {
      transcriptDivRef.value.innerHTML = ''; // 清空显示区域
      transcriptDivRef.value.focus();
    }
  });
};

// 用户点击“完成”按钮
const handleSpeechDone = async () => {
  if (!transcriptDivRef.value || !transcriptDivRef.value.innerText.trim()) {
    // @ts-ignore
    window.electronAPI.notify('提示', '输入内容不能为空。');
    return;
  }

  const text = transcriptDivRef.value.innerText.trim();
  speechStatus.value = "正在处理...";

  try {
    // 调用主进程的自然语言处理 API
    const result = await electronAPI.processNaturalLanguage(text);

    if (result && result.success) {
      // 如果成功，调用 eventStore 创建事件
      eventStore.createEventFromNLP(result.event);
      isSpeechModalVisible.value = false; // 关闭弹窗
    } else {
      // 处理失败，给用户一个提示
      speechStatus.value = `处理失败: ${result.message || '未知错误'}`;
      console.error("NLP Error:", result ? result.message : "Unknown error");
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.notify) {
        // @ts-ignore
        window.electronAPI.notify('创建事件失败', result.message || '无法解析您的输入，请检查内容和格式。');
      }
    }
  } catch (error) {
    console.error("Error processing natural language:", error);
    const errorMessage = error instanceof Error ? error.message : '发生未知错误';
    speechStatus.value = `处理出错: ${errorMessage}`;
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.notify) {
      // @ts-ignore
      window.electronAPI.notify('创建事件失败', '处理您的请求时发生了一个内部错误。');
    }
  }
};

// 用户点击“取消”按钮
const handleSpeechCancel = () => {
  // 由于逻辑在主进程，前端只需关闭弹窗
  isSpeechModalVisible.value = false;
};


// ==================== 事件通知功能 ====================
// 已通知事件唯一标识集合，防止重复通知（考虑时间变化）
const notifiedEventKeys = ref<Set<string>>(new Set());

// 生成唯一key
function getEventNotifyKey(event: any) {
  // 判断是否为待办事项（start为1970年）
  const start = event.start ? new Date(event.start).getTime() : 0;
  const end = event.end ? new Date(event.end).getTime() : 0;
  const isTodo =
    (!event.start || new Date(event.start).getFullYear() === 1970) &&
    (event.eventType === "todo" || event.eventType === "both");
  // 对于待办事项，只用id和end，日历事件用id+start+end
  return isTodo ? `${event.id}|${end}` : `${event.id}|${start}|${end}`;
}

// 检查日程并发送通知
const checkAndNotifyEvents = () => {
  if (!settingStore.notifications) return;
  const now = new Date();

  // 合并所有事件，按id去重
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

    // 解析开始和结束时间
    const start =
      event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);

    const isStartValid = start.getFullYear() > 1970 && !isNaN(start.getTime());
    const isEndValid = end.getFullYear() > 1970 && !isNaN(end.getTime());

    // 1. 有开始和截止时间，且距离开始时间<=15分钟
    if (isStartValid && isEndValid) {
      const diff = (start.getTime() - now.getTime()) / 60000;
      if (diff > 0 && diff <= 15) {
        sendEventNotification(event, "即将开始");
        notifiedEventKeys.value.add(notifyKey);
      }
    }
    // 2. 只有截止时间，且距离截止<=30分钟
    else if (!isStartValid && isEndValid) {
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

// 通知开关切换
const toggleNotification = () => {
  settingStore.notifications = !settingStore.notifications;
  isBellShaking.value = true;
  setTimeout(() => {
    isBellShaking.value = false;
  }, 600);

  // 关闭通知时清空，开启时不清空
  if (!settingStore.notifications) {
    notifiedEventKeys.value.clear();
  }

  // 保存设置更改
  settingStore.saveSettings();
};

// ==================== 事件搜索功能 ====================
// 滚动到当前聚焦的搜索结果项
const scrollToFocusedResult = () => {
  nextTick(() => {
    if (
      resultListRef.value &&
      uiStore.focusedResultIndex > -1 &&
      uiStore.searchResults.length > 0 &&
      uiStore.focusedResultIndex < resultListRef.value.children.length // 确保索引有效
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

// 处理搜索框失焦
const handleSearchBlur = () => {
  // 延迟处理，防止点击搜索结果时结果框消失过快
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
    uiStore.updateSearchInputValue(""); // 清空搜索/命令内容
    // 阻止默认的ESC行为
    event.preventDefault();
  } else if (event.key === "Enter" && uiStore.appMode === "command") {
    // 处理命令提交
    const input = event.target as HTMLInputElement;
    // 直接传入输入值，executeCommand内部会处理冒号前缀
    const commandSuccess = uiStore.executeCommand(input.value);

    if (commandSuccess) {
      // 命令执行成功后清空输入框并关闭搜索
      uiStore.updateSearchInputValue("");
      uiStore.toggleSearchActive(false);
      uiStore.setAppMode("normal");
    } else {
      // 命令无法识别时显示反馈
      showCommandError(`未知命令: ${input.value}`);
    }

    event.preventDefault();
  } else {
    // 处理普通搜索逻辑
    uiStore.handleKeydownAction(event);
  }
};

// 处理输入变化
const handleInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  uiStore.updateSearchInputValue(value);
};

// 激活搜索框
const activateSearch = () => {
  uiStore.toggleSearchActive(true);
  uiStore.setAppMode("normal");
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

// 格式化事件日期，用于在搜索结果中显示
const formatEventDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};

// 显示命令错误的函数
const showCommandError = (message: string) => {
  // 这里可以添加UI反馈，比如一个短暂的通知或者在命令框下方显示错误信息
  console.error(message);
  // TODO: 实现更好的UI反馈
};

// ==================== 全局快捷键 ====================
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
        uiStore.changeView("todo");
        event.preventDefault();
        break;
      case "?":
        uiStore.toggleHelpModal();
        event.preventDefault();
        break;
    }
  }
};

// ==================== 主题切换按钮 ====================
const handleThemeToggle = () => {
  // 直接调用 settingStore 的 setThemeMode，保证与设置界面同步
  settingStore.setThemeMode(
    settingStore.themeMode === "dark" ? "light" : "dark"
  );
};

// ==================== 生命周期 ====================
let notifyTimer: number | undefined;

onMounted(() => {
  uiStore.setScrollUiUpdateCallback(scrollToFocusedResult);

  // 注册全局键盘事件
  window.addEventListener("keydown", handleGlobalKeydown);
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  notifyTimer = window.setInterval(checkAndNotifyEvents, 5000); //每隔5秒检查一次
});

// 组件卸载时清除滚动回调
onUnmounted(() => {
  uiStore.clearScrollUiUpdateCallback();

  // 清除全局键盘事件
  window.removeEventListener("keydown", handleGlobalKeydown);
  if (notifyTimer) clearInterval(notifyTimer);
});

watch(
  () => settingStore.notifications,
  (newVal) => {
    if (!newVal) {
      // 如果通知被关闭，清空已通知的记录
      notifiedEventKeys.value.clear();
    }
  }
);

// 监听悬浮状态，控制旋转角度
watch(isCogHovered, (hovered) => {
  if (hovered) {
    cogRotation.value += 90;
  } else {
    cogRotation.value -= 90;
  }
});
</script>

<style scoped>
.app-header {
  background-color: var(--header-bg);
}

/* 可拖动区域 */
.drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}

/* 搜索框样式 */
.search-box .mode-indicator,
.search-box input,
.search-box .search-results {
  font-size: var(--small-text-font-size);
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}

.search-box .mode-indicator,
.search-box .search-results {
  color: var(--text-tertiary);
}

.search-box input {
  color: var(--text-primary);
}

/* 搜索结果高亮 */
:deep(.search-highlight) {
  background-color: yellow;
  font-weight: bold;
  padding: 0;
  margin: 0;
  color: black;
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

/* 头部区域按钮的统一颜色 */
.header-icon-button {
  color: var(--text-secondary);
}

.header-icon-button:hover {
  color: #4a86e8;
  background-color: rgba(74, 134, 232, 0.1);
}

/* 新增：语音识别弹窗样式 */
.speech-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.speech-modal-content {
  background-color: var(--bg-primary);
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
}

.speech-modal-title {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.speech-status {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  min-height: 1.2em;
}

.speech-transcript {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 20px;
  box-sizing: border-box;
  resize: vertical;
  overflow-y: auto;
}
.speech-transcript:focus {
  outline: none;
  border-color: #4a86e8;
}

.speech-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.speech-modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.speech-btn-cancel {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.speech-btn-cancel:hover {
  background-color: var(--hover-bg);
}

.speech-btn-done {
  background-color: #4a86e8;
  color: white;
}
.speech-btn-done:hover {
  background-color: #3c78d8;
}
</style>
