import { ref } from "vue";
import { useEventStore } from "../event";
import { useSettingStore } from "../setting";
import { formatDateForInput } from "../../utils";
import { Event, EventType, colorOptions } from "../../const";

export const createPageModule = (storeContext: any) => {
  // 页面控制状态
  const showHelpModal = ref(false);
  const showToggleButton = ref(false);
  const showCategoryModal = ref(false);
  const showEventModal = ref(false);
  const showTodoModal = ref(false);

  // 模态框控制
  function toggleHelpModal() {
    showHelpModal.value = !showHelpModal.value;
  }

  function openHelpModal() {
    showHelpModal.value = true;
  }

  function closeHelpModal() {
    showHelpModal.value = false;
  }

  // 控制设置弹窗显示状态
  const showSettings = ref(false);

  // 切换设置弹窗显示/隐藏
  async function toggleSettings() {
    showSettings.value = !showSettings.value;

    const settingStore = useSettingStore();
    // 如果打开设置，确保已加载最新设置
    if (showSettings.value) {
      await settingStore.loadSettings();
    }
  }

  // 关闭设置弹窗
  function closeSettings() {
    showSettings.value = false;
  }

  const openNewTodoModal = () => {
    const eventStore = useEventStore();
    eventStore.isNewTodo = true;
    // 使用1970年1月1日作为起始时间的占位符
    const placeholderDate = new Date(0); // 1970-01-01T00:00:00.000Z
    const today = new Date();
    today.setHours(23, 59, 59, 0);
    const defaultCat = eventStore.categories.find((c) => c.id === 5) ||
      eventStore.categories[0] || {
        id: 5,
        color: "#43aa8b",
        name: "其他",
        active: true,
      };
    eventStore.currentEvent = {
      id: Date.now(),
      title: "",
      start: formatDateForInput(placeholderDate), // 使用1970年占位符作为开始时间
      end: formatDateForInput(today), // 默认有截止时间
      description: "",
      categoryId: defaultCat.id,
      categoryColor: defaultCat.color,
      allDay: false, // 待办事项设置为非全天事件
      eventType: EventType.BOTH, // 默认为BOTH类型，因为默认有截止时间
      completed: false,
    };

    showTodoModal.value = true;
  };

  const openEditTodoModal = (todo: Event) => {
    const eventStore = useEventStore();
    eventStore.isNewTodo = false;
    // 使用1970年1月1日作为起始时间的占位符
    const placeholderDate = new Date(0); // 1970-01-01T00:00:00.000Z
    eventStore.currentEvent = {
      ...todo,
      start: formatDateForInput(placeholderDate), // 待办事项开始时间始终为1970年占位符
      end: todo.end ? formatDateForInput(todo.end) : "", // 格式化截止时间（如果有）
    };
    showTodoModal.value = true;
  };

  const closeTodoModal = () => {
    showTodoModal.value = false;
  };

  // 事件模态框相关函数
  function openNewEventModal(date?: Date) {
    const eventStore = useEventStore();
    eventStore.isNewEvent = true;
    const startDate = date || new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const defaultCat = eventStore.categories.find((c) => c.id === 5) ||
      eventStore.categories[0] || {
        id: 5,
        color: "#43aa8b",
        name: "其他",
        active: true,
      };

    eventStore.currentEvent = {
      id: Date.now(),
      title: "",
      start: formatDateForInput(startDate),
      end: formatDateForInput(endDate),
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
    const eventStore = useEventStore();
    eventStore.isNewEvent = false;
    eventStore.currentEvent = {
      ...event,
      start: formatDateForInput(event.start),
      end: formatDateForInput(event.end),
    };

    if (event.eventType === EventType.TODO) {
      showTodoModal.value = true;
    } else {
      showEventModal.value = true;
    }
  }

  function openNewCategoryModal() {
    const eventStore = useEventStore();
    eventStore.isNewCategory = true;
    eventStore.currentCategory = {
      id: Date.now(),
      name: "",
      color:
        colorOptions.find((c) => !eventStore.isColorUsed(c)) || colorOptions[0], // 尝试选择一个未使用的颜色
      active: true,
    };
    showCategoryModal.value = true;
  }

  function openCategoryDetails(category) {
    const eventStore = useEventStore();
    eventStore.isNewCategory = false;
    eventStore.currentCategory = { ...category };
    showCategoryModal.value = true;
  }

  function closeCategoryModal() {
    showCategoryModal.value = false;
  }

  function closeEventModal() {
    showEventModal.value = false;
  }

  function toggleEventModal() {
    showEventModal.value = !showEventModal.value;
  }

  // 滚动控制
  function scrollApp(direction: "up" | "down") {
    const scrollDistance = direction === "up" ? -200 : 200;

    // 定义滚动目标的优先级顺序
    const scrollTargets = [
      // 模态框优先级最高
      showHelpModal.value ? ".help-modal .modal-body" : null,
      showEventModal ? ".event-modal .modal-body" : null,
      // 具体视图容器
      ".todo-list-container",
      ".main-content-area",
      "main",
      ".calendar-main",
    ].filter(Boolean); // 过滤掉 null 值

    // 按优先级查找并滚动第一个找到的元素
    for (const selector of scrollTargets) {
      const element = document.querySelector(selector as string);
      if (element) {
        element.scrollBy({
          top: scrollDistance,
          behavior: "smooth",
        });
        return; // 找到并滚动后立即返回
      }
    }

    // 如果没有找到任何目标元素，回退到窗口滚动
    window.scrollBy({
      top: scrollDistance * 2.5, // 窗口滚动使用更大的距离
      behavior: "smooth",
    });
  }

  // 命令处理
  function executeCommand(commandText: string): boolean {
    const command = commandText.replace(/^:/, "").trim().toLowerCase();

    switch (command) {
      case "today":
        // 通过 storeContext 调用主模块的 goToToday
        storeContext.currentDate.value = new Date();
        storeContext.selectedDate.value = new Date();
        return true;
      default:
        return false;
    }
  }

  // 全局键盘事件处理
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (showHelpModal.value) {
      if (event.key === "Escape") {
        closeHelpModal();
        event.preventDefault();
        return;
      }
      return;
    }

    if (showEventModal) {
      if (event.key === "Escape") {
        closeEventModal();
        event.preventDefault();
        return;
      } else if (
        event.key === "Enter" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement?.hasAttribute("contenteditable")
        ) {
          return;
        }

        const saveButton = document.querySelector(
          ".event-modal .save-button"
        ) as HTMLButtonElement;
        if (saveButton) {
          saveButton.click();
          event.preventDefault();
        }
        return;
      }
      return;
    }

    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement?.hasAttribute("contenteditable")
    ) {
      return;
    }
  }

  return {
    showHelpModal,
    showCategoryModal,
    showEventModal,
    showTodoModal,
    showToggleButton,
    showSettings,
    toggleSettings,
    closeSettings,
    openCategoryDetails,
    openNewTodoModal,
    openEditTodoModal,
    closeTodoModal,
    openNewEventModal,
    closeEventModal,
    openEventDetails,
    toggleEventModal,
    openNewCategoryModal,
    closeCategoryModal,
    toggleHelpModal,
    openHelpModal,
    closeHelpModal,
    scrollApp,
    executeCommand,
    handleGlobalKeydown,
  };
};
