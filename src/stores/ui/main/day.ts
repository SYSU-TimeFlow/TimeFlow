import { computed } from "vue";
import { useEventStore } from "../../event";

export const createDayModule = (storeContext: any) => {
  const { currentDate, openNewEventModal } = storeContext;

  // 获取日视图的事件数据
  const dayViewEvents = computed(() => {
    const eventStore = useEventStore();
    return eventStore.getEventsForDay(currentDate.value);
  });

  function handleHourClick(day: any, hour: number) {
    const date = new Date(day.date);
    date.setHours(hour, 0, 0, 0);
    openNewEventModal(date);
  }

  return {
    dayViewEvents,
    handleHourClick,
  };
};
