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

export const useTodoStore = defineStore("todo", () => {
  // 状态
  const todos = ref<TodoItem[]>([
    new TodoItem(1, "完成项目报告", new Date("2025-05-24"), false),
    new TodoItem(2, "购买办公用品", new Date("2025-05-23"), true),
    new TodoItem(3, "团队会议准备", new Date("2025-05-22"), false),
  ]);

  const nextId = ref(4); // 下一个可用的ID

  // Getter
  const allTodos = computed(() => todos.value);
  const completedTodos = computed(() =>
    todos.value.filter((todo) => todo.completed)
  );
  const activeTodos = computed(() =>
    todos.value.filter((todo) => !todo.completed)
  );

  const getTodoById = (id: number) => {
    return todos.value.find((todo) => todo.id === id);
  };

  // Actions
  const addTodo = (title: string, dueDate: Date) => {
    const newTodo = new TodoItem(nextId.value++, title, dueDate, false);
    todos.value.push(newTodo);
    return newTodo;
  };

  const removeTodo = (id: number) => {
    const index = todos.value.findIndex((todo) => todo.id === id);
    if (index !== -1) {
      todos.value.splice(index, 1);
    }
  };

  const toggleTodo = (id: number) => {
    const todo = todos.value.find((todo) => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  const updateTodo = (id: number, updates: Partial<TodoItem>) => {
    const todo = todos.value.find((todo) => todo.id === id);
    if (todo) {
      Object.assign(todo, updates);
    }
  };

  const clearCompleted = () => {
    todos.value = todos.value.filter((todo) => !todo.completed);
  };

  return {
    todos,
    nextId,
    allTodos,
    completedTodos,
    activeTodos,
    getTodoById,
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodo,
    clearCompleted,
  };
});
