import { defineStore } from "pinia";
import { ref, computed, nextTick } from "vue"; // 引入 nextTick
import { useTodoStore } from "../stores/todoStore";
import { pinyin } from "pinyin-pro"; // 确保 pinyin-pro 已安装并在需要的地方导入

export const useEventStore = defineStore("event", () => {
  // 预设颜色选项 - 按照红橙黄绿青蓝紫等顺序排列的10种适合文字阅读的颜色
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

  // 定义事件分类
  const categories = ref([
    { id: 1, name: "工作", color: "#e63946", active: true },
    { id: 2, name: "个人", color: "#f8961e", active: true },
    { id: 3, name: "家庭", color: "#fcbf49", active: true },
    { id: 4, name: "健康", color: "#2a9d8f", active: true },
    { id: 5, name: "其他", color: "#43aa8b", active: true },
  ]);

  // 示例事件数据
  const events = ref([
    {
      id: 1,
      title: "团队会议",
      start: new Date(2025, 4, 18, 10, 0),
      end: new Date(2025, 4, 18, 11, 30),
      description: "每周团队同步",
      categoryId: 1,
      categoryColor: "#e63946",
      allDay: false,
      addToTodo: true,
    },
    {
      id: 2,
      title: "牙医预约",
      start: new Date(2025, 4, 20, 14, 0),
      end: new Date(2025, 4, 20, 15, 0),
      description: "常规检查",
      categoryId: 4,
      categoryColor: "#2a9d8f",
      allDay: false,
      addToTodo: true,
    },
    {
      id: 3,
      title: "生日派对",
      start: new Date(2025, 4, 22, 18, 0),
      end: new Date(2025, 4, 22, 22, 0),
      description: "John的生日庆祝",
      categoryId: 3,
      categoryColor: "#fcbf49",
      allDay: false,
      addToTodo: true,
    },
    {
      id: 4,
      title: "项目截止日期",
      start: new Date(2025, 4, 25, 0, 0),
      end: new Date(2025, 4, 25, 23, 59),
      description: "Q2项目最终提交",
      categoryId: 1,
      categoryColor: "#e63946",
      allDay: true,
      addToTodo: true,
    },
    {
      id: 5,
      title: "健身房锻炼",
      start: new Date(2025, 4, 19, 7, 0),
      end: new Date(2025, 4, 19, 8, 30),
      description: "晨间锻炼",
      categoryId: 4,
      categoryColor: "#2a9d8f",
      allDay: false,
      addToTodo: false,
    },
  ]);

  // 分类模态框状态管理
  const showCategoryModal = ref(false);
  const isNewCategory = ref(true);
  const currentCategory = ref({
    id: 0,
    name: "",
    color: "#4f46e5",
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
    addToTodo: true,
  });

  // --- 搜索功能相关状态和逻辑 ---
  const searchInputValue = ref(""); // 搜索输入框的实时值
  const searchQuery = ref("");      // 防抖后的实际搜索查询词
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
        const parts = queryTrimmed.split("-").map(part => parseInt(part, 10));
        if (parts.length === 2 && !parts.some(isNaN)) {
          const [queryMonth, queryDay] = parts;
          const currentYear = new Date().getFullYear();
          if (eventMonth === queryMonth && eventDay === queryDay && eventYear === currentYear) return true;
        } else if (parts.length === 3 && !parts.some(isNaN)) {
          const [queryYear, queryMonth, queryDay] = parts;
          if (eventYear === queryYear && eventMonth === queryMonth && eventDay === queryDay) return true;
        }
      }
      // 2. Pure Numeric Matching
      else if (/^\d+$/.test(queryTrimmed)) {
        const numericQuery = parseInt(queryTrimmed, 10);
        if (eventDay === numericQuery || eventMonth === numericQuery || eventYear === numericQuery) return true;
      }

      // 3. Original Text Matching
      const title = event.title.toLowerCase();
      const description = event.description ? event.description.toLowerCase() : "";
      if (title.includes(queryLowercase) || description.includes(queryLowercase)) return true;

      // 4. Pinyin Matching
      const titlePinyin = pinyin(event.title, { toneType: "none" }).toLowerCase();
      const titlePinyinInitials = pinyin(event.title, { pattern: "initial", toneType: "none" }).toLowerCase();
      if (titlePinyin.includes(queryLowercase) || titlePinyinInitials.includes(queryLowercase)) return true;

      if (event.description) {
        const descPinyin = pinyin(event.description, { toneType: "none" }).toLowerCase();
        const descPinyinInitials = pinyin(event.description, { pattern: "initial", toneType: "none" }).toLowerCase();
        if (descPinyin.includes(queryLowercase) || descPinyinInitials.includes(queryLowercase)) return true;
      }
      return false;
    });
  });

  // Computed: 控制搜索结果下拉框的显示
  const showSearchDropdown = computed(() => {
    return isSearchFocused.value && searchInputValue.value.trim() !== "";
  });

  // Function: 获取高亮显示的HTML (用于搜索结果)
  function getHighlightedHTMLContent(text: string, queryToHighlight: string): string {
    if (!queryToHighlight.trim() || !text) {
      return text;
    }
    const lowerText = text.toLowerCase();
    const lowerQuery = queryToHighlight.toLowerCase();
    let startIndex = lowerText.indexOf(lowerQuery);
    if (startIndex !== -1) {
      const before = text.substring(0, startIndex);
      const matched = text.substring(startIndex, startIndex + queryToHighlight.length);
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
      if (isSearchFocused.value) { // 确保不是因为点击结果项导致的失焦
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
        if (event.key === "Tab" && event.shiftKey) { // Shift + Tab 向上
             newIndex = (focusedResultIndex.value - 1 + totalResults) % totalResults;
        } else {
            newIndex = (focusedResultIndex.value + 1) % totalResults;
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        newIndex = (focusedResultIndex.value - 1 + totalResults) % totalResults;
        break;
      case "Enter":
        if (focusedResultIndex.value > -1 && focusedResultIndex.value < totalResults) {
          event.preventDefault();
          selectSearchResultAction(searchResults.value[focusedResultIndex.value]);
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
    clearSearchAction();
  }

  // --- 结束搜索功能相关 ---


  // 获取指定日期的所有事件
  function getEventsForDay(date: Date): any[] {
    const activeCategoryIds = categories.value
      .filter((category) => category.active)
      .map((category) => category.id);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return events.value
      .filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        // 先检查事件日期是否符合条件
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
        const aStart = new Date(a.start).getTime();
        const bStart = new Date(b.start).getTime();
        if (aStart === bStart) {
          return new Date(a.end).getTime() - new Date(b.end).getTime();
        }
        return aStart - bStart;
      });
  }

  // 格式化事件的开始和结束时间
  function formatEventTime(event: any): string {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  // 格式化日期对象为时间字符串 (HH:mm AM/PM)
  function formatTime(date: Date): string {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  // 将 Date 对象格式化为 datetime-local input 所需的字符串格式 (YYYY-MM-DDTHH:mm)
  function formatDateTimeForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // 打开新建事件模态框
  function openNewEventModal(start?: Date, end?: Date) {
    isNewEvent.value = true;
    const startDate = start || new Date();
    if (!start) startDate.setHours(9, 0, 0, 0);
    const endDate = end || new Date(startDate);
    if (!end) endDate.setHours(startDate.getHours() + 1, 0, 0, 0);

    currentEvent.value = {
      id: Date.now(),
      title: "",
      start: formatDateTimeForInput(startDate),
      end: formatDateTimeForInput(endDate),
      description: "",
      categoryId: categories.value.length > 0 ? categories.value[0].id : 1,
      categoryColor:
        categories.value.length > 0 ? categories.value[0].color : "#4f46e5",
      allDay: false,
      addToTodo: true,
    };
    showEventModal.value = true;
  }

  // 打开事件详情/编辑模态框
  function openEventDetails(event: any) {
    isNewEvent.value = false;
    currentEvent.value = {
      ...event,
      start: formatDateTimeForInput(new Date(event.start)),
      end: formatDateTimeForInput(new Date(event.end)),
    };
    showEventModal.value = true;
  }

  // 关闭事件模态框
  function closeEventModal() {
    showEventModal.value = false;
  }

  // 当选择分类时，自动更新当前事件的颜色和分类ID
  function updateEventCategoryColor(categoryId: number) {
    const category = categories.value.find((c) => c.id === categoryId);
    if (category) {
      currentEvent.value.categoryId = categoryId;
      currentEvent.value.categoryColor = category.color;
    }
  }

  // 添加一个新事件 (此函数似乎未在UI中直接使用，saveEvent是主要的保存逻辑)
  function addEvent(title: string, start: Date, end: Date) {
    const newEvent = {
      id: Date.now(),
      title: title,
      start: start,
      end: end,
      description: "",
      categoryId: 5, // 默认分类
      categoryColor: "#60a5fa",
      allDay: true,
      addToTodo: true,
    };
    events.value.push(newEvent);
  }

  // 同步事件到 ToDoList
  function syncEventToTodo(event: any) {
    const todoStore = useTodoStore();
    const idx = todoStore.todos.findIndex(
      (todo) =>
        event.title === todo.title &&
        event.end.getDate() === todo.dueDate.getDate()
    );
    if (event.addToTodo) {
      // 添加或更新
      const todoItem = {
        id: Date.now(),
        title: event.title,
        dueDate: event.end,
        completed: false,
        addToCalendar: true,
      };
      if (idx === -1) {
        todoStore.todos.push(todoItem);
      } else {
        todoStore.todos[idx] = todoItem;
      }
    } else if (idx !== -1) {
      // 取消同步则移除
      todoStore.todos.splice(idx, 1);
    }
  }

  // 保存事件 (新建或更新)
  function saveEvent() {
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
      events.value.push(eventToSave);
    } else {
      const index = events.value.findIndex((e) => e.id === eventToSave.id);
      if (index !== -1) {
        events.value[index] = eventToSave;
      }
    }
    syncEventToTodo(eventToSave);
    closeEventModal();
  }

  // 删除当前模态框中的事件
  function deleteEvent() {
    const index = events.value.findIndex((e) => e.id === currentEvent.value.id);
    if (index !== -1) {
      const event = events.value[index];
      if (event.addToTodo) {
        const todoStore = useTodoStore();
        const todoIndex = todoStore.todos.findIndex(
          (todo) =>
            event.title === todo.title &&
            event.end.getDate() === todo.dueDate.getDate()
        );
        if (todoIndex !== -1) {
          // 删除相关联的 todo 事项
          todoStore.todos.splice(todoIndex, 1);
        }
      }
      events.value.splice(index, 1);
    }
    closeEventModal();
  }

  // 切换分类的激活状态 (用于筛选事件)
  function toggleCategory(categoryId: number) {
    const category = categories.value.find((c) => c.id === categoryId);
    if (category) {
      category.active = !category.active;
    }
  }

  // 打开新建分类模态框
  function openNewCategoryModal() {
    isNewCategory.value = true;
    currentCategory.value = {
      id: Date.now(),
      name: "",
      color: "#4f46e5",
      active: true,
    };
    showCategoryModal.value = true;
  }

  // 打开分类编辑模态框
  function openCategoryDetails(category: any) {
    isNewCategory.value = false;
    currentCategory.value = { ...category };
    showCategoryModal.value = true;
  }

  // 关闭分类模态框
  function closeCategoryModal() {
    showCategoryModal.value = false;
  }

  // 保存分类 (新建或更新)
  function saveCategory() {
    if (isNewCategory.value) {
      categories.value.push({ ...currentCategory.value });
    } else {
      // 找到要更新的分类
      const index = categories.value.findIndex(
        (c) => c.id === currentCategory.value.id
      );

      if (index !== -1) {
        // 保存旧的颜色值，用于比较是否有颜色变化
        const oldColor = categories.value[index].color;
        const newColor = currentCategory.value.color;

        // 更新分类
        categories.value[index] = { ...currentCategory.value };

        // 如果颜色发生了变化，更新所有使用该分类的事件颜色
        if (oldColor !== newColor) {
          events.value.forEach((event) => {
            if (event.categoryId === currentCategory.value.id) {
              event.categoryColor = newColor;
            }
          });
        }
      }
    }
    closeCategoryModal();
  }

  // 删除当前模态框中的分类
  function deleteCategory() {
    // 检查是否有使用此分类的事件
    const hasEvents = events.value.some(
      (e) => e.categoryId === currentCategory.value.id
    );

    if (hasEvents) {
      alert("此分类下有事件，无法删除。请先移除或重新分类相关事件。");
      return;
    }

    const index = categories.value.findIndex(
      (c) => c.id === currentCategory.value.id
    );
    if (index !== -1) {
      categories.value.splice(index, 1);
    }
    closeCategoryModal();
  }

  // 检查颜色是否已被其他分类使用 (不包括当前编辑的分类自身)
  function isColorUsed(color: string): boolean {
    // 如果是编辑模式，当前正在编辑的分类的颜色可以继续使用
    if (
      !isNewCategory.value &&
      color ===
        categories.value.find((c) => c.id === currentCategory.value.id)?.color
    ) {
      return false;
    }

    // 检查其他分类是否已使用此颜色
    return categories.value.some(
      (category) =>
        category.color.toLowerCase() === color.toLowerCase() &&
        category.id !== currentCategory.value.id
    );
  }

  // 选择颜色并应用到当前分类 (如果颜色未被使用)
  function selectColor(color: string): void {
    if (!isColorUsed(color)) {
      currentCategory.value.color = color;
    }
  }

  // 检查分类表单是否有效 (名称不能为空)
  const isCategoryFormValid = computed(() => {
    return currentCategory.value.name.trim() !== "";
  });

  return {
    events,
    categories,
    showEventModal,
    isNewEvent,
    currentEvent,
    showCategoryModal,
    isNewCategory,
    currentCategory,
    openNewCategoryModal,
    openCategoryDetails,
    closeCategoryModal,
    saveCategory,
    deleteCategory,
    getEventsForDay,
    formatEventTime,
    formatTime,
    formatDateTimeForInput,
    openNewEventModal,
    openEventDetails,
    closeEventModal,
    addEvent,
    saveEvent,
    deleteEvent,
    toggleCategory,
    colorOptions,
    isColorUsed,
    selectColor,
    isCategoryFormValid,
    updateEventCategoryColor,

    // 搜索相关导出
    searchInputValue,
    searchQuery, // 主要用于 getHighlightedHTMLContent
    isSearchFocused, // 主要用于 showSearchDropdown
    focusedResultIndex, // 仍然导出，因为组件的 :class 绑定需要它
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
  };
});
