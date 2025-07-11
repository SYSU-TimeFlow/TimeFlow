import { computed, ref, nextTick } from "vue";
import { getStartOfWeek, getEndOfWeek } from "../../utils";
import { EventType, calendarViews } from "../../const";
import { pinyin } from "pinyin-pro";
import { useEventStore } from "../event";

export const createHeaderModule = (storeContext: any) => {
  const {
    currentView,
    currentDate,
    selectedDate,
    openEditTodoModal,
    openEventDetails,
  } = storeContext;

  const eventStore = useEventStore();

  // 主日历标题
  const calendarTitle = computed(() => {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}/${month}/${day}`;
    };

    if (currentView.value === "week") {
      return `${formatDate(getStartOfWeek(currentDate.value))} - ${formatDate(
        getEndOfWeek(currentDate.value)
      )}`;
    } else if (currentView.value === "day") {
      return formatDate(currentDate.value);
    } else if (currentView.value === "todo") {
      return "";
    }
    // 月视图显示年月
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth() + 1;
    return `${year}/${month}`;
  });

  // 日视图标题
  const dayViewTitle = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth() + 1;
    const day = currentDate.value.getDate();
    return `${year}/${month}/${day}`;
  });

  // 导航功能
  function changeView(view: string) {
    currentView.value = view;
    if (view === 'week' || view === 'day') {
      currentDate.value = new Date();
    }
  }

  function navigateCalendar(direction: "prev" | "next") {
    if (currentView.value === "month") {
      currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() + (direction === "next" ? 1 : -1),
        1
      );
    } else if (currentView.value === "week") {
      const newDate = new Date(currentDate.value);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      currentDate.value = newDate;
    } else if (currentView.value === "day") {
      const newDate = new Date(currentDate.value);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      currentDate.value = newDate;
    }
  }

  function goToToday() {
    currentDate.value = new Date();
    selectedDate.value = new Date();
  }

  function selectDate(date: Date) {
    selectedDate.value = new Date(date);
    currentDate.value = new Date(date);
  }

  const searchInputValue = ref(""); // 搜索输入框的实时值
  const searchQuery = ref(""); // 防抖后的实际搜索查询词
  const isSearchFocused = ref(false); // 搜索框是否获得焦点
  const focusedResultIndex = ref(-1); // 当前高亮的搜索结果索引
  const debounceTimer = ref<number | undefined>(undefined); // 防抖计时器ID
  const scrollUiUpdateCallback = ref<(() => void) | null>(null); // 滚动更新UI的回调

  // Action: 注册滚动UI更新的回调函数
  function setScrollUiUpdateCallback(callback: () => void) {
    scrollUiUpdateCallback.value = callback;
  }

  // Action: 清除滚动UI更新的回调函数
  function clearScrollUiUpdateCallback() {
    scrollUiUpdateCallback.value = null;
  }

  // Action: 更新搜索输入值并启动防抖
  function updateSearchInputValue(value: string) {
    searchInputValue.value = value;
    clearTimeout(debounceTimer.value);
    debounceTimer.value = window.setTimeout(() => {
      searchQuery.value = value;
      focusedResultIndex.value = -1; // 新搜索开始，重置高亮
    }, 200); // 防抖延迟
  }

  // Computed: 根据 searchQuery 过滤事件
  const searchResults = computed(() => {
    if (!searchQuery.value.trim()) {
      return [];
    }
    const queryLowercase = searchQuery.value.toLowerCase();
    const queryTrimmed = searchQuery.value.trim();

    return eventStore.events.filter((event) => {
      const eventStartDate = new Date(event.start);
      const eventDay = eventStartDate.getDate();
      const eventMonth = eventStartDate.getMonth() + 1;
      const eventYear = eventStartDate.getFullYear();

      // 1. Formatted Date Matching
      if (queryTrimmed.includes("-")) {
        const parts = queryTrimmed.split("-").map((part) => parseInt(part, 10));
        if (parts.length === 2 && !parts.some(isNaN)) {
          const [queryMonth, queryDay] = parts;
          const currentYear = new Date().getFullYear();
          if (
            eventMonth === queryMonth &&
            eventDay === queryDay &&
            eventYear === currentYear
          )
            return true;
        } else if (parts.length === 3 && !parts.some(isNaN)) {
          const [queryYear, queryMonth, queryDay] = parts;
          if (
            eventYear === queryYear &&
            eventMonth === queryMonth &&
            eventDay === queryDay
          )
            return true;
        }
      }
      // 2. Pure Numeric Matching
      else if (/^\d+$/.test(queryTrimmed)) {
        const numericQuery = parseInt(queryTrimmed, 10);
        if (
          eventDay === numericQuery ||
          eventMonth === numericQuery ||
          eventYear === numericQuery
        )
          return true;
      }

      // 3. Original Text Matching
      const title = event.title.toLowerCase();
      const description = event.description
        ? event.description.toLowerCase()
        : "";
      if (
        title.includes(queryLowercase) ||
        description.includes(queryLowercase)
      )
        return true;

      // 4. Pinyin Matching
      const titlePinyin = pinyin(event.title, {
        toneType: "none",
      }).toLowerCase();
      const titlePinyinInitials = pinyin(event.title, {
        pattern: "initial",
        toneType: "none",
      }).toLowerCase();
      if (
        titlePinyin.includes(queryLowercase) ||
        titlePinyinInitials.includes(queryLowercase)
      )
        return true;

      if (event.description) {
        const descPinyin = pinyin(event.description, {
          toneType: "none",
        }).toLowerCase();
        const descPinyinInitials = pinyin(event.description, {
          pattern: "initial",
          toneType: "none",
        }).toLowerCase();
        if (
          descPinyin.includes(queryLowercase) ||
          descPinyinInitials.includes(queryLowercase)
        )
          return true;
      }
      return false;
    });
  });

  // Computed: 控制搜索结果下拉框的显示
  const showSearchDropdown = computed(() => {
    return isSearchFocused.value && searchInputValue.value.trim() !== "";
  });

  // Function: 获取高亮显示的HTML (用于搜索结果)
  function getHighlightedHTMLContent(
    text: string,
    queryToHighlight: string
  ): string {
    if (!queryToHighlight.trim() || !text) {
      return text;
    }
    const lowerText = text.toLowerCase();
    const lowerQuery = queryToHighlight.toLowerCase();
    let startIndex = lowerText.indexOf(lowerQuery);
    if (startIndex !== -1) {
      const before = text.substring(0, startIndex);
      const matched = text.substring(
        startIndex,
        startIndex + queryToHighlight.length
      );
      const after = text.substring(startIndex + queryToHighlight.length);
      return `${before}<mark class="search-highlight">${matched}</mark>${after}`;
    }
    return text;
  }

  // Action: 清空搜索状态
  function clearSearchAction() {
    clearTimeout(debounceTimer.value);
    searchInputValue.value = "";
    searchQuery.value = "";
    isSearchFocused.value = false;
    focusedResultIndex.value = -1;
  }

  // Action: 处理搜索框获得焦点
  function handleSearchFocusAction() {
    isSearchFocused.value = true;
  }

  // Action: 处理搜索框失去焦点
  function handleSearchBlurAction() {
    setTimeout(() => {
      if (isSearchFocused.value) {
        // 确保不是因为点击结果项导致的失焦
        clearSearchAction();
      }
    }, 200); // 延迟以允许结果项的 mousedown 事件优先触发
  }

  // Action: 处理键盘事件
  function handleKeydownAction(event: KeyboardEvent) {
    if (!showSearchDropdown.value || searchResults.value.length === 0) {
      if (event.key === "Escape") {
        clearSearchAction();
      }
      return;
    }

    const totalResults = searchResults.value.length;
    let newIndex = focusedResultIndex.value;

    switch (event.key) {
      case "ArrowDown":
      case "Tab": // Tab 也视为向下
        event.preventDefault();
        if (event.key === "Tab" && event.shiftKey) {
          // Shift + Tab 向上
          newIndex =
            (focusedResultIndex.value - 1 + totalResults) % totalResults;
        } else {
          newIndex = (focusedResultIndex.value + 1) % totalResults;
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        newIndex = (focusedResultIndex.value - 1 + totalResults) % totalResults;
        break;
      case "Enter":
        if (
          focusedResultIndex.value > -1 &&
          focusedResultIndex.value < totalResults
        ) {
          event.preventDefault();
          selectSearchResultAction(
            searchResults.value[focusedResultIndex.value]
          );
        }
        return; // Enter后不应再触发滚动回调
      case "Escape":
        event.preventDefault();
        clearSearchAction();
        return; // Escape后不应再触发滚动回调
      default:
        return; // 其他按键不处理
    }

    if (newIndex !== focusedResultIndex.value) {
      focusedResultIndex.value = newIndex;
      if (scrollUiUpdateCallback.value) {
        nextTick(() => {
          scrollUiUpdateCallback.value!();
        });
      }
    }
  }

  // Action: 选择一个搜索结果
  function selectSearchResultAction(eventData: any) {
    // 如果是待办事项（TODO 或 BOTH），直接进入待办编辑页面
    if (
      eventData.eventType === EventType.TODO ||
      eventData.eventType === EventType.BOTH
    ) {
      openEditTodoModal(eventData);
    } else {
      // 否则打开事件详情
      openEventDetails(eventData);
    }
    // @ts-ignore
    clearSearchAction();
  }

  return {
    calendarViews,
    calendarTitle,
    dayViewTitle,
    searchInputValue,
    showSearchDropdown,
    focusedResultIndex,
    searchResults,
    searchQuery,
    setScrollUiUpdateCallback,
    clearScrollUiUpdateCallback,
    updateSearchInputValue,
    getHighlightedHTMLContent,
    clearSearchAction,
    handleSearchFocusAction,
    handleSearchBlurAction,
    handleKeydownAction,
    selectSearchResultAction,
    changeView,
    navigateCalendar,
    goToToday,
    selectDate,
  };
};
