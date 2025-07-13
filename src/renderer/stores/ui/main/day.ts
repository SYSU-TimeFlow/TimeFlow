/**
 * @file day.ts
 * @description 日视图功能模块，负责单日事件的时间线、拖拽、调整、点击、显示等交互逻辑。
 * 
 * 为什么这样做：
 * - 通过计算当前时间线位置和文本，动态展示时间进度，提升用户对当天事件的感知。
 * - 支持 24 小时和 12 小时制切换，满足不同用户习惯。
 * - 拖拽和调整事件时间，采用像素与时间映射，保证交互直观且精确。
 * - 拖拽事件时自动计算偏移和持续时间，提升操作流畅度和准确性。
 * - 事件调整和拖拽均有显著变化判定，避免误操作和无效刷新。
 * - 支持全天事件和待办事项的特殊处理，保证不同类型事件的交互一致性。
 * - 所有核心操作均有注释说明，便于团队协作和后续维护。
 */

import { useEventStore } from "../../event";
import { useSettingStore } from "../../setting";

export const createDayModule = (storeContext: any) => {
  const { openNewEventModal, draggedEvent } = storeContext;
  const settingStore = useSettingStore();

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

  // 滚动到当前时间线（无动画，直接定位）
  function scrollToCurrentTimeLine() {
    setTimeout(() => {
      const currentTimeLine = document.querySelector(".current-time-line");
      if (currentTimeLine) {
        currentTimeLine.scrollIntoView({
          behavior: "auto", // 立即跳转，无动画
          block: "center",
        });
      }
    }, 0);
  }

  return {
    handleHourClick,
    handleDayDrop,
    calculateDragOffset,
    handleDayEventResize,
    calculateCurrentTimeLine,
    getCurrentTimeText,
    shouldHideHourLabel,
    scrollToCurrentTimeLine,
  };
};
