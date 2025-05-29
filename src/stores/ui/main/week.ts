import { computed } from "vue";
import { useEventStore } from "../../event";
import { getStartOfWeek } from "../../../utils";
import { WeekViewDay, weekDays } from "../../../const";

export const createWeekModule = (storeContext: any) => {
  const { currentDate, openNewEventModal } = storeContext;

  // 获取周视图日期数据
  const weekViewDays = computed(() => {
    const eventStore = useEventStore();
    const days: WeekViewDay[] = [];
    const startOfWeek = getStartOfWeek(currentDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const isToday = day.getTime() === today.getTime();
      days.push({
        date: new Date(day),
        dayName: weekDays[day.getDay()].substring(0, 3),
        dayNumber: day.getDate(),
        isToday,
        events: eventStore.getEventsForDay(day),
      });
    }
    return days;
  });

  function handleHourClick(day: any, hour: number) {
    const date = new Date(day.date);
    date.setHours(hour, 0, 0, 0);
    openNewEventModal(date);
  }

  return {
    weekViewDays,
    handleHourClick,
  };
};
