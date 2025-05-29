import { ref } from "vue";
import { useEventStore } from "../event";

export const createPageModule = (storeContext: any) => {
  // 页面控制状态
  const showHelpModal = ref(false);
  const showToggleButton = ref(false);

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

  // 滚动控制
  function scrollApp(direction: "up" | "down") {
    const scrollDistance = direction === "up" ? -200 : 200;

    // 定义滚动目标的优先级顺序
    const scrollTargets = [
      // 模态框优先级最高
      showHelpModal.value ? ".help-modal .modal-body" : null,
      useEventStore().showEventModal ? ".event-modal .modal-body" : null,
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

    const eventStore = useEventStore();
    if (eventStore.showEventModal) {
      if (event.key === "Escape") {
        eventStore.closeEventModal();
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
    showToggleButton,
    toggleHelpModal,
    openHelpModal,
    closeHelpModal,
    scrollApp,
    executeCommand,
    handleGlobalKeydown,
  };
};
