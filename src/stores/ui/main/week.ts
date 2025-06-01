import { useEventStore } from "../../event";
import { useSettingStore } from "../../setting";

export const createWeekModule = (storeContext: any) => {
  const { openNewEventModal, draggedEvent } = storeContext;
  const settingStore = useSettingStore();

  function handleHourClick(day: any, hour: number) {
    const date = new Date(day.date);
    date.setHours(hour, 0, 0, 0);
    openNewEventModal(date);
  }

  // 处理事件调整大小开始
  function handleWeekEventResize(
    event: MouseEvent,
    calendarEvent: any,
    handle: "top" | "bottom"
  ) {
    event.preventDefault();
    event.stopPropagation();

    const eventStore = useEventStore();
    const eventElement = event.target as HTMLElement;
    const eventRect = eventElement.getBoundingClientRect();
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

  function handleWeekDrop(event: DragEvent, day: any) {
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

  // 计算当前时间线位置
  function calculateCurrentTimeLine() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // 每个小时64px，每分钟就是64/60px
    return hours * 64 + (minutes * 64) / 60 + 8; // 8是顶部偏移量
  }

  // 获取当前时间的显示文本
  function getCurrentTimeText() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (settingStore.hour24) {
      return `${hours.toString()}:${minutes.toString().padStart(2, "0")}`;
    } else {
      const period = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      return `${hour12.toString()}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
    }
  }

  // 检查是否需要隐藏整点时间
  function shouldHideHourLabel(hour: number) {
    const now = new Date();
    const currentHour = now.getHours();
    const minutes = now.getMinutes();

    // 如果分钟数超过45，隐藏下一个整点时间
    if (minutes > 45 && hour === currentHour + 1) {
      return true;
    }

    // 如果分钟数小于15，隐藏上一个整点时间
    if (minutes < 15 && hour === currentHour) {
      return true;
    }

    return false;
  }

  return {
    handleHourClick,
    handleWeekDrop,
    handleWeekEventResize,
    calculateCurrentTimeLine,
    getCurrentTimeText,
    shouldHideHourLabel,
  };
};
