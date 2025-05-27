import { computed } from "vue";
import { useEventStore } from "../../event";
import { getStartOfWeek, getEndOfWeek } from "../../../utils";

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export const createMonthModule = (storeContext: any) => {
  const { currentDate, selectedDate, draggedEvent } = storeContext;

  // 月视图的日期格子数据
  const calendarDays = computed(() => {
    const days: CalendarDay[] = [];
    const monthStart = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + 1,
      0
    );
    const startDate = getStartOfWeek(monthStart);
    const endDate = getEndOfWeek(monthEnd);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const isCurrentMonth =
        currentDay.getMonth() === currentDate.value.getMonth();
      const isToday = currentDay.getTime() === today.getTime();
      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;

      days.push({
        date: new Date(currentDay),
        dayNumber: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        isWeekend,
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return days;
  });

  function handleDayClick(day: any, isAddEvent = false) {
    const eventStore = useEventStore();

    if (day.isCurrentMonth) {
      currentDate.value = new Date(day.date);
      selectedDate.value = new Date(day.date);
      if (isAddEvent) {
        const startDate = new Date(day.date);
        startDate.setHours(9, 0, 0, 0);
        eventStore.openNewEventModal(startDate);
      }
    }
  }

  function handleDrop(event: DragEvent, day: any) {
    const eventStore = useEventStore();

    if (draggedEvent.value && event.dataTransfer) {
      const eventId = parseInt(event.dataTransfer.getData("text/plain"));
      const eventIndex = eventStore.events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        const originalEvent = eventStore.events[eventIndex];
        
        // 检查是否为待办类型事件（both类型且无实际开始时间）
        if (originalEvent.eventType === 'both' && new Date(originalEvent.start).getFullYear() <= 1970) {
          // 对于待办类型，只修改截止日期(end)，保持相同的时间点
          const originalEnd = new Date(originalEvent.end);
          const newEnd = new Date(day.date);
          newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes());
          
          eventStore.events[eventIndex] = {
            ...originalEvent,
            end: newEnd
          };
        } else {
          // 普通事件的原有处理逻辑
          const originalStart = new Date(originalEvent.start);
          const originalEnd = new Date(originalEvent.end);
          const duration = originalEnd.getTime() - originalStart.getTime();

          const newStart = new Date(day.date);
          newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
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
    calendarDays,
    handleDayClick,
    handleDrop,
  };
};