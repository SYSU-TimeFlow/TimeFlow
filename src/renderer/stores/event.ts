import { defineStore } from "pinia";
import { ref, computed, nextTick, watch } from "vue";
import { useUiStore } from "./ui";
import { formatDateForInput } from "../utils";
import { EventType, Event, FilterType, Category, colorOptions } from "../const";

declare global {
  interface Window {
    electronAPI?: {
      saveSettings: (settings: any) => Promise<void>;
      loadSettings: () => Promise<any>;
      notify: (title: string, body: string) => void;
      minimize?: () => void;
      maximize?: () => void;
      close?: () => void;
      importSchedule: () => Promise<{
        success: boolean;
        schedule?: any[];
        message?: string;
      }>;
    };
  }
}

export const useEventStore = defineStore("event", () => {
  const uiStore = useUiStore();
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

  const isNewCategory = ref(true);
  // 修改：为 currentCategory 添加类型注解
  const currentCategory = ref<Category>({
    id: 0,
    name: "",
    color: colorOptions[0], // 默认颜色
    active: true,
  });

  // 事件模态框状态管理

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

  const isNewTodo = ref(true);
  const activeFilter = ref<FilterType>("all");

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
    // 标题校验
    if (!currentEvent.value.title || currentEvent.value.title.trim() === "") {
      eventTitleError.value = "标题不能为空";
      eventTimeError.value = "";
      eventShake.value = false;
      await nextTick();
      eventShake.value = true;
      return;
    }
    // 结束时间不能早于开始时间
    const start = new Date(currentEvent.value.start);
    const end = new Date(currentEvent.value.end);
    if (end < start) {
      eventTitleError.value = "";
      eventTimeError.value = "结束时间不能早于开始时间";
      eventShake.value = false;
      await nextTick();
      eventShake.value = true;
      return;
    }
    eventTitleError.value = "";
    eventTimeError.value = "";
    eventShake.value = false;
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
    uiStore.closeEventModal();
  }

  async function deleteEvent(id?: number) {
    // 如果 id 不是 number 类型，使用 currentEvent.value.id
    const eventId = typeof id === "number" ? id : currentEvent.value.id;
    const index = events.value.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      events.value.splice(index, 1);
    }
    uiStore.closeEventModal();
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
    // 只显示激活分类的待办事项
    const activeCategoryIds = categories.value
      .filter((category) => category.active)
      .map((category) => category.id);

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

    // 只保留属于激活分类的待办事项
    list = list.filter((todo) => activeCategoryIds.includes(todo.categoryId));

    // 优先显示未完成事项，并在各自组内按截止日期升序排序
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const aHasDeadline = new Date(a.end).getFullYear() > 1970;
      const bHasDeadline = new Date(b.end).getFullYear() > 1970;
      if (aHasDeadline !== bHasDeadline) {
        return aHasDeadline ? -1 : 1;
      }
      if (aHasDeadline && bHasDeadline) {
        return a.end.getTime() - b.end.getTime();
      }
      return a.id - b.id;
    });
  });

  // 响应式校验状态
  const todoError = ref("");
  const todoShake = ref(false);
  const eventTitleError = ref("");
  const eventTimeError = ref("");
  const eventShake = ref(false);

  // 保存待办事项（响应式状态实现）
  const saveTodo = async (hasDeadlineParam?: boolean) => {
    // 标题校验
    if (!currentEvent.value.title || currentEvent.value.title.trim() === "") {
      todoError.value = "标题不能为空";
      todoShake.value = false;
      await nextTick();
      todoShake.value = true;
      return;
    }
    todoError.value = "";
    todoShake.value = false;
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
      currentEvent.value.end = formatDateForInput(placeholderDate);
    } else if (
      !currentEvent.value.end ||
      currentEvent.value.end.trim() === ""
    ) {
      // 有截止时间但end为空，设置默认值为今天结束
      const today = new Date();
      today.setHours(23, 59, 59, 0);
      currentEvent.value.end = formatDateForInput(today);
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
    uiStore.closeTodoModal();
  };

  // 空状态消息（根据当前过滤器显示不同消息）
  const emptyStateMessage = computed(() => {
    switch (activeFilter.value) {
      case "completed":
        return "No completed todos";
      case "active":
        return "No active todos";
      default:
        return "No todos";
    }
  });

  // 设置待办事项过滤器
  function setFilter(filter: FilterType) {
    activeFilter.value = filter;
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
    uiStore.closeCategoryModal();
  }

  async function deleteCategory() {
    if (!isNewCategory.value) {
      if (categories.value.length <= 1) {
        uiStore.showInfoMessage("无法删除分类", "至少需要保留一个分类");
        return;
      }

      // 弹出确认模态框，等待用户操作
      await uiStore.showConfirmMessage(
        "确认删除分类",
        "删除该分类将同时删除其下所有事件，是否继续？"
      );

      const index = categories.value.findIndex(
        (c) => c.id === currentCategory.value.id
      );
      if (index !== -1) {
        const categoryToDeleteId = currentCategory.value.id;
        // 直接删除该分类下所有事件
        for (let i = events.value.length - 1; i >= 0; i--) {
          if (events.value[i].categoryId === categoryToDeleteId) {
            events.value.splice(i, 1);
          }
        }
        categories.value.splice(index, 1);
      }
    }
    uiStore.closeCategoryModal();
  }

  // 新增：通过自然语言处理结果创建事件
  function createEventFromNLP(nlpEvent: {
    title: string;
    start: Date;
    end: Date;
  }) {
    const newId =
      events.value.length > 0
        ? Math.max(...events.value.map((e) => e.id)) + 1
        : 1;
    const defaultCategory =
      categories.value.find((c) => c.id === 5) || categories.value[0]; // 默认“其他”分类或第一个

    if (!defaultCategory) {
      console.error("无法创建事件，因为没有可用的分类。");
      // 可以在这里添加一个UI通知
      return;
    }

    const newEvent = new Event(
      newId,
      nlpEvent.title,
      new Date(nlpEvent.start),
      new Date(nlpEvent.end),
      "", // description
      defaultCategory.id,
      defaultCategory.color,
      false, // allDay
      EventType.CALENDAR,
      false // completed
    );

    events.value.push(newEvent);

    // 可选：创建后立即打开日历视图并跳转到对应日期
    uiStore.changeView("day");
    uiStore.currentDate = new Date(nlpEvent.start);
  }

  // 初始化时加载应用数据
  loadAppDataFromStore();

  // =======================BEGIN 课程导入功能 BEGIN========================

  // 从文件导入课程
  async function importScheduleFromFile() {
    if (window.electronAPI) {
      // 导入前提示用户将清除旧数据
      const scheduleCategoryExists = categories.value.some(
        (c) => c.name === "Course"
      );
      if (scheduleCategoryExists) {
        if (!confirm("导入新的课程将会清除所有已导入的课程，要继续吗？")) {
          return;
        }
      }

      const result = await window.electronAPI.importSchedule();
      if (result.success && result.schedule) {
        // 查找“课程”分类
        const scheduleCategory = categories.value.find(
          (c) => c.name === "Course"
        );
        if (scheduleCategory) {
          // 根据分类ID来过滤和删除事件
          events.value = events.value.filter(
            (e) => e.categoryId !== scheduleCategory.id
          );
        }

        // 自动创建或查找“课程”分类
        let scheduleCategoryRef = categories.value.find(
          (c) => c.name === "Course"
        );
        if (!scheduleCategoryRef) {
          scheduleCategoryRef = {
            id: Date.now(),
            name: "Course",
            color: "#7209b7", // 深紫色
            active: true,
          };
          categories.value.push(scheduleCategoryRef);
        } else {
          // 如果分类已存在，确保它是激活状态并使用正确的颜色
          scheduleCategoryRef.active = true;
          scheduleCategoryRef.color = "#7209b7";
        }

        // ======================= 核心逻辑修改 =======================
        // 1. 根据当前月份动态确定学期开始日期
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0 = January, 11 = December

        let SEMESTER_START_DATE;
        let semesterName = "";

        // 规则：2月至7月期间导入，视为春季学期；8月至次年1月期间导入，视为秋季学期。
        if (currentMonth >= 1 && currentMonth <= 6) {
          // Feb to July -> Spring Semester
          SEMESTER_START_DATE = new Date(currentYear, 2, 1); // 春季学期，3月1日开始
          semesterName = "春季学期";
        } else {
          // Aug to Jan -> Autumn Semester
          // 如果是1月份，则属于前一年的秋季学期
          const semesterYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;
          SEMESTER_START_DATE = new Date(semesterYear, 8, 8); // 秋季学期，9月8日开始
          semesterName = "秋季学期";
        }

        const SEMESTER_WEEKS = 18;

        // 2. 确保开始日期是当天的零点，以避免时区计算问题
        SEMESTER_START_DATE.setHours(0, 0, 0, 0);

        // 3. 计算学期第一周的周一。如果设定的开始日期不是周一，则自动调整。
        const dayOfWeekOfStart = SEMESTER_START_DATE.getDay(); // 0=周日, 1=周一, ...
        const firstSemesterMonday = new Date(SEMESTER_START_DATE);
        const adjustment = dayOfWeekOfStart === 0 ? -6 : 1 - dayOfWeekOfStart; // 如果是周日，减6天；否则，减去与周一的差值
        firstSemesterMonday.setDate(SEMESTER_START_DATE.getDate() + adjustment);

        let createdEventsCount = 0;

        // 4. 循环整个学期（18周），从学期第一周的周一为基准创建所有事件
        for (let week = 0; week < SEMESTER_WEEKS; week++) {
          result.schedule.forEach((item) => {
            // 核心修正：检查当前周是否在课程指定的周数范围内
            if (week + 1 >= item.startWeek && week + 1 <= item.endWeek) {
              const eventDate = new Date(firstSemesterMonday);
              // 计算当前课程在学期中对应的具体日期
              eventDate.setDate(
                firstSemesterMonday.getDate() + week * 7 + (item.dayOfWeek - 1)
              );

              const [startHour, startMinute] = item.startTime.split(":");
              const [endHour, endMinute] = item.endTime.split(":");

              const start = new Date(eventDate);
              start.setHours(
                parseInt(startHour, 10),
                parseInt(startMinute, 10),
                0,
                0
              );

              const end = new Date(eventDate);
              end.setHours(
                parseInt(endHour, 10),
                parseInt(endMinute, 10),
                0,
                0
              );

              const newEvent = new Event(
                // 修正：使用时间戳和计数器生成唯一的整数ID，避免使用浮点数
                new Date().getTime() + createdEventsCount,
                item.courseName,
                start,
                end,
                `${item.courseCategory} ${item.teacher} ${week + 1}周`,
                scheduleCategoryRef.id,
                scheduleCategoryRef.color,
                false,
                EventType.CALENDAR, // 使用 CALENDAR 类型
                false
              );
              events.value.push(newEvent);
              createdEventsCount++;
            }
          });
        }

        alert(
          `成功为 ${semesterName}（从 ${firstSemesterMonday.toLocaleDateString()} 开始，共 ${SEMESTER_WEEKS} 周）创建了 ${createdEventsCount} 个课程！`
        );
      } else if (result.message) {
        alert(`导入失败: ${result.message}`);
      }
    }
  }
  // =======================END 课程导入功能 END========================

  return {
    // 状态
    events,
    categories,
    isNewEvent,
    currentEvent,
    isNewCategory,
    currentCategory,
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

    // 工具函数
    getEventsForDay,

    // 分类相关方法
    toggleCategory,
    isColorUsed,
    selectColor,
    isCategoryFormValid,
    updateEventCategoryColor,
    saveCategory,
    deleteCategory,
    createEventFromNLP, // 导出新方法

    // 课程功能
    importScheduleFromFile,

    // 数据存储相关，仅供测试
    loadAppDataFromStore,
    saveAppDataToStore,

    // 响应式校验状态
    todoError,
    todoShake,
    eventTitleError,
    eventTimeError,
    eventShake,
  };
});
