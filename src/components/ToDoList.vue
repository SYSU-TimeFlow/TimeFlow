<!--
  @description 待办事项列表。
  在新建 events 时，也可以同时添加到 Todo List 中。
  新建 todo 事项时，用户也可以手动选择将 todo 事项添加到日历，实现日历与待办事项的同步。
-->
<template>
  <div class="min-h-screen bg-gray-50 p-6 w-full">
    <div class="max-w-2xl mx-auto flex flex-col items-center">
      <!-- 标题 -->
      <h1 class="text-3xl font-bold text-indigo-600 text-center mb-10">
        To-Do
      </h1>
      <div v-if="allTodos.length === 0" class="text-gray-400 text-center py-12">
        <i class="fas fa-inbox text-3xl mb-2"></i>
        <div>暂无待办事项</div>
      </div>

      <!-- 新建 Todo 事项的表单 - 宽度与列表一致 -->
      <div class="w-full flex gap-3 mb-12 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >任务标题
          </label>
          <input
            v-model="newTodoTitle"
            placeholder="输入待办事项标题"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            @keyup.enter="addNewTodo"
          />
        </div>
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
        <button
          @click="addNewTodo"
          class="bg-sky-400 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-[12px] transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
        >
          <i class="fas fa-plus text-lg"></i>
          <span>添加</span>
        </button>
      </div>

      <!-- 待办事项列表 -->
      <div class="w-full space-y-4">
        <div
          v-for="todo in allTodos"
          :key="todo.id"
          @click="toggleTodo(todo.id)"
          class="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border-l-4"
          :class="{
            'border-red-400': todo.id % 3 === 0,
            'border-orange-400': todo.id % 3 === 1,
            'border-green-400': todo.id % 3 === 2,
            'opacity-70 bg-gray-50': todo.completed,
          }"
        >
          <div class="flex items-center gap-4">
            <input
              type="checkbox"
              :checked="todo.completed"
              @click.stop="toggleTodo(todo.id)"
              class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div>
              <div
                class="font-medium"
                :class="{ 'line-through text-gray-500': todo.completed }"
              >
                {{ todo.title }}
              </div>
              <div class="text-sm text-gray-500">
                {{ formatDate(todo.dueDate) }}
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click.stop="openEditModal(todo)"
              class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
            >
              <i class="fas fa-pen fa-sm"></i>
            </button>

            <button
              @click.stop="removeTodo(todo.id)"
              class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <!-- 实心垃圾桶图标 -->
              <i class="fas fa-trash-alt fa-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑模态框 -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- 高斯模糊背景 -->
      <div
        class="absolute inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm"
        @click="closeEditModal"
      ></div>

      <!-- 模态框内容 -->
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold text-indigo-600 mb-4">编辑待办事项</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >任务标题
            </label>
            <input
              v-model="editingTodo.title"
              class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >截止日期
            </label>
            <input
              v-model="editingTodo.dueDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              @click="closeEditModal"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              取消
            </button>
            <button
              @click="saveEdit"
              class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition"
            >
              保存
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
  newTodoDueDate.value = formatDateForInput(today);
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

// 将日期格式化为 YYYY/MM/DD hh:mm 格式
const formatDate = (date: Date) => {
  return (
    date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }) + " 23:59"
  );
};

// 将日期格式化为 YYYY-MM-DD 格式，以便用户选择或输入日期。
const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
</script>
