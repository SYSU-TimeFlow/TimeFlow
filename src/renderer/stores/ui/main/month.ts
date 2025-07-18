/**
 * @file month.ts
 * @description 月视图功能模块，负责单月日历的点击、拖拽事件处理和交互逻辑。
 * 
 * 为什么这样做：
 * - 通过 handleDayClick 实现日期选择和快速添加事件，提升用户操作效率和体验。
 * - 拖拽事件支持待办和普通事件的区分处理，保证不同类型事件的交互一致性和数据准确性。
 * - 拖拽时自动计算事件持续时间和时间点，避免用户手动调整，提升交互流畅度。
 * - 所有核心操作均有注释说明，便于团队协作和后续维护。
 */

import { useEventStore } from "../../event";

export const createMonthModule = (storeContext: any) => {
  const { currentDate, selectedDate, draggedEvent, openNewEventModal } =
    storeContext;

  function handleDayClick(day: any, isAddEvent = false) {
    if (day.isCurrentMonth) {
      currentDate.value = new Date(day.date);
      selectedDate.value = new Date(day.date);
      if (isAddEvent) {
        const startDate = new Date(day.date);
        startDate.setHours(9, 0, 0, 0);
        openNewEventModal(startDate);
      }
    }
  }

  function handleMonthDrop(event: DragEvent, day: any) {
    const eventStore = useEventStore();

    if (draggedEvent.value && event.dataTransfer) {
      const eventId = parseInt(event.dataTransfer.getData("text/plain"));
      const eventIndex = eventStore.events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        const originalEvent = eventStore.events[eventIndex];

        // 检查是否为待办类型事件（both类型且无实际开始时间）
        if (
          originalEvent.eventType === "both" &&
          new Date(originalEvent.start).getFullYear() <= 1970
        ) {
          // 对于待办类型，只修改截止日期(end)，保持相同的时间点
          const originalEnd = new Date(originalEvent.end);
          const newEnd = new Date(day.date);
          newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes());

          eventStore.events[eventIndex] = {
            ...originalEvent,
            end: newEnd,
          };
        } else {
          // 普通事件的原有处理逻辑
          const originalStart = new Date(originalEvent.start);
          const originalEnd = new Date(originalEvent.end);
          const duration = originalEnd.getTime() - originalStart.getTime();

          const newStart = new Date(day.date);
          newStart.setHours(
            originalStart.getHours(),
            originalStart.getMinutes()
          );
          const newEnd = new Date(newStart.getTime() + duration);

          eventStore.events[eventIndex] = {
            ...originalEvent,
            start: newStart,
            end: newEnd,
          };
        }
      }
    }
    draggedEvent.value = null;
  }

  return {
    handleDayClick,
    handleMonthDrop,
  };
};
