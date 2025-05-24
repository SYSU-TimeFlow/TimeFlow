<!--
  @description 待办事项列表。
  在新建 events 时，也可以同时添加到 Todo List 中。
  新建 todo 事项时，用户也可以手动选择将 todo 事项添加到日历，实现日历与待办事项的同步。
-->
<template>
  <div class="min-h-screen bg-gray-50 p-6 w-full">
    <div class="max-w-2xl mx-auto flex flex-col items-center">
      <!-- 标题区 -->
      <h1 class="text-3xl font-bold text-indigo-600 text-center mb-10">
        To-Do
      </h1>
      <!-- 空状态提示：当没有待办事项时显示 -->
      <div
        v-if="todoStore.filteredTodos.length === 0"
        class="text-gray-400 text-center py-12"
      >
        <i class="fas fa-inbox text-3xl mb-2"></i>
        {{ todoStore.emptyStateMessage }}
      </div>

      <!-- 新建 todo 事项的表单 -->
      <div class="w-full flex gap-3 mb-12 items-end">
        <!-- 任务标题输入框 -->
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >任务标题
          </label>
          <!-- 回车键触发添加 todo -->
          <input
            v-model="newTodoTitle"
            placeholder="输入待办事项标题"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            @keyup.enter="addNewTodo"
          />
        </div>

        <!-- 截止日期选择器 -->
        <div class="min-w-[180px]">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >截止日期
          </label>
          <input
            v-model="newTodoDueDate"
            type="date"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <!-- 添加按钮 -->
        <button
          @click="addNewTodo"
          class="bg-sky-400 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-[12px] transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
        >
          <i class="fas fa-plus text-lg"></i>
          <span>添加</span>
        </button>
      </div>

      <!-- 过滤选项 -->
      <div class="w-full mb-6 flex justify-center gap-4">
        <button
          v-for="filter in todoStore.filters"
          :key="filter.value"
          @click="todoStore.setFilter(filter.value)"
          class="px-4 py-2 rounded-xl transition"
          :class="{
            'bg-indigo-600 text-white': todoStore.activeFilter === filter.value,
            'bg-gray-100 text-gray-700 hover:bg-gray-200':
              todoStore.activeFilter !== filter.value,
          }"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- 待办事项列表 -->
      <div class="w-full space-y-4">
        <div
          v-for="todo in todoStore.filteredTodos"
          :key="todo.id"
          @click="todoStore.toggleTodo(todo.id)"
          class="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border-l-4"
          :class="{
            'border-red-400': todo.id % 3 === 0,
            'border-orange-400': todo.id % 3 === 1,
            'border-green-400': todo.id % 3 === 2,
            'opacity-70 bg-gray-50': todo.completed,
          }"
        >
          <div class="flex items-center gap-4">
            <!-- 完成状态复选框 -->
            <input
              type="checkbox"
              :checked="todo.completed"
              @click.stop="todoStore.toggleTodo(todo.id)"
              class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div>
              <!-- 任务标题 - 完成时显示删除线 -->
              <div
                class="font-medium"
                :class="{ 'line-through text-gray-500': todo.completed }"
              >
                {{ todo.title }}
              </div>
              <!-- 格式化显示的截止日期 -->
              <div class="text-sm text-gray-500">
                {{ todoStore.formatDateForDisplay(todo.dueDate) }}
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <!-- 编辑按钮 -->
            <button
              @click.stop="openEditModal(todo)"
              class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
            >
              <i class="fas fa-pen fa-sm"></i>
            </button>

            <!-- 删除按钮 -->
            <button
              @click.stop="removeTodo(todo.id)"
              class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <i class="fas fa-trash-alt fa-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTodoStore } from "../stores/todoStore";
import { storeToRefs } from "pinia";

const todoStore = useTodoStore();
const { allTodos } = storeToRefs(todoStore);
const { addTodo, removeTodo, toggleTodo, updateTodo } = todoStore;

const newTodoTitle = ref("");
// 默认设置为当天23:59:59
const newTodoDueDate = ref("");

// 设置默认日期为当天24点
const setDefaultDueDate = () => {
  const today = new Date();
  today.setHours(23, 59, 59, 0);
  newTodoDueDate.value = todoStore.formatDateForInput(today);
};

// 编辑相关状态
const showEditModal = ref(false);
const editingTodo = ref({
  id: 0,
  title: "",
  dueDate: "",
  completed: false,
});

onMounted(() => {
  setDefaultDueDate();
});

const addNewTodo = () => {
  if (newTodoTitle.value.trim() && newTodoDueDate.value) {
    // 将时间设置为23:59:59
    const dueDate = new Date(newTodoDueDate.value);
    dueDate.setHours(23, 59, 59, 0);

    addTodo(newTodoTitle.value, dueDate);
    newTodoTitle.value = "";
    setDefaultDueDate(); // 重置为默认日期
  }
};

const openEditModal = (todo: TodoItem) => {
  editingTodo.value = {
    id: todo.id,
    title: todo.title,
    dueDate: formatDateForInput(todo.dueDate),
    completed: todo.completed,
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const saveEdit = () => {
  // 将时间设置为23:59:59
  const dueDate = new Date(editingTodo.value.dueDate);
  dueDate.setHours(23, 59, 59, 0);

  updateTodo(editingTodo.value.id, {
    title: editingTodo.value.title,
    dueDate: dueDate,
  });
  closeEditModal();
};
</script>
