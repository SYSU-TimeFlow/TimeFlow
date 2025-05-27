import { computed } from "vue";
import { useEventStore } from "../../event";
import { getStartOfWeek } from "../../../utils";

interface WeekViewDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: any[];
}

export const createWeekModule = (storeContext: any) => {
  const { currentDate } = storeContext;

  // 获取周视图日期数据
  const weekViewDays = computed(() => {
    const eventStore = useEventStore();
    const days: WeekViewDay[] = [];
    const startOfWeek = getStartOfWeek(currentDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekDays = [
      "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"
    ];

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
    const eventStore = useEventStore();

    const date = new Date(day.date);
    date.setHours(hour, 0, 0, 0);
    eventStore.openNewEventModal(date);
  }

  return {
    weekViewDays,
    handleHourClick,
  };
};