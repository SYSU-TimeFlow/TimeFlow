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
  const previousTodo = ref({
    id: 0,
    title: "",
    dueDate: new Date(),
    completed: false,
    addToCalendar: false,
  });
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
    let list: TodoItem[];
    switch (activeFilter.value) {
      case "completed":
        list = completedTodos.value;
        break;
      case "active":
        list = activeTodos.value;
        break;
      default:
        list = allTodos.value;
    }
    // 优先显示未完成事项，并在各自组内按截止日期升序排序
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // 未完成在前
      }
      return a.dueDate.getTime() - b.dueDate.getTime(); // 截止日期升序
    });
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

  function addTodo(title: string, dueDate: Date, addToCalendar: boolean = false) {
    const newTodo = new TodoItem(
      Date.now(),
      title,
      setTimeToEndOfDay(dueDate),
      false,
      addToCalendar,
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
        } else {
          // 如果用户选择不删除日历中的事件，则需要将该事件的 addToTodo 属性设置为 false
          eventStore.events[eventIndex].addToTodo = false;
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
    previousTodo.value.title = "";
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
    // 备份 todo 事项的原始值，以便查找到关联的事件，否则修改后就搜索不到
    previousTodo.value = todo;

    showTodoModal.value = true;
  };

  const closeEditModal = () => {
    showTodoModal.value = false;
  };

  const saveNewTodo = () => {
    // 将时间设置为23:59:59
    const dueDate = new Date(currentEditingTodo.value.dueDate); // 确保将字符串转换为 Date 类型
    dueDate.setHours(23, 59, 59, 0);
    const newTodo = addTodo(currentEditingTodo.value.title, dueDate, currentEditingTodo.value.addToCalendar);
    // 如果用户选择了添加到日历，则创建事件
    if (currentEditingTodo.value.addToCalendar) {
      const eventStore = useEventStore();
      eventStore.addEvent(newTodo.title, dueDate, dueDate);
    }
  };

  const saveEdit = () => {
    // 将时间设置为23:59:59
    const dueDate = new Date(currentEditingTodo.value.dueDate); // 确保将字符串转换为 Date 类型
    const todo = new TodoItem(
      previousTodo.value.id,
      currentEditingTodo.value.title,
      dueDate,
      currentEditingTodo.value.completed,
      currentEditingTodo.value.addToCalendar
    );

    if (isNewTodo.value) {
      saveNewTodo();
    } else {
      // 先根据previousTodo, 检查日历中有没有关联的事件
      const eventStore = useEventStore();
      const eventIndex = eventStore.events.findIndex(
        (event) =>
          previousTodo.value.title === event.title &&
          previousTodo.value.dueDate.getDate() === event.end.getDate()
      );

      // 更新todo
      updateTodo(todo.id, {
        title: todo.title,
        dueDate: dueDate,
        completed: todo.completed,
        addToCalendar: todo.addToCalendar,
      });
      if (currentEditingTodo.value.addToCalendar) {
        if (eventIndex !== -1) {
          // 如果找到关联事件，则更新事件
          eventStore.events[eventIndex].title = todo.title;
          eventStore.events[eventIndex].start = dueDate;
          eventStore.events[eventIndex].end = dueDate;
          eventStore.events[eventIndex].addToTodo =
            currentEditingTodo.value.addToCalendar;
        } else {
          // 如果上一步没有找到关联事件，且用户选择了添加到日历，则添加新的事件
          eventStore.addEvent(todo.title, dueDate, dueDate);
        }
      }
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
    previousTodo,
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
