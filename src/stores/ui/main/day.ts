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
    return hour >= 0 && hour < 24 && (minute === 0 || minute === 30);
  }

  // 检查时间变化是否足够大
  function isTimeChangeSignificant(originalTime: Date, newTime: Date): boolean {
    const timeDiff = Math.abs(newTime.getTime() - originalTime.getTime());
    // 如果时间差超过15分钟（900000毫秒），则认为变化显著
    return timeDiff >= 900000;
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

        // 检查是否为待办类型事件
        if (
          originalEvent.eventType === "both" &&
          new Date(originalEvent.start).getFullYear() <= 1970
        ) {
          // 对于待办类型，修改截止日期(end)和时间
          const newEnd = new Date(day.date);
          newEnd.setHours(hour, minute, 0, 0);

          // 检查时间变化是否显著
          if (!isTimeChangeSignificant(new Date(originalEvent.end), newEnd)) {
            event.preventDefault();
            return;
          }

          // 检查是否与现有事件重叠（排除当前事件）
          const hasOverlap = eventStore.events.some(
            (e) =>
              e.id !== originalEvent.id &&
              e.eventType !== "both" && // 只检查与普通事件的重叠
              ((newEnd >= new Date(e.start) && newEnd < new Date(e.end)) ||
                (newEnd > new Date(e.start) && newEnd <= new Date(e.end)) ||
                (newEnd <= new Date(e.start) && newEnd >= new Date(e.end)))
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

          // 检查时间变化是否显著
          if (!isTimeChangeSignificant(originalStart, newStart)) {
            event.preventDefault();
            return;
          }

          // 检查是否与现有事件重叠（排除当前事件）
          const hasOverlap = eventStore.events.some(
            (e) =>
              e.id !== originalEvent.id &&
              e.eventType !== "both" && // 只检查与普通事件的重叠
              ((newStart >= new Date(e.start) && newStart < new Date(e.end)) ||
                (newEnd > new Date(e.start) && newEnd <= new Date(e.end)) ||
                (newStart <= new Date(e.start) && newEnd >= new Date(e.end)))
          );

          // 如果新位置与当前位置不同，则更新事件
          if (!hasOverlap) {
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

  // 向上移动事件30分钟
  function moveEventUp(event: any) {
    const eventStore = useEventStore();
    const eventIndex = eventStore.events.findIndex((e) => e.id === event.id);
    if (eventIndex !== -1) {
      const originalEvent = eventStore.events[eventIndex];

      // 如果是待办事件，只修改结束时间
      if (originalEvent.eventType === "both") {
        const end = new Date(originalEvent.end);

        // 检查是否可以向上移动（不能早于0点）
        if (end.getHours() === 0 && end.getMinutes() === 0) {
          return;
        }

        // 移动结束时间
        end.setMinutes(end.getMinutes() - 30);

        // 检查是否与现有事件重叠（只检查与普通事件的重叠）
        const hasOverlap = eventStore.events.some(
          (e) =>
            e.id !== originalEvent.id &&
            e.eventType !== "both" && // 只检查与普通事件的重叠
            ((end >= new Date(e.start) && end < new Date(e.end)) ||
              (end > new Date(e.start) && end <= new Date(e.end)) ||
              (end <= new Date(e.start) && end >= new Date(e.end)))
        );

        if (!hasOverlap) {
          eventStore.events[eventIndex] = {
            ...originalEvent,
            end: end,
          };
        }
      } else {
        // 普通事件的原有处理逻辑
        const start = new Date(originalEvent.start);
        const end = new Date(originalEvent.end);

        // 检查是否可以向上移动（不能早于0点）
        if (start.getHours() === 0 && start.getMinutes() === 0) {
          return;
        }

        // 移动开始和结束时间
        start.setMinutes(start.getMinutes() - 30);
        end.setMinutes(end.getMinutes() - 30);

        // 检查是否与现有事件重叠（只检查与普通事件的重叠）
        const hasOverlap = eventStore.events.some(
          (e) =>
            e.id !== originalEvent.id &&
            e.eventType !== "both" && // 只检查与普通事件的重叠
            ((start >= new Date(e.start) && start < new Date(e.end)) ||
              (end > new Date(e.start) && end <= new Date(e.end)) ||
              (start <= new Date(e.start) && end >= new Date(e.end)))
        );

        if (!hasOverlap) {
          eventStore.events[eventIndex] = {
            ...originalEvent,
            start: start,
            end: end,
          };
        }
      }
    }
  }

  // 向下移动事件30分钟
  function moveEventDown(event: any) {
    const eventStore = useEventStore();
    const eventIndex = eventStore.events.findIndex((e) => e.id === event.id);
    if (eventIndex !== -1) {
      const originalEvent = eventStore.events[eventIndex];

      // 如果是待办事件，只修改结束时间
      if (originalEvent.eventType === "both") {
        const end = new Date(originalEvent.end);

        // 检查是否可以向下移动（不能晚于23:30）
        if (end.getHours() === 23 && end.getMinutes() === 30) {
          return;
        }

        // 移动结束时间
        end.setMinutes(end.getMinutes() + 30);

        // 检查是否与现有事件重叠（只检查与普通事件的重叠）
        const hasOverlap = eventStore.events.some(
          (e) =>
            e.id !== originalEvent.id &&
            e.eventType !== "both" && // 只检查与普通事件的重叠
            ((end >= new Date(e.start) && end < new Date(e.end)) ||
              (end > new Date(e.start) && end <= new Date(e.end)) ||
              (end <= new Date(e.start) && end >= new Date(e.end)))
        );

        if (!hasOverlap) {
          eventStore.events[eventIndex] = {
            ...originalEvent,
            end: end,
          };
        }
      } else {
        // 普通事件的原有处理逻辑
        const start = new Date(originalEvent.start);
        const end = new Date(originalEvent.end);

        // 检查是否可以向下移动（不能晚于23:30）
        if (end.getHours() === 23 && end.getMinutes() === 30) {
          return;
        }

        // 移动开始和结束时间
        start.setMinutes(start.getMinutes() + 30);
        end.setMinutes(end.getMinutes() + 30);

        // 检查是否与现有事件重叠（只检查与普通事件的重叠）
        const hasOverlap = eventStore.events.some(
          (e) =>
            e.id !== originalEvent.id &&
            e.eventType !== "both" && // 只检查与普通事件的重叠
            ((start >= new Date(e.start) && start < new Date(e.end)) ||
              (end > new Date(e.start) && end <= new Date(e.end)) ||
              (start <= new Date(e.start) && end >= new Date(e.end)))
        );

        if (!hasOverlap) {
          eventStore.events[eventIndex] = {
            ...originalEvent,
            start: start,
            end: end,
          };
        }
      }
    }
  }

  return {
    dayViewEvents,
    handleHourClick,
    handleDropDay,
    calculateDragOffset,
    moveEventUp,
    moveEventDown,
  };
};
