import { defineStore } from "pinia";
import { ref, computed } from "vue";

export class TodoItem {
  constructor(
    public id: number,
    public title: string,
    public dueDate: Date,
    public completed: boolean
  ) {}
}

type FilterType = 'all' | 'completed' | 'active';

interface TodoFilter {
  value: FilterType;
  label: string;
  count: number;
}

export const useTodoStore = defineStore('todo', () => {
  // State
  const todos = ref<TodoItem[]>([
    new TodoItem(1, "完成项目报告", setTimeToEndOfDay(new Date("2025-05-24")), false),
    new TodoItem(2, "购买办公用品", setTimeToEndOfDay(new Date("2025-05-23")), true),
    new TodoItem(3, "团队会议准备", setTimeToEndOfDay(new Date("2025-05-22")), false),
  ]);
  
  const nextId = ref(4);
  const activeFilter = ref<FilterType>('all');
  // 定义所有可用的过滤器
  const filters = computed<TodoFilter[]>(() => [
    { 
      value: 'all', 
      label: '全部',
      count: todos.value.length
    },
    { 
      value: 'active', 
      label: '未完成',
      count: todos.value.filter(t => !t.completed).length
    },
    { 
      value: 'completed', 
      label: '已完成',
      count: todos.value.filter(t => t.completed).length
    }
  ]);

  // Getters
  const allTodos = computed(() => todos.value);
  const completedTodos = computed(() => todos.value.filter(todo => todo.completed));
  const activeTodos = computed(() => todos.value.filter(todo => !todo.completed));
  
  const filteredTodos = computed(() => {
    switch (activeFilter.value) {
      case 'completed': return completedTodos.value;
      case 'active': return activeTodos.value;
      default: return allTodos.value;
    }
  });

  const emptyStateMessage = computed(() => {
    switch (activeFilter.value) {
      case 'completed': return '暂无已完成事项';
      case 'active': return '暂无未完成事项';
      default: return todos.value.length === 0 ? '暂无待办事项，请添加' : '';
    }
  });

  // Actions
  function addTodo(title: string, dueDate: Date) {
    const newTodo = new TodoItem(
      nextId.value++,
      title,
      setTimeToEndOfDay(dueDate),
      false
    );
    todos.value.push(newTodo);
    return newTodo;
  }

  function removeTodo(id: number) {
    const index = todos.value.findIndex(todo => todo.id === id);
    if (index !== -1) {
      todos.value.splice(index, 1);
    }
  }

  function toggleTodo(id: number) {
    const todo = todos.value.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  function updateTodo(id: number, updates: Partial<TodoItem>) {
    const todo = todos.value.find(todo => todo.id === id);
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

  // Helper functions
  function setTimeToEndOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 0);
    return newDate;
  }

  // 将日期格式化为 YYYY/MM/DD hh:mm 格式
  function formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }) + ' 23:59';
  }

  // 将日期格式化为 YYYY-MM-DD 格式，以便用户选择或输入日期。
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDefaultDueDate(): string {
    return formatDateForInput(setTimeToEndOfDay(new Date()));
  }

  return {
    // State
    todos,
    nextId,
    activeFilter,
    filters,
    
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
    
    // Helpers
    formatDateForDisplay,
    formatDateForInput,
    getDefaultDueDate,
  };
});
