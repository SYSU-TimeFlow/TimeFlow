import { ref } from "vue";
import { useEventStore } from "../event";

export const createPageModule = (storeContext: any) => {
  const { appMode, isSearchActive } = storeContext;

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
    const helpModalContent = showHelpModal.value
      ? document.querySelector(".help-modal .modal-body")
      : null;

    const eventStore = useEventStore();
    const eventModalContent = eventStore.showEventModal
      ? document.querySelector(".event-modal .modal-body")
      : null;

    if (helpModalContent || eventModalContent) {
      const modalToScroll = helpModalContent || eventModalContent;
      modalToScroll?.scrollBy({
        top: direction === "up" ? -200 : 200,
        behavior: "smooth",
      });
    } else {
      const mainContent =
        document.querySelector(".main-content-area") ||
        document.querySelector("main");

      if (mainContent) {
        mainContent.scrollBy({
          top: direction === "up" ? -500 : 500,
          behavior: "smooth",
        });
      } else {
        window.scrollBy({
          top: direction === "up" ? -500 : 500,
          behavior: "smooth",
        });
      }
    }
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