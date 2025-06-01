import { useEventStore } from "../../event";

export const createDayModule = (storeContext: any) => {
  const { openNewEventModal, draggedEvent } = storeContext;

  // 计算鼠标位置对应的时间
  function calculateTimeFromMousePosition(event: DragEvent, day: any) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const mouseY = event.clientY;
    const relativeY = mouseY - rect.top;
    const hourHeight = rect.height;

    // 计算小时和分钟（只保留整点和半点）
    const hour = day.hour;
    const minute = relativeY > hourHeight * 0.5 ? 30 : 0;

    return { hour, minute };
  }

  // 计算拖拽时事件信息的偏移量
  function calculateDragOffset(event: any) {
    if (!draggedEvent.value) return 0;

    const eventStore = useEventStore();
    const draggedEventData = eventStore.events.find(
      (e) => e.id === draggedEvent.value
    );
    if (!draggedEventData) return 0;

    const startTime = new Date(draggedEventData.start);
    const endTime = new Date(draggedEventData.end);
    const duration = endTime.getTime() - startTime.getTime();
    const hours = duration / (1000 * 60 * 60);

    // 每个小时的高度是64px，所以事件高度的一半就是 (hours * 64) / 2
    return -(hours * 64) / 2;
  }

  // 检查时间是否有效
  function isValidTime(hour: number, minute: number) {
    return hour >= 0 && hour < 24 && minute % 5 === 0;
  }

  // 检查时间变化是否足够大
  function isTimeChangeSignificant(originalTime: Date, newTime: Date): boolean {
    const timeDiff = Math.abs(newTime.getTime() - originalTime.getTime());
    // 如果时间差超过5分钟（300000毫秒），则认为变化显著
    return timeDiff >= 300000;
  }

  function handleHourClick(day: any, hour: number, minute: number = 0) {
    const date = new Date(day.date);
    date.setHours(hour, minute, 0, 0);
    openNewEventModal(date);
  }

  // 处理事件调整大小开始
  function handleDayEventResize(
    event: MouseEvent,
    calendarEvent: any,
    handle: "top" | "bottom"
  ) {
    event.preventDefault();
    event.stopPropagation();

    const eventStore = useEventStore();
    const startY = event.clientY;
    const originalStart = new Date(calendarEvent.start);
    const originalEnd = new Date(calendarEvent.end);

    // 计算每个时间单位对应的像素高度（64px/小时）
    const pixelsPerHour = 64;
    const pixelsPerMinute = pixelsPerHour / 60;

    function handleMouseMove(e: MouseEvent) {
      const deltaY = e.clientY - startY;
      const deltaMinutes = Math.round(deltaY / pixelsPerMinute / 5) * 5; // 对齐到5分钟

      if (handle === "top") {
        const newStart = new Date(originalStart);
        newStart.setMinutes(newStart.getMinutes() + deltaMinutes);

        // 确保新的开始时间不晚于结束时间
        if (newStart < originalEnd) {
          const eventIndex = eventStore.events.findIndex(
            (e) => e.id === calendarEvent.id
          );
          if (eventIndex !== -1) {
            eventStore.events[eventIndex] = {
              ...calendarEvent,
              start: newStart,
            };
          }
        }
      } else {
        const newEnd = new Date(originalEnd);
        newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);

        // 确保新的结束时间不早于开始时间
        if (newEnd > originalStart) {
          const eventIndex = eventStore.events.findIndex(
            (e) => e.id === calendarEvent.id
          );
          if (eventIndex !== -1) {
            eventStore.events[eventIndex] = {
              ...calendarEvent,
              end: newEnd,
            };
          }
        }
      }
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleDayDrop(event: DragEvent, day: any) {
    const eventStore = useEventStore();

    if (draggedEvent.value && event.dataTransfer) {
      const eventId = parseInt(event.dataTransfer.getData("text/plain"));
      const eventIndex = eventStore.events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        const originalEvent = eventStore.events[eventIndex];

        // 如果是全天事件，保持全天状态
        if (originalEvent.allDay) {
          const newStart = new Date(day.date);
          newStart.setHours(0, 0, 0, 0);
          const newEnd = new Date(day.date);
          newEnd.setHours(23, 59, 59, 999);

          eventStore.events[eventIndex] = {
            ...originalEvent,
            start: newStart,
            end: newEnd,
          };
          draggedEvent.value = null;
          return;
        }

        // 计算新的时间
        const { hour, minute } = calculateTimeFromMousePosition(event, day);

        // 检查时间是否有效
        if (!isValidTime(hour, minute)) {
          event.preventDefault();
          return;
        }

        // 待办类型事件
        if (
          originalEvent.eventType === "both" &&
          new Date(originalEvent.start).getFullYear() <= 1970
        ) {
          const newEnd = new Date(day.date);
          newEnd.setHours(hour, minute, 0, 0);

          // 检查时间变化是否显著
          if (!isTimeChangeSignificant(new Date(originalEvent.end), newEnd)) {
            draggedEvent.value = null;
            return;
          }

          // 允许重叠，直接修改
          eventStore.events[eventIndex] = {
            ...originalEvent,
            end: newEnd,
          };
        } else {
          // 普通事件
          const originalStart = new Date(originalEvent.start);
          const originalEnd = new Date(originalEvent.end);
          const duration = originalEnd.getTime() - originalStart.getTime();

          const newStart = new Date(day.date);
          newStart.setHours(hour, minute, 0, 0);
          const newEnd = new Date(newStart.getTime() + duration);

          // 检查时间变化是否显著
          if (!isTimeChangeSignificant(originalStart, newStart)) {
            draggedEvent.value = null;
            return;
          }

          // 允许重叠，直接修改
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
    handleHourClick,
    handleDayDrop,
    calculateDragOffset,
    handleDayEventResize,
  };
};
