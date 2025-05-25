import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useEventStore } from "./event";

export class TodoItem {
  constructor(
    public id: number,
    public title: string,
    public dueDate: Date,
    public completed: boolean,
    public addToCalendar: boolean = false
  ) {}
}

// 将 todo 事项分三类
type FilterType = "all" | "completed" | "active";

interface TodoFilter {
  value: FilterType;
  label: string;
  count: number;
}

export const useTodoStore = defineStore("todo", () => {
  // 示例数据
  const todos = ref<TodoItem[]>([
    new TodoItem(
      1,
      "完成项目报告",
      setTimeToEndOfDay(new Date("2025-05-24")),
      false
    ),
    new TodoItem(
      2,
      "购买办公用品",
      setTimeToEndOfDay(new Date("2025-05-23")),
      true
    ),
    new TodoItem(
      3,
      "准备团队会议",
      setTimeToEndOfDay(new Date("2025-05-22")),
      false
    ),
  ]);

  const activeFilter = ref<FilterType>("all");
  // 定义所有的过滤器
  const filters = computed<TodoFilter[]>(() => [
    {
      value: "all",
      label: "全部",
      count: todos.value.length,
    },
    {
      value: "active",
      label: "未完成",
      count: todos.value.filter((t) => !t.completed).length,
    },
    {
      value: "completed",
      label: "已完成",
      count: todos.value.filter((t) => t.completed).length,
    },
  ]);

  // 待办事项模态框的状态管理
  const showTodoModal = ref(false);
  const isNewTodo = ref(true);
  const currentEditingTodo = ref({
    id: 0,
    title: "",
    dueDate: "",
    completed: false,
    addToCalendar: false,
  });

  // Getters
  const allTodos = computed(() => todos.value);
  const completedTodos = computed(() =>
    todos.value.filter((todo) => todo.completed)
  );
  const activeTodos = computed(() =>
    todos.value.filter((todo) => !todo.completed)
  );

  const filteredTodos = computed(() => {
    switch (activeFilter.value) {
      case "completed":
        return completedTodos.value;
      case "active":
        return activeTodos.value;
      default:
        return allTodos.value;
    }
  });

  const emptyStateMessage = computed(() => {
    switch (activeFilter.value) {
      case "completed":
        return "暂无已完成事项";
      case "active":
        return "暂无未完成事项";
      default:
        return todos.value.length === 0 ? "暂无待办事项，请添加" : "";
    }
  });

  // Actions
  function addTodo(title: string, dueDate: Date) {
    const newTodo = new TodoItem(
      Date.now(),
      title,
      setTimeToEndOfDay(dueDate),
      false
    );
    todos.value.push(newTodo);
    return newTodo;
  }

  function removeTodo(id: number) {
    const index = todos.value.findIndex((todo) => todo.id === id);
    if (index !== -1) {
      const todo = todos.value[index];
      const eventStore = useEventStore();
      const eventIndex = eventStore.events.findIndex(
        (event) =>
          event.title === todo.title &&
          event.end.getDate() === todo.dueDate.getDate()
      );
      if (eventIndex !== -1) {
        if (confirm("是否同时删除日历中的同名日程？")) {
          eventStore.events.splice(eventIndex, 1);
        }
      }
      todos.value.splice(index, 1);
    }
  }

  // 切换todo事项的完成状态
  function toggleTodo(id: number) {
    const todo = todos.value.find((todo) => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  function updateTodo(id: number, updates: Partial<TodoItem>) {
    const todo = todos.value.find((todo) => todo.id === id);
    if (todo) {
      if (updates.dueDate) {
        updates.dueDate = setTimeToEndOfDay(updates.dueDate);
      }
      Object.assign(todo, updates);
    }
  }

  function setFilter(filter: FilterType) {
    activeFilter.value = filter;
  }

  // 设置默认日期为当天24点
  const setDefaultDueDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 0);
    currentEditingTodo.value.dueDate = formatDateForInput(today);
  };

  // 打开模态框，新建 todo 事项
  const openNewTodoModal = () => {
    isNewTodo.value = true;
    currentEditingTodo.value.title = "";
    setDefaultDueDate(); // 重置为默认日期
    showTodoModal.value = true;
  };

  // 打开模态框，编辑已有的 todo 事项
  const openEditModal = (todo: TodoItem) => {
    isNewTodo.value = false;
    currentEditingTodo.value = {
      id: todo.id,
      title: todo.title,
      dueDate: formatDateForInput(todo.dueDate),
      completed: todo.completed,
      addToCalendar: todo.addToCalendar,
    };

    showTodoModal.value = true;
  };

  const syncTodoWithCalendar = (todo: TodoItem) => {
    const eventStore = useEventStore();
    const eventIndex = eventStore.events.findIndex(
      (event) =>
        event.title === todo.title &&
        event.end.getDate() === todo.dueDate.getDate()
    );
    // 如果日历中没有该事项且已选中添加到日历，则添加
    if (eventIndex === -1 && todo.addToCalendar) {
      eventStore.events.push({
        id: eventStore.events.length + 1,
        title: todo.title,
        start: todo.dueDate,
        end: todo.dueDate,
        description: "",
        categoryId: 5, // 默认分类
        categoryColor: "#60a5fa",
        allDay: true,
        addToTodo: true,
      });
    }
  };

  const closeEditModal = () => {
    showTodoModal.value = false;
  };

  const saveEdit = () => {
    // 将时间设置为23:59:59
    const dueDate = new Date(currentEditingTodo.value.dueDate); // 确保将字符串转换为 Date 类型
    dueDate.setHours(23, 59, 59, 0);

    if (isNewTodo.value) {
      const newTodo = addTodo(currentEditingTodo.value.title, dueDate);
      if (currentEditingTodo.value.addToCalendar) {
        const eventStore = useEventStore();
        eventStore.addEvent({
          id: newTodo.id,
          title: newTodo.title,
          start: dueDate,
          end: dueDate,
          description: "",
          categoryId: 5, // 默认分类
          categoryColor: "#60a5fa",
          allDay: true,
          addToTodo: true,
        });
      }
    } else {
      updateTodo(currentEditingTodo.value.id, {
        title: currentEditingTodo.value.title,
        dueDate: dueDate, // 确保传递的是 Date 类型
        addToCalendar: currentEditingTodo.value.addToCalendar,
      });
      syncTodoWithCalendar({
        ...currentEditingTodo.value,
        dueDate, // 确保传递的是 Date 类型
      });
    }
    closeEditModal();
  };

  function setTimeToEndOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 0);
    return newDate;
  }

  // 将日期格式化为 YYYY/MM/DD hh:mm 格式
  function formatDateForDisplay(date: Date): string {
    return (
      date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }) + " 23:59"
    );
  }

  // 将日期格式化为 YYYY-MM-DD 格式，以便用户选择或输入日期。
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getDefaultDueDate(): string {
    return formatDateForInput(setTimeToEndOfDay(new Date()));
  }

  return {
    // State
    todos,
    activeFilter,
    filters,
    showTodoModal,
    isNewTodo,
    currentEditingTodo,

    // Getters
    allTodos,
    completedTodos,
    activeTodos,
    filteredTodos,
    emptyStateMessage,

    // Actions
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodo,
    setFilter,
    setDefaultDueDate,
    openNewTodoModal,
    openEditModal,
    closeEditModal,
    saveEdit,

    // Helpers
    setTimeToEndOfDay,
    formatDateForDisplay,
    formatDateForInput,
    getDefaultDueDate,
  };
});
