import { computed } from "vue";
import { useEventStore } from "../../event";

export const createDayModule = (storeContext: any) => {
  const { currentDate, openNewEventModal, draggedEvent } = storeContext;

  // 获取日视图的事件数据
  const dayViewEvents = computed(() => {
    const eventStore = useEventStore();
    return eventStore.getEventsForDay(currentDate.value);
  });

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

  // 检查时间是否有效
  function isValidTime(hour: number, minute: number) {
    return hour >= 0 && hour < 24 && (minute === 0 || minute === 30);
  }

  // 格式化时间显示
  function formatTimeDisplay(hour: number, minute: number) {
    const hourStr = hour.toString().padStart(2, "0");
    const minuteStr = minute.toString().padStart(2, "0");
    return `${hourStr}:${minuteStr}`;
  }

  function handleHourClick(day: any, hour: number, minute: number = 0) {
    const date = new Date(day.date);
    date.setHours(hour, minute, 0, 0);
    openNewEventModal(date);
  }

  function handleDropDay(event: DragEvent, day: any) {
    const eventStore = useEventStore();

    if (draggedEvent.value && event.dataTransfer) {
      const eventId = parseInt(event.dataTransfer.getData("text/plain"));
      const eventIndex = eventStore.events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        const originalEvent = eventStore.events[eventIndex];

        // 计算新的时间
        const { hour, minute } = calculateTimeFromMousePosition(event, day);

        // 检查时间是否有效
        if (!isValidTime(hour, minute)) {
          event.preventDefault();
          return;
        }

        // 检查是否为待办类型事件
        if (
          originalEvent.eventType === "both" &&
          new Date(originalEvent.start).getFullYear() <= 1970
        ) {
          // 对于待办类型，修改截止日期(end)和时间
          const newEnd = new Date(day.date);
          newEnd.setHours(hour, minute, 0, 0);

          // 检查是否与现有事件重叠（排除当前事件）
          const hasOverlap = eventStore.events.some(
            (e) =>
              e.id !== originalEvent.id &&
              e.eventType === "both" &&
              new Date(e.end).getTime() === newEnd.getTime()
          );

          if (!hasOverlap) {
            eventStore.events[eventIndex] = {
              ...originalEvent,
              end: newEnd,
            };
          } else {
            event.preventDefault();
          }
        } else {
          // 普通事件的原有处理逻辑
          const originalStart = new Date(originalEvent.start);
          const originalEnd = new Date(originalEvent.end);
          const duration = originalEnd.getTime() - originalStart.getTime();

          const newStart = new Date(day.date);
          newStart.setHours(hour, minute, 0, 0);
          const newEnd = new Date(newStart.getTime() + duration);

          // 检查是否与现有事件重叠（排除当前事件）
          const hasOverlap = eventStore.events.some(
            (e) =>
              e.id !== originalEvent.id &&
              ((newStart >= new Date(e.start) && newStart < new Date(e.end)) ||
                (newEnd > new Date(e.start) && newEnd <= new Date(e.end)) ||
                (newStart <= new Date(e.start) && newEnd >= new Date(e.end)))
          );

          // 如果新位置与当前位置不同，则更新事件
          if (!hasOverlap && newStart.getTime() !== originalStart.getTime()) {
            eventStore.events[eventIndex] = {
              ...originalEvent,
              start: newStart,
              end: newEnd,
            };
          } else {
            event.preventDefault();
          }
        }
      }
    }
    draggedEvent.value = null;
  }

  return {
    dayViewEvents,
    handleHourClick,
    handleDropDay,
  };
};
