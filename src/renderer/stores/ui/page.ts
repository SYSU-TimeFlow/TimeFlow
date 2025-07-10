import { ref } from "vue";
import { useEventStore } from "../event";
import { useSettingStore } from "../setting";
import { formatDateForInput } from "../../utils";
import { Event, EventType, colorOptions } from "../../const";

export const createPageModule = (storeContext: any) => {
  // 模态框状态管理
  const showHelpModal = ref(false);
  const showToggleButton = ref(false);
  const showCategoryModal = ref(false);
  const showEventModal = ref(false);
  const showTodoModal = ref(false);
  const showFeedbackModal = ref(false);
  const showSettings = ref(false);
  const showMessageModal = ref(false);


  // 通用模态框控制函数
  const toggleModal = (modalRef: any) => {
    modalRef.value = !modalRef.value;
  };

  const openModal = (modalRef: any) => {
    modalRef.value = true;
  };

  const closeModal = (modalRef: any) => {
    modalRef.value = false;
  };

  // 具体模态框控制
  const toggleTodoModal = () => toggleModal(showTodoModal);
  const toggleHelpModal = () => toggleModal(showHelpModal);
  const toggleEventModal = () => toggleModal(showEventModal);
  
  const openHelpModal = () => openModal(showHelpModal);
  const closeHelpModal = () => closeModal(showHelpModal);
  const closeTodoModal = () => closeModal(showTodoModal);
  const closeEventModal = () => closeModal(showEventModal);
  const closeCategoryModal = () => closeModal(showCategoryModal);
  const closeMessageModal = () => closeModal(showMessageModal);

  // 设置弹窗控制
  async function toggleSettings() {
    showSettings.value = !showSettings.value;
    const settingStore = useSettingStore();
    if (showSettings.value) {
      await settingStore.loadSettings();
    }
  }

  const closeSettings = () => closeModal(showSettings);

  // 创建默认分类
  const createDefaultCategory = () => {
    const eventStore = useEventStore();
    return eventStore.categories.find((c) => c.id === 5) ||
      eventStore.categories[0] || {
        id: 5,
        color: "#43aa8b",
        name: "Other",
        active: true,
      };
  };

  // 待办事项模态框操作
  const openNewTodoModal = () => {
    const eventStore = useEventStore();
    eventStore.isNewTodo = true;
    const placeholderDate = new Date(0); // 1970-01-01T00:00:00.000Z
    const today = new Date();
    today.setHours(23, 59, 59, 0);
    const defaultCat = createDefaultCategory();

    eventStore.currentEvent = {
      id: Date.now(),
      title: "",
      start: formatDateForInput(placeholderDate),
      end: formatDateForInput(today),
      description: "",
      categoryId: defaultCat.id,
      categoryColor: defaultCat.color,
      allDay: false,
      eventType: EventType.BOTH,
      completed: false,
    };

    openModal(showTodoModal);
  };

  const openEditTodoModal = (todo: Event) => {
    const eventStore = useEventStore();
    eventStore.isNewTodo = false;
    const placeholderDate = new Date(0);
    
    eventStore.currentEvent = {
      ...todo,
      start: formatDateForInput(placeholderDate),
      end: todo.end ? formatDateForInput(todo.end) : "",
    };
    
    openModal(showTodoModal);
  };

  // 事件模态框操作
  const openNewEventModal = (date?: Date) => {
    const eventStore = useEventStore();
    eventStore.isNewEvent = true;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const defaultCat = createDefaultCategory();

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

    openModal(showEventModal);
  };

  const openEventDetails = (event: Event) => {
    const eventStore = useEventStore();
    eventStore.isNewEvent = false;
    eventStore.currentEvent = {
      ...event,
      start: formatDateForInput(event.start),
      end: formatDateForInput(event.end),
    };

    if (event.eventType === EventType.TODO) {
      openModal(showTodoModal);
    } else {
      openModal(showEventModal);
    }
  };

  // 分类模态框操作
  const openNewCategoryModal = () => {
    const eventStore = useEventStore();
    eventStore.isNewCategory = true;
    eventStore.currentCategory = {
      id: Date.now(),
      name: "",
      color: colorOptions.find((c) => !eventStore.isColorUsed(c)) || colorOptions[0],
      active: true,
    };
    openModal(showCategoryModal);
  };

  const openCategoryDetails = (category: any) => {
    const eventStore = useEventStore();
    eventStore.isNewCategory = false;
    eventStore.currentCategory = { ...category };
    openModal(showCategoryModal);
  };

  // 滚动控制
  const scrollApp = (direction: "up" | "down") => {
    const scrollDistance = direction === "up" ? -200 : 200;
    
    const scrollTargets = [
      showHelpModal.value ? ".help-modal .modal-body" : null,
      showEventModal.value ? ".event-modal .modal-body" : null,
      ".todo-list-container",
      ".main-content-area",
      "main",
      ".calendar-main",
    ].filter(Boolean);

    for (const selector of scrollTargets) {
      const element = document.querySelector(selector as string);
      if (element) {
        element.scrollBy({
          top: scrollDistance,
          behavior: "smooth",
        });
        return;
      }
    }

    // 回退到窗口滚动
    window.scrollBy({
      top: scrollDistance * 2.5,
      behavior: "smooth",
    });
  };

  // 命令处理
  const executeCommand = (commandText: string): boolean => {
    const command = commandText.replace(/^:/, "").trim().toLowerCase();

    switch (command) {
      case "today":
        storeContext.currentDate.value = new Date();
        storeContext.selectedDate.value = new Date();
        return true;
      default:
        return false;
    }
  };

  // 全局键盘事件处理
  const handleGlobalKeydown = (event: KeyboardEvent) => {
    // 帮助模态框处理
    if (showHelpModal.value) {
      if (event.key === "Escape") {
        closeHelpModal();
        event.preventDefault();
      }
      return;
    }

    // 事件模态框处理
    if (showEventModal.value) {
      if (event.key === "Escape") {
        closeEventModal();
        event.preventDefault();
      } else if (event.key === "Enter" && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        if (
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement?.hasAttribute("contenteditable")
        ) {
          return;
        }

        const saveButton = document.querySelector(".event-modal .save-button") as HTMLButtonElement;
        if (saveButton) {
          saveButton.click();
          event.preventDefault();
        }
      }
      return;
    }

    // 跳过输入元素
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement?.hasAttribute("contenteditable")
    ) {
      return;
    }
  };

  // 消息模态框状态与方法
  const messageModalTitle = ref('');
  const messageModalContent = ref('');

  function showMessage(title: string, content: string) {
    messageModalTitle.value = title;
    messageModalContent.value = content;
    showMessageModal.value = true;
  }

  return {
    showHelpModal,
    showCategoryModal,
    showEventModal,
    showTodoModal,
    showToggleButton,
    showSettings,
    showFeedbackModal,
    toggleTodoModal,
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
    showMessageModal,
    closeMessageModal,
    showMessage,
    messageModalTitle,
    messageModalContent,
  };
};
