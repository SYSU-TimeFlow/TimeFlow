import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useEventStore = defineStore("event", () => {
  // 定义事件分类
  const categories = ref([
    { id: 1, name: "工作", color: "#4f46e5", active: true },
    { id: 2, name: "个人", color: "#10b981", active: true },
    { id: 3, name: "家庭", color: "#f59e0b", active: true },
    { id: 4, name: "健康", color: "#ef4444", active: true },
    { id: 5, name: "其他", color: "#60a5fa", active: true },
  ]);

  // 示例事件数据
  const events = ref([
    {
      id: 1,
      title: "团队会议",
      start: new Date(2025, 4, 18, 10, 0),
      end: new Date(2025, 4, 18, 11, 30),
      description: "每周团队同步",
      categoryId: 1,
      categoryColor: "#4f46e5",
      allDay: false,
      syncWithSystem: true,
    },
    {
      id: 2,
      title: "牙医预约",
      start: new Date(2025, 4, 20, 14, 0),
      end: new Date(2025, 4, 20, 15, 0),
      description: "常规检查",
      categoryId: 4,
      categoryColor: "#ef4444",
      allDay: false,
      syncWithSystem: true,
    },
    {
      id: 3,
      title: "生日派对",
      start: new Date(2025, 4, 22, 18, 0),
      end: new Date(2025, 4, 22, 22, 0),
      description: "John的生日庆祝",
      categoryId: 3,
      categoryColor: "#f59e0b",
      allDay: false,
      syncWithSystem: true,
    },
    {
      id: 4,
      title: "项目截止日期",
      start: new Date(2025, 4, 25, 0, 0),
      end: new Date(2025, 4, 25, 23, 59),
      description: "Q2项目最终提交",
      categoryId: 1,
      categoryColor: "#4f46e5",
      allDay: true,
      syncWithSystem: true,
    },
    {
      id: 5,
      title: "健身房锻炼",
      start: new Date(2025, 4, 19, 7, 0),
      end: new Date(2025, 4, 19, 8, 30),
      description: "晨间锻炼",
      categoryId: 4,
      categoryColor: "#ef4444",
      allDay: false,
      syncWithSystem: false,
    },
  ]);

  // 事件模态框状态管理
  const showEventModal = ref(false);
  const isNewEvent = ref(true);
  const currentEvent = ref({
    id: 0,
    title: "",
    start: "",
    end: "",
    description: "",
    categoryId: 1,
    categoryColor: "#4f46e5",
    allDay: false,
    syncWithSystem: true,
  });

  // 获取指定日期的所有事件
  function getEventsForDay(date: Date): any[] {
    const activeCategoryIds = categories.value
      .filter((category) => category.active)
      .map((category) => category.id);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return events.value
      .filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        // 先检查事件日期是否符合条件
        const dateMatches =
          (eventStart >= start && eventStart <= end) || // 条件1
          (eventEnd >= start && eventEnd <= end) || // 条件2
          (eventStart <= start && eventEnd >= end); // 条件3
        // 再检查事件分类是否被选中
        const categoryMatches = activeCategoryIds.includes(event.categoryId);
        // 同时满足日期和分类两个条件
        return dateMatches && categoryMatches;
      })
      .sort((a, b) => {
        const aStart = new Date(a.start).getTime();
        const bStart = new Date(b.start).getTime();
        if (aStart === bStart) {
          return new Date(a.end).getTime() - new Date(b.end).getTime();
        }
        return aStart - bStart;
      });
  }

  // 格式化事件的开始和结束时间
  function formatEventTime(event: any): string {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  // 格式化日期对象为时间字符串
  function formatTime(date: Date): string {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  // 将 Date 对象格式化为 datetime-local input 所需的字符串格式
  function formatDateTimeForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // 打开新建事件模态框
  function openNewEventModal(start?: Date, end?: Date) {
    isNewEvent.value = true;
    const startDate = start || new Date();
    if (!start) startDate.setHours(9, 0, 0, 0);
    const endDate = end || new Date(startDate);
    if (!end) endDate.setHours(startDate.getHours() + 1, 0, 0, 0);

    currentEvent.value = {
      id: Date.now(),
      title: "",
      start: formatDateTimeForInput(startDate),
      end: formatDateTimeForInput(endDate),
      description: "",
      categoryId: categories.value.length > 0 ? categories.value[0].id : 1,
      categoryColor:
        categories.value.length > 0 ? categories.value[0].color : "#4f46e5",
      allDay: false,
      syncWithSystem: true,
    };
    showEventModal.value = true;
  }

  // 打开事件详情/编辑模态框
  function openEventDetails(event: any) {
    isNewEvent.value = false;
    currentEvent.value = {
      ...event,
      start: formatDateTimeForInput(new Date(event.start)),
      end: formatDateTimeForInput(new Date(event.end)),
    };
    showEventModal.value = true;
  }

  // 关闭事件模态框
  function closeEventModal() {
    showEventModal.value = false;
  }

  // 保存事件 (新建或更新)
  function saveEvent() {
    const eventToSave = {
      ...currentEvent.value,
      start: new Date(currentEvent.value.start),
      end: new Date(currentEvent.value.end),
    };
    if (isNewEvent.value) {
      events.value.push(eventToSave);
    } else {
      const index = events.value.findIndex((e) => e.id === eventToSave.id);
      if (index !== -1) {
        events.value[index] = eventToSave;
      }
    }
    closeEventModal();
  }

  // 删除当前模态框中的事件
  function deleteEvent() {
    const index = events.value.findIndex((e) => e.id === currentEvent.value.id);
    if (index !== -1) {
      events.value.splice(index, 1);
    }
    closeEventModal();
  }

  // 切换分类的激活状态 (用于筛选事件)
  function toggleCategory(categoryId: number) {
    const category = categories.value.find((c) => c.id === categoryId);
    if (category) {
      category.active = !category.active;
    }
  }

  return {
    events,
    categories,
    showEventModal,
    isNewEvent,
    currentEvent,
    getEventsForDay,
    formatEventTime,
    formatTime,
    formatDateTimeForInput,
    openNewEventModal,
    openEventDetails,
    closeEventModal,
    saveEvent,
    deleteEvent,
    toggleCategory,
  };
});
