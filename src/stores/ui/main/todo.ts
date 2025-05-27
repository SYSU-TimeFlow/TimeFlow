import { computed } from "vue";
import { useEventStore } from "../../event";

export const createTodoModule = (storeContext: any) => {
  const eventStore = useEventStore();

  // 获取所有待办事项
  const todoItems = computed(() => {
    return eventStore.events.filter(event => 
      event.eventType === 'both' || event.eventType === 'todo'
    );
  });

  // 获取已完成的待办事项
  const completedTodos = computed(() => {
    return todoItems.value.filter(todo => todo.completed);
  });

  // 获取未完成的待办事项
  const activeTodos = computed(() => {
    return todoItems.value.filter(todo => !todo.completed);
  });

  function toggleTodo(todoId: number) {
    const todo = eventStore.events.find(event => event.id === todoId);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  function addNewTodo() {
    eventStore.openNewTodoModal();
  }

  function editTodo(todo: any) {
    eventStore.openEditTodoModal(todo);
  }

  function deleteTodo(todoId: number) {
    const index = eventStore.events.findIndex(event => event.id === todoId);
    if (index !== -1) {
      eventStore.events.splice(index, 1);
    }
  }

  return {
    todoItems,
    completedTodos,
    activeTodos,
    toggleTodo,
    addNewTodo,
    editTodo,
    deleteTodo,
  };
};