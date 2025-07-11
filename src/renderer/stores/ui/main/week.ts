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
    return (
      hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && minute % 5 === 0
    );
  }

  // 检查时间变化是否足够大
  function isTimeChangeSignificant(originalTime: Date, newTime: Date): boolean {
    const timeDiff = Math.abs(newTime.getTime() - originalTime.getTime());
    // 如果时间差超过5分钟（300000毫秒），则认为变化显著
    return timeDiff >= 300000;
  }

  function handleWeekDrop(event: DragEvent, day: any) {
    const eventStore = useEventStore();

    if (draggedEvent.value && event.dataTransfer) {
      const eventId = parseInt(event.dataTransfer.getData("text/plain"));
      const eventIndex = eventStore.events.findIndex((e) => e.id === eventId);

      if (eventIndex !== -1) {
        const originalEvent = eventStore.events[eventIndex];

        // 如果是全天事件，保持全天状态并更新日期
        if (originalEvent.allDay) {
          const newStartForAllDay = new Date(day.date);
          newStartForAllDay.setHours(0, 0, 0, 0);
          const newEndForAllDay = new Date(day.date);
          newEndForAllDay.setHours(23, 59, 59, 999);

          eventStore.events[eventIndex] = {
            ...originalEvent,
            start: newStartForAllDay,
            end: newEndForAllDay,
          };
          draggedEvent.value = null;
          return;
        }

        // 计算新的时间
        const { hour, minute } = calculateTimeFromMousePosition(event, day);

        // 检查时间是否有效
        if (!isValidTime(hour, minute)) {
          // 如果时间无效，可以选择阻止默认行为或仅清理拖拽状态
          // event.preventDefault(); // 通常在ondragover中处理以显示可拖放状态
          draggedEvent.value = null; // 清理拖拽状态
          return;
        }

        // 待办类型事件（both类型且无实际开始时间）
        if (
          originalEvent.eventType === "both" &&
          new Date(originalEvent.start).getFullYear() <= 1970
        ) {
          const newEnd = new Date(day.date); // 使用拖放目标日的日期
          newEnd.setHours(hour, minute, 0, 0); // 设置计算出的新时间

          // 检查时间变化是否显著
          if (!isTimeChangeSignificant(new Date(originalEvent.end), newEnd)) {
            draggedEvent.value = null;
            return;
          }

          eventStore.events[eventIndex] = {
            ...originalEvent,
            end: newEnd,
          };
        } else {
          // 普通事件
          const originalStart = new Date(originalEvent.start);
          const originalEnd = new Date(originalEvent.end);
          const duration = originalEnd.getTime() - originalStart.getTime();

          const newStart = new Date(day.date); // 使用拖放目标日的日期
          newStart.setHours(hour, minute, 0, 0); // 设置计算出的新时间
          const newEnd = new Date(newStart.getTime() + duration);

          // 检查时间变化是否显著 (比较日期和时间)
          if (!isTimeChangeSignificant(originalStart, newStart)) {
            // 如果仅日期变化但时间点未显著变化，也可能需要更新
            // 此处逻辑可根据需求调整，若日期变化本身就视为显著，则可移除此判断或调整isTimeChangeSignificant
            // 当前isTimeChangeSignificant只比较时间戳，所以日期变化也会触发
            if (originalStart.toDateString() === newStart.toDateString()) {
              draggedEvent.value = null;
              return;
            }
          }

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
    handleWeekDrop,
    handleWeekEventResize,
    calculateCurrentTimeLine,
    getCurrentTimeText,
    shouldHideHourLabel,
    scrollToCurrentTimeLine,
  };
};
