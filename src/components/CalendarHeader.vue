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
          v-model="searchInputValue"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          @keydown="handleKeydown"
        />
        <i
          class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
        ></i>
        <!-- 搜索结果列表 -->
        <div
          v-if="showSearchResults"
          class="search-results absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
        >
          <ul ref="resultListRef">
            <li
              v-for="(event, index) in searchResults"
              :key="event.id"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              :class="{ 'search-result-focused': index === focusedResultIndex }"
              @mousedown="selectSearchResult(event)"
            >
              <span v-html="getHighlightedHTML(event.title, searchQuery)"></span>
              <span class="text-xs text-gray-500 ml-2">{{
                formatEventDate(event.start)
              }}</span>
            </li>
            <li
              v-if="searchQuery.trim() && searchResults.length === 0"
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
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue"; // 引入 watch
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";
import { useEventStore } from "../stores/event"; // 引入事件仓库
import { pinyin } from "pinyin-pro"; // 引入 pinyin-pro

// 引入各个仓库
const uiStore = useUiStore();
const settingStore = useSettingStore();
const eventStore = useEventStore(); // 使用事件仓库

// 引入preload中定义的electronAPI
// 该API用于与Electron主进程进行通信
const electronAPI = (window as any).electronAPI;

const searchInputValue = ref(""); // 用于 v-model 绑定输入框的实时值
const searchQuery = ref("");      // 防抖后的搜索查询词
const isSearchFocused = ref(false);
const focusedResultIndex = ref(-1); 
const resultListRef = ref<HTMLUListElement | null>(null); 
let debounceTimer: number | undefined = undefined;

// 监听输入框的实时值，进行防抖处理
watch(searchInputValue, (newValue) => {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    searchQuery.value = newValue;
    focusedResultIndex.value = -1; // 新的搜索开始，重置高亮
  }, 200); // 200毫秒防抖延迟
});

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return [];
  }
  const queryLowercase = searchQuery.value.toLowerCase();
  const queryTrimmed = searchQuery.value.trim();

  return eventStore.events.filter((event) => {
    const eventStartDate = new Date(event.start);
    const eventDay = eventStartDate.getDate();
    const eventMonth = eventStartDate.getMonth() + 1; // JS months are 0-indexed
    const eventYear = eventStartDate.getFullYear();

    // 1. Formatted Date Matching (YYYY-MM-DD or MM-DD)
    if (queryTrimmed.includes("-")) {
      const parts = queryTrimmed.split("-").map(part => parseInt(part, 10));
      if (parts.length === 2 && !parts.some(isNaN)) { // MM-DD format
        const [queryMonth, queryDay] = parts;
        const currentYear = new Date().getFullYear(); // Default to current year
        if (
          eventMonth === queryMonth &&
          eventDay === queryDay &&
          eventYear === currentYear
        ) {
          return true;
        }
      } else if (parts.length === 3 && !parts.some(isNaN)) { // YYYY-MM-DD format
        const [queryYear, queryMonth, queryDay] = parts;
        if (
          eventYear === queryYear &&
          eventMonth === queryMonth &&
          eventDay === queryDay
        ) {
          return true;
        }
      }
    }
    // 2. Pure Numeric Matching (exact day, month, or year)
    else if (/^\d+$/.test(queryTrimmed)) {
      const numericQuery = parseInt(queryTrimmed, 10);
      if (
        eventDay === numericQuery ||
        eventMonth === numericQuery ||
        eventYear === numericQuery
      ) {
        return true;
      }
    }

    // 3. Original Text Matching (title, description) - Fallback
    const title = event.title.toLowerCase();
    const description = event.description ? event.description.toLowerCase() : "";
    if (title.includes(queryLowercase) || description.includes(queryLowercase)) {
      return true;
    }

    // 4. Pinyin Matching (title, description) - Fallback
    const titlePinyin = pinyin(event.title, { toneType: "none" }).toLowerCase();
    const titlePinyinInitials = pinyin(event.title, {
      pattern: "initial",
      toneType: "none",
    }).toLowerCase();

    if (titlePinyin.includes(queryLowercase) || titlePinyinInitials.includes(queryLowercase)) {
      return true;
    }

    if (event.description) {
      const descriptionPinyin = pinyin(event.description, {
        toneType: "none",
      }).toLowerCase();
      const descriptionPinyinInitials = pinyin(event.description, {
        pattern: "initial",
        toneType: "none",
      }).toLowerCase();
      if (
        descriptionPinyin.includes(queryLowercase) ||
        descriptionPinyinInitials.includes(queryLowercase)
      ) {
        return true;
      }
    }
    return false;
  });
});

const showSearchResults = computed(() => {
  // 当输入框有焦点并且有输入文本时显示结果区域
  return isSearchFocused.value && searchInputValue.value.trim() !== "";
});

const getHighlightedHTML = (text: string, query: string): string => {
  if (!query.trim() || !text) {
    return text;
  }
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // 优先高亮直接文本匹配
  let startIndex = lowerText.indexOf(lowerQuery);
  if (startIndex !== -1) {
    const before = text.substring(0, startIndex);
    const matched = text.substring(startIndex, startIndex + query.length);
    const after = text.substring(startIndex + query.length);
    return `${before}<mark class="search-highlight">${matched}</mark>${after}`;
  }
  
  // 对于拼音匹配，高亮原始文本比较复杂，这里暂时只返回原始文本
  // 如果需要高亮拼音匹配的对应汉字，需要更复杂的逻辑
  // 例如，如果查询是 "nihao"，文本是 "你好世界"，
  // titlePinyin.includes(query) 会为 true，但简单高亮 "你好" 需要额外处理。
  // 目前，如果通过拼音匹配到，则不进行高亮，仅显示原始标题。
  return text; 
};


const scrollToFocusedResult = () => {
  nextTick(() => {
    if (
      resultListRef.value &&
      focusedResultIndex.value > -1 &&
      searchResults.value.length > 0
    ) {
      const focusedItem = resultListRef.value.children[
        focusedResultIndex.value
      ] as HTMLLIElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  });
};

const handleKeydown = (event: KeyboardEvent) => {
  // 当结果列表未显示或没有结果时，Escape键清空输入和隐藏
  if (!showSearchResults.value || searchResults.value.length === 0) {
    if (event.key === "Escape") {
      clearTimeout(debounceTimer);
      searchInputValue.value = "";
      searchQuery.value = ""; // 确保清除搜索结果
      isSearchFocused.value = false;
      focusedResultIndex.value = -1;
    }
    return;
  }

  const totalResults = searchResults.value.length;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      focusedResultIndex.value = (focusedResultIndex.value + 1) % totalResults;
      scrollToFocusedResult();
      break;
    case "ArrowUp":
      event.preventDefault();
      focusedResultIndex.value =
        (focusedResultIndex.value - 1 + totalResults) % totalResults;
      scrollToFocusedResult();
      break;
    case "Tab":
      event.preventDefault(); // 阻止 Tab 键默认行为（移出搜索框）
      if (event.shiftKey) {
        // Shift + Tab: 向上导航
        focusedResultIndex.value =
          (focusedResultIndex.value - 1 + totalResults) % totalResults;
      } else {
        // Tab: 向下导航
        focusedResultIndex.value =
          (focusedResultIndex.value + 1) % totalResults;
      }
      scrollToFocusedResult();
      break;
    case "Enter":
      if (
        focusedResultIndex.value > -1 &&
        focusedResultIndex.value < totalResults
      ) {
        event.preventDefault();
        selectSearchResult(searchResults.value[focusedResultIndex.value]);
      }
      break;
    case "Escape":
      event.preventDefault();
      clearTimeout(debounceTimer);
      searchInputValue.value = ""; // 清空输入框
      searchQuery.value = "";      // 清空防抖后的查询词，从而清空结果
      isSearchFocused.value = false; 
      focusedResultIndex.value = -1;
      break;
  }
};

const handleSearchFocus = () => {
  isSearchFocused.value = true;
};

const handleSearchBlur = () => {
  setTimeout(() => {
    // 检查 isSearchFocused，因为 selectSearchResult 可能会将其设置为 false
    if (isSearchFocused.value) { 
        // 如果用户点击了结果项之外的地方导致失焦，才隐藏
        // isSearchFocused.value = false; // 这行会导致无法点击结果，因为mousedown时blur先触发
    }
     // 如果 mousedown 在 li 上触发，selectSearchResult 会将 isSearchFocused 设置为 false
    // 如果焦点移到其他地方，isSearchFocused 最终会变为 false
    // 这里的逻辑是为了处理点击外部区域失焦的情况
    // 但由于 selectSearchResult 中已经处理了 isSearchFocused.value = false
    // 这里的 setTimeout 主要是为了让 mousedown 事件有机会先执行
    // 实际的隐藏由 showSearchResults 计算属性控制
    // focusedResultIndex.value = -1; // 在失焦时重置高亮可能不是最佳体验，除非明确选择或清空
  }, 200);
};

const selectSearchResult = (eventData: any) => { // Renamed event to eventData to avoid conflict
  eventStore.openEventDetails(eventData);
  clearTimeout(debounceTimer);
  searchInputValue.value = ""; 
  searchQuery.value = ""; 
  isSearchFocused.value = false; 
  focusedResultIndex.value = -1; 
};

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
