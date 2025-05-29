import { defineStore } from "pinia";
import { ref, computed, nextTick, watch } from "vue";
import { pinyin } from "pinyin-pro";
import {
  formatEventTime as formatEventTimeUtil,
  formatTime as formatTimeUtil,
  formatDateTimeForInput as formatDateTimeForInputUtil,
} from "../utils";

declare global {
  interface Window {
    electronAPI?: {
      saveSettings: (settings: any) => Promise<void>;
      loadSettings: () => Promise<any>;
      notify: (title: string, body: string) => void;
      minimize?: () => void;
      maximize?: () => void;
      close?: () => void;
    };
  }
}

// 事件类型枚举
export enum EventType {
  CALENDAR = "calendar",
  TODO = "todo",
  BOTH = "both", // 同时作为日历事件和待办事项
}

// 统一的事件类
export class Event {
  constructor(
    public id: number,
    public title: string,
    public start: Date,
    public end: Date,
    public description: string = "",
    public categoryId: number = 5,
    public categoryColor: string = "#43aa8b",
    public allDay: boolean = false,
    public eventType: EventType = EventType.CALENDAR,
    public completed: boolean = false
  ) {}
}

// 过滤器类型增加 today
export type FilterType = "all" | "completed" | "active" | "today";

interface TodoFilter {
  value: FilterType;
  label: string;
  count: number;
}

// 新增：分类接口定义
interface Category {
  id: number;
  name: string;
  color: string;
  active: boolean;
}

export const useEventStore = defineStore("event", () => {
  // 预设颜色选项保持不变
  const colorOptions = [
    "#e63946", // 红色
    "#f8961e", // 橙色
    "#fcbf49", // 黄色
    "#2a9d8f", // 青绿色
    "#43aa8b", // 绿色
    "#4cc9f0", // 青色
    "#3a86ff", // 蓝色
    "#7209b7", // 紫色
    "#f72585", // 粉色
    "#495057", // 深灰色
  ];

  // =======================BEGIN 事件管理本地存储相关代码 BEGIN========================

  // 修改：categories 初始化为空数组，将通过API加载
  const categories = ref<Category[]>([]);
  // 修改：events 初始化为空数组，将通过API加载
  const events = ref<Event[]>([]);

  // 通用的 watch 函数，监听 events 和 categories 的变化
  watch(
    [events, categories], // 监听多个源
    async () => {
      await saveAppDataToStore();
    },
    { deep: true } // 深度监听，确保嵌套属性的变化也会触发
  );

  // 保存应用数据到 electron-store
  async function saveAppDataToStore() {
    try {
      // 准备需要保存的数据对象
      const dataToSave = {
        // 使用 JSON.parse(JSON.stringify(...)) 对 categories.value 进行深拷贝，
        // 移除 Vue 的响应式代理，确保保存的是纯净的 JavaScript 对象数组。
        categories: JSON.parse(JSON.stringify(categories.value)),
        // 同样对 events.value 进行深拷贝。
        events: JSON.parse(JSON.stringify(events.value)),
      };
      // 调用通过 preload 脚本暴露的 electronAPI 来保存数据。
      // @ts-ignore 因为 TypeScript 编译器可能不知道 window.electronAPI 的存在，所以使用 ts-ignore。
      await window.electronAPI.saveAppData(dataToSave);
    } catch (error) {
      // 如果保存过程中发生错误，则在控制台打印错误信息。
      // 修正了 catch 块的语法
      console.error("通过 Electron API 保存应用数据时出错:", error);
    }
  }

  // 从 electron-store 加载应用数据 (通过 main process)
  async function loadAppDataFromStore() {
    try {
      // @ts-ignore
      const appData = await window.electronAPI.loadAppData();
      if (appData) {
        if (Array.isArray(appData.categories)) {
          categories.value = appData.categories.map((category) => ({
            id: category.id,
            name: category.name,
            color: category.color,
            active: category.active,
          }));
        } else {
          console.warn(
            "Invalid or missing categories data. Initializing as empty."
          );
          categories.value = [];
        }

        if (Array.isArray(appData.events)) {
          events.value = appData.events.map(
            (eventData) =>
              new Event(
                eventData.id,
                eventData.title,
                new Date(eventData.start),
                new Date(eventData.end),
                eventData.description,
                eventData.categoryId,
                eventData.categoryColor,
                eventData.allDay,
                eventData.eventType,
                eventData.completed
              )
          );
        } else {
          console.warn(
            "Invalid or missing events data. Initializing as empty."
          );
          events.value = [];
        }
      } else {
        console.warn(
          "No appData returned from loadAppData. Initializing as empty."
        );
        categories.value = [];
        events.value = [];
      }
    } catch (error) {
      console.error("Error loading app data via Electron API:", error);
      categories.value = [];
      events.value = [];
    }
  }

  // =======================END 事件管理本地存储相关代码 END========================

  // 其余状态管理保持基本不变
  const showCategoryModal = ref(false);
  const isNewCategory = ref(true);
  // 修改：为 currentCategory 添加类型注解
  const currentCategory = ref<Category>({
    id: 0,
    name: "",
    color: colorOptions[0], // 默认颜色
    active: true,
  });

  // 事件模态框状态管理
  const showEventModal = ref(false);
  const isNewEvent = ref(true);
  const currentEvent = ref({
    id: 0,
    title: "",
    start: "",
    end: "",
    description: "",
    categoryId: 1,
    categoryColor: "#4f46e5",
    allDay: false,
    eventType: EventType.CALENDAR,
    completed: false,
  });

  // Todo模态框状态，统一到事件模态框
  const showTodoModal = ref(false);
  const isNewTodo = ref(true);
  const activeFilter = ref<FilterType>("all");

  // ======================BEGIN 搜索功能相关状态和逻辑 BEGIN========================
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

    return events.value.filter((event) => {
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
    openEventDetails(eventData); // openEventDetails 是 store 中已有的 action
    // @ts-ignore
    clearSearchAction();
  }

  // ======================END 搜索功能相关状态和逻辑 END========================
  // 获取指定日期的所有日历事件
  function getEventsForDay(date: Date): Event[] {
    const activeCategoryIds = categories.value
      .filter((category) => category.active)
      .map((category) => category.id);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // 处理常规日历事件和BOTH类型的待办事项
    return events.value
      .filter((event) => {
        // 排除纯TODO类型的待办事项
        if (event.eventType === EventType.TODO) return false;

        let eventStart: Date;
        let eventEnd: Date;

        // 对于BOTH类型的待办，使用截止日期作为事件日期
        if (
          event.eventType === EventType.BOTH &&
          new Date(event.start).getFullYear() <= 1970
        ) {
          eventStart = new Date(event.end);
          eventEnd = new Date(event.end);
        } else {
          eventStart = new Date(event.start);
          eventEnd = new Date(event.end);
        }

        // 检查事件日期是否符合条件
        const dateMatches =
          (eventStart >= start && eventStart <= end) || // 条件1
          (eventEnd >= start && eventEnd <= end) || // 条件2
          (eventStart <= start && eventEnd >= end); // 条件3

        // 再检查事件分类是否被选中
        const categoryMatches = activeCategoryIds.includes(event.categoryId);

        // 同时满足日期和分类两个条件
        return dateMatches && categoryMatches;
      })
      .sort((a, b) => {
        // 为BOTH类型的待办使用end日期排序，为常规事件使用start日期排序
        const aTime =
          a.eventType === EventType.BOTH &&
          new Date(a.start).getFullYear() <= 1970
            ? new Date(a.end).getTime()
            : new Date(a.start).getTime();
        const bTime =
          b.eventType === EventType.BOTH &&
          new Date(b.start).getFullYear() <= 1970
            ? new Date(b.end).getTime()
            : new Date(b.start).getTime();

        if (aTime === bTime) {
          return new Date(a.end).getTime() - new Date(b.end).getTime();
        }
        return aTime - bTime;
      });
  }

  // 保存事件 (新建或更新)
  async function saveEvent() {
    // 确保颜色与分类一致
    const category = categories.value.find(
      (c) => c.id === currentEvent.value.categoryId
    );
    if (category) {
      currentEvent.value.categoryColor = category.color;
    }

    const eventToSave = {
      ...currentEvent.value,
      start: new Date(currentEvent.value.start),
      end: new Date(currentEvent.value.end),
    };

    if (isNewEvent.value) {
      events.value.push(eventToSave as Event);
    } else {
      const index = events.value.findIndex((e) => e.id === eventToSave.id);
      if (index !== -1) {
        events.value[index] = eventToSave as Event;
      }
    }
    closeEventModal();
  }

  async function deleteEvent(id?: number) {
    // 如果 id 不是 number 类型，使用 currentEvent.value.id
    const eventId = typeof id === "number" ? id : currentEvent.value.id;
    const index = events.value.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      events.value.splice(index, 1);
    }

    closeEventModal();
  }

  // 切换待办事项完成状态
  async function toggleTodo(id: number) {
    const event = events.value.find(
      (e) =>
        e.id === id &&
        (e.eventType === EventType.TODO || e.eventType === EventType.BOTH)
    );
    if (event) {
      event.completed = !event.completed;
    }
  }

  // 获取待办事项列表
  const allTodos = computed(() => {
    return events.value.filter(
      (e) => e.eventType === EventType.TODO || e.eventType === EventType.BOTH
    );
  });

  const completedTodos = computed(() =>
    allTodos.value.filter((todo) => todo.completed)
  );

  const activeTodos = computed(() =>
    allTodos.value.filter((todo) => !todo.completed)
  );
  const todayTodos = computed(() => {
    const now = new Date();
    return allTodos.value.filter((todo) => {
      if (!todo.end) return false;
      const end = new Date(todo.end);
      if (end.getFullYear() <= 1970) return false;
      return (
        end.getFullYear() === now.getFullYear() &&
        end.getMonth() === now.getMonth() &&
        end.getDate() === now.getDate()
      );
    });
  });

  const filteredTodos = computed(() => {
    let list: Event[];
    switch (activeFilter.value) {
      case "today":
        list = todayTodos.value;
        break;
      case "completed":
        list = completedTodos.value;
        break;
      case "active":
        list = activeTodos.value;
        break;
      default:
        list = allTodos.value;
    }

    // 所有待办项都应该显示，无论是否有截止日期
    // 优先显示未完成事项，并在各自组内按截止日期升序排序
    return [...list].sort((a, b) => {
      // 首先按照完成状态排序
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // 未完成在前
      }

      // 判断是否有截止日期（不是1970年占位符）
      const aHasDeadline = new Date(a.end).getFullYear() > 1970;
      const bHasDeadline = new Date(b.end).getFullYear() > 1970;

      // 如果一个有截止日期而另一个没有
      if (aHasDeadline !== bHasDeadline) {
        return aHasDeadline ? -1 : 1; // 有截止日期的优先显示
      }

      // 如果都有截止日期，按日期升序排列
      if (aHasDeadline && bHasDeadline) {
        return a.end.getTime() - b.end.getTime(); // 截止日期升序
      }

      // 如果都没有截止日期，按创建时间（ID）排序
      return a.id - b.id;
    });
  });
  // 打开新建待办事项模态框
  const openNewTodoModal = () => {
    isNewTodo.value = true;
    // 使用1970年1月1日作为起始时间的占位符
    const placeholderDate = new Date(0); // 1970-01-01T00:00:00.000Z
    const today = new Date();
    today.setHours(23, 59, 59, 0);
    const defaultCat = categories.value.find((c) => c.id === 5) ||
      categories.value[0] || {
        id: 5,
        color: "#43aa8b",
        name: "其他",
        active: true,
      };
    currentEvent.value = {
      id: Date.now(),
      title: "",
      start: formatDateTimeForInput(placeholderDate), // 使用1970年占位符作为开始时间
      end: formatDateTimeForInput(today), // 默认有截止时间
      description: "",
      categoryId: defaultCat.id,
      categoryColor: defaultCat.color,
      allDay: false, // 待办事项设置为非全天事件
      eventType: EventType.BOTH, // 默认为BOTH类型，因为默认有截止时间
      completed: false,
    };

    showTodoModal.value = true;
  };

  // 打开编辑待办事项模态框
  const openEditTodoModal = (todo: Event) => {
    isNewTodo.value = false;
    // 使用1970年1月1日作为起始时间的占位符
    const placeholderDate = new Date(0); // 1970-01-01T00:00:00.000Z
    currentEvent.value = {
      ...todo,
      start: formatDateTimeForInput(placeholderDate), // 待办事项开始时间始终为1970年占位符
      end: todo.end ? formatDateTimeForInput(todo.end) : "", // 格式化截止时间（如果有）
    };
    showTodoModal.value = true;
  };
  // 保存待办事项
  const saveTodo = async (hasDeadlineParam?: boolean) => {
    // 确保颜色与分类一致
    const category = categories.value.find(
      (c) => c.id === currentEvent.value.categoryId
    );
    if (category) {
      currentEvent.value.categoryColor = category.color;
    }

    // 创建一个虚拟日期作为没有截止时间的占位符
    // 使用1970年1月1日作为一个明显的占位符日期
    const placeholderDate = new Date(0); // 1970-01-01T00:00:00.000Z

    // 确定是否有截止时间
    // 如果传入了hasDeadlineParam参数，优先使用它
    // 否则根据end值判断是否有截止时间
    const hasDeadline =
      hasDeadlineParam !== undefined
        ? hasDeadlineParam
        : !!(currentEvent.value.end && currentEvent.value.end.trim() !== "");

    // 处理没有截止时间的情况
    if (!hasDeadline) {
      // 无截止时间时，清空end值或设为占位符
      currentEvent.value.end = formatDateTimeForInput(placeholderDate);
    } else if (
      !currentEvent.value.end ||
      currentEvent.value.end.trim() === ""
    ) {
      // 有截止时间但end为空，设置默认值为今天结束
      const today = new Date();
      today.setHours(23, 59, 59, 0);
      currentEvent.value.end = formatDateTimeForInput(today);
    }

    const todoToSave = {
      ...currentEvent.value,
      start: placeholderDate, // 待办事项开始时间统一设为1970年占位符
      end: hasDeadline ? new Date(currentEvent.value.end) : placeholderDate,
      // 根据是否有截止时间确认事件类型
      eventType: hasDeadline ? EventType.BOTH : EventType.TODO,
      // 设置为非全天事件
      allDay: false,
    };

    if (isNewTodo.value) {
      events.value.push(todoToSave as Event);
    } else {
      const index = events.value.findIndex((e) => e.id === todoToSave.id);
      if (index !== -1) {
        events.value[index] = todoToSave as Event;
      }
    }

    closeTodoModal();
  };

  // 关闭待办事项模态框
  const closeTodoModal = () => {
    showTodoModal.value = false;
  };

  // 设置时间为一天的末尾 (23:59:59)
  function setTimeToEndOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 0);
    return newDate;
  }

  // 将日期格式化为 YYYY/MM/DD hh:mm 格式，精确到分钟
  function formatDateForDisplay(date: Date): string {
    const dateStr = date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const timeStr = date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return dateStr + " " + timeStr;
  }

  // 空状态消息（根据当前过滤器显示不同消息）
  const emptyStateMessage = computed(() => {
    switch (activeFilter.value) {
      case "completed":
        return "没有已完成的待办事项";
      case "active":
        return "没有进行中的待办事项";
      default:
        return "没有待办事项";
    }
  });

  // 设置待办事项过滤器
  function setFilter(filter: FilterType) {
    activeFilter.value = filter;
  }

  // 日期时间格式化相关函数
  function formatEventTime(event: Event): string {
    return formatEventTimeUtil(event, false); // 默认使用12小时制
  }

  function formatTime(date: Date): string {
    return formatTimeUtil(date, false); // 默认使用12小时制
  }

  function formatDateTimeForInput(date: Date): string {
    return formatDateTimeForInputUtil(date);
  }

  // 事件模态框相关函数
  function openNewEventModal(date?: Date) {
    isNewEvent.value = true;
    const startDate = date || new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const defaultCat = categories.value.find((c) => c.id === 5) ||
      categories.value[0] || {
        id: 5,
        color: "#43aa8b",
        name: "其他",
        active: true,
      };

    currentEvent.value = {
      id: Date.now(),
      title: "",
      start: formatDateTimeForInput(startDate),
      end: formatDateTimeForInput(endDate),
      description: "",
      categoryId: defaultCat.id,
      categoryColor: defaultCat.color,
      allDay: false,
      eventType: EventType.CALENDAR,
      completed: false,
    };

    showEventModal.value = true;
  }

  function openEventDetails(event: Event) {
    isNewEvent.value = false;
    currentEvent.value = {
      ...event,
      start: formatDateTimeForInput(event.start),
      end: formatDateTimeForInput(event.end),
    };

    if (event.eventType === EventType.TODO) {
      showTodoModal.value = true;
    } else {
      showEventModal.value = true;
    }
  }

  function closeEventModal() {
    showEventModal.value = false;
  }

  function toggleEventModal() {
    showEventModal.value = !showEventModal.value;
  }

  // 分类相关函数
  async function toggleCategory(id: number) {
    const category = categories.value.find((c) => c.id === id);
    if (category) {
      category.active = !category.active;
    }
  }

  function isColorUsed(color: string): boolean {
    return categories.value.some((c) => c.color === color);
  }

  function selectColor(color: string) {
    currentCategory.value.color = color;
  }

  function isCategoryFormValid(): boolean {
    return currentCategory.value.name.trim().length > 0;
  }

  async function updateEventCategoryColor(
    categoryId: number,
    newColor: string
  ) {
    events.value.forEach((event) => {
      if (event.categoryId === categoryId && event.categoryColor !== newColor) {
        event.categoryColor = newColor;
      }
    });
  }

  function openNewCategoryModal() {
    isNewCategory.value = true;
    currentCategory.value = {
      id: Date.now(),
      name: "",
      color: colorOptions.find((c) => !isColorUsed(c)) || colorOptions[0], // 尝试选择一个未使用的颜色
      active: true,
    };
    showCategoryModal.value = true;
  }

  function openCategoryDetails(category: Category) {
    // 修改：参数类型为 Category
    isNewCategory.value = false;
    currentCategory.value = { ...category };
    showCategoryModal.value = true;
  }

  function closeCategoryModal() {
    showCategoryModal.value = false;
  }

  async function saveCategory() {
    if (!isCategoryFormValid()) return;

    const categoryToSave = { ...currentCategory.value };

    if (isNewCategory.value) {
      categories.value.push(categoryToSave);
    } else {
      const index = categories.value.findIndex(
        (c) => c.id === categoryToSave.id
      );
      if (index !== -1) {
        const oldColor = categories.value[index].color;
        categories.value[index] = categoryToSave;

        if (oldColor !== categoryToSave.color) {
          // updateEventCategoryColor 内部会调用 saveAppDataToStore
          await updateEventCategoryColor(
            categoryToSave.id,
            categoryToSave.color
          );
        }
      }
    }
    closeCategoryModal();
  }

  async function deleteCategory() {
    if (!isNewCategory.value) {
      if (categories.value.length <= 1) {
        console.warn("Cannot delete the last category."); // 可以添加用户提示
        return;
      }

      const index = categories.value.findIndex(
        (c) => c.id === currentCategory.value.id
      );
      if (index !== -1) {
        const categoryToDeleteId = currentCategory.value.id;
        // 查找一个默认分类来重新分配事件，优先选择“其他”，否则选择第一个不是正在删除的分类
        const defaultCategory =
          categories.value.find(
            (c) => c.id === 5 && c.id !== categoryToDeleteId
          ) || categories.value.find((c) => c.id !== categoryToDeleteId);

        if (!defaultCategory) {
          console.error(
            "No suitable default category found to reassign events to. This should not happen if there's more than one category."
          );
          closeCategoryModal();
          return;
        }

        events.value.forEach((event) => {
          if (event.categoryId === categoryToDeleteId) {
            event.categoryId = defaultCategory.id;
            event.categoryColor = defaultCategory.color;
          }
        });

        categories.value.splice(index, 1);
      }
    }
    closeCategoryModal();
  }

  // 初始化时加载应用数据
  loadAppDataFromStore();

  // 添加一个通用的 watch 函数来监听 events 和 categories 的变化

  return {
    // 枚举类型
    EventType,

    // 状态
    events,
    categories,
    showEventModal,
    isNewEvent,
    currentEvent,
    showCategoryModal,
    isNewCategory,
    currentCategory,
    showTodoModal,
    isNewTodo,
    activeFilter,

    // 计算属性
    allTodos,
    completedTodos,
    activeTodos,
    todayTodos,
    filteredTodos,
    emptyStateMessage,

    // 事件相关方法
    saveEvent,
    deleteEvent,
    toggleTodo,
    saveTodo,
    setFilter,

    // 待办事项模态框方法
    openNewTodoModal,
    openEditTodoModal,
    closeTodoModal,

    // 事件模态框方法
    openNewEventModal,
    openEventDetails,
    closeEventModal,
    toggleEventModal,

    // 工具函数
    getEventsForDay,
    setTimeToEndOfDay,

    // 格式化相关函数
    formatDateForDisplay,
    formatEventTime,
    formatTime,
    formatDateTimeForInput,

    // 分类相关方法
    toggleCategory,
    colorOptions,
    isColorUsed,
    selectColor,
    isCategoryFormValid,
    updateEventCategoryColor,
    openNewCategoryModal,
    openCategoryDetails,
    closeCategoryModal,
    saveCategory,
    deleteCategory,

    // 搜索相关
    searchInputValue,
    searchQuery,
    isSearchFocused,
    focusedResultIndex,
    searchResults,
    showSearchDropdown,
    updateSearchInputValue,
    handleSearchFocusAction,
    handleSearchBlurAction,
    handleKeydownAction,
    selectSearchResultAction,
    getHighlightedHTMLContent,
    clearSearchAction,
    setScrollUiUpdateCallback,
    clearScrollUiUpdateCallback,

    // 数据存储相关，仅供测试
    loadAppDataFromStore,
    saveAppDataToStore,
  };
});
