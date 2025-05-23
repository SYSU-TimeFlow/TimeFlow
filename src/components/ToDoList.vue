<template>
  <div class="todo-list p-8 max-w-7xl mx-auto">
    <h2 class="text-2xl font-semibold mb-4">ToDo 任务列表</h2>
    <!-- 表单 -->
    <form
      @submit.prevent="handleAdd"
      class="bg-gray-50 p-8 rounded mb-8 shadow flex flex-wrap gap-x-8 gap-y-4"
    >
      <div class="flex flex-col min-w-[180px]">
        <label class="text-sm mb-1">类别</label>
        <select v-model="form.categoryId" required class="border rounded px-4 py-2">
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>
      <div class="flex flex-col min-w-[220px] flex-1">
        <label class="text-sm mb-1">标题</label>
        <input v-model="form.title" required class="border rounded px-4 py-2" />
      </div>
      <div class="flex flex-col min-w-[220px]">
        <label class="text-sm mb-1">开始时间</label>
        <input v-model="form.start" type="datetime-local" required class="border rounded px-4 py-2" />
      </div>
      <div class="flex flex-col min-w-[220px]">
        <label class="text-sm mb-1">结束时间</label>
        <input v-model="form.end" type="datetime-local" required class="border rounded px-4 py-2" />
      </div>
      <!-- 内容输入框单独一行，占满宽度 -->
      <div class="flex flex-col w-full mt-2">
        <label class="text-sm mb-1">内容</label>
        <textarea v-model="form.description" rows="2" class="border rounded px-4 py-2 resize-none" />
      </div>
      <!-- 按钮和同步到日历选项单独一行，居左排列 -->
      <div class="flex items-center w-full mt-2 gap-x-6">
        <div class="flex items-center">
          <input type="checkbox" v-model="form.addToCalendar" id="addToCalendar" class="mr-2" />
          <label for="addToCalendar" class="text-sm">同步到日历</label>
        </div>
        <button
          type="submit"
          class="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700"
        >
          添加
        </button>
      </div>
    </form>
    <!-- ToDo 列表 -->
    <div v-if="todos.length === 0" class="text-gray-400">暂无待办事项</div>
    <ul>
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="flex items-center mb-3 p-3 bg-gray-50 rounded shadow-sm"
      >
        <!-- 完成勾选框 -->
        <input
          type="checkbox"
          :checked="todo.completed"
          class="mr-3"
          @change="toggleTodo(todo.id)"
        />
        <div class="font-medium" :class="{ 'line-through text-gray-400': todo.completed }">
          {{ todo.title }}
        </div>
        <div class="flex-1">
          <div class="text-xs text-gray-500">
            <span v-if="isAllDay(todo.start, todo.end)">全天</span>
            <span v-else>
              {{ formatDate(todo.start) }} ~ {{ formatDate(todo.end) }}
            </span>
            <span v-if="todo.categoryName" :style="{ color: todo.categoryColor }" class="ml-2">
              [{{ todo.categoryName }}]
            </span>
          </div>
          <div class="text-xs text-gray-600">{{ todo.description }}</div>
        </div>
        <!-- 添加到日历选项 -->
        <div class="flex items-center mr-4">
          <input
            type="checkbox"
            :checked="todo.addToCalendar"
            @change="toggleSyncToCalendar(todo)"
            :id="'sync-'+todo.id"
            class="mr-1"
          />
          <label :for="'sync-'+todo.id" class="text-xs">同步到日历</label>
        </div>
        <button
          class="ml-3 text-red-500 hover:text-red-700"
          @click="deleteTodo(todo.id)"
        >
          <i class="fas fa-trash"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from "vue";

const props = defineProps({
  todos: Array,
  categories: Array,
});
const emit = defineEmits(["toggle-todo", "delete-todo", "add-todo", "sync-to-calendar"]);

const form = ref({
  title: "",
  description: "",
  start: "",
  end: "",
  categoryId: "",
  addToCalendar: false,
});

// 默认选中第一个类别
watch(
  () => props.categories,
  (cats) => {
    if (cats && cats.length && !form.value.categoryId) {
      form.value.categoryId = cats[0].id;
    }
  },
  { immediate: true }
);

function handleAdd() {
  // 校验必填项
  if (!form.value.title || !form.value.start || !form.value.end || !form.value.categoryId) {
    alert("请填写所有必填项！");
    return;
  }
  // 校验时间格式
  const start = new Date(form.value.start);
  const end = new Date(form.value.end);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    alert("请输入有效的开始和结束时间！");
    return;
  }
  // 校验时间先后
  if (end <= start) {
    alert("结束时间必须晚于开始时间！");
    return;
  }
  // 通过校验，添加todo
  emit("add-todo", {
    ...form.value,
    id: Date.now(),
    completed: false,
  });
  // 重置表单
  form.value = {
    title: "",
    description: "",
    start: "",
    end: "",
    categoryId: props.categories.length ? props.categories[0].id : "",
    addToCalendar: false,
  };
}

function toggleTodo(id) {
  emit("toggle-todo", id);
}
function deleteTodo(id) {
  emit("delete-todo", id);
}
function toggleSyncToCalendar(todo) {
  emit("sync-to-calendar", { ...todo, addToCalendar: !todo.addToCalendar });
}
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function isAllDay(start, end) {
  if (!start || !end) return false;
  const s = new Date(start);
  const e = new Date(end);
  // 全天：同一天，开始为00:00，结束为23:59或00:00，或结束为次日00:00
  return (
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate() &&
    s.getHours() === 0 && s.getMinutes() === 0 &&
    (
      (e.getHours() === 23 && e.getMinutes() === 59) ||
      (e.getHours() === 0 && e.getMinutes() === 0)
    )
  ) || (
    // 允许结束为次日00:00
    e - s === 24 * 60 * 60 * 1000 &&
    s.getHours() === 0 && s.getMinutes() === 0 &&
    e.getHours() === 0 && e.getMinutes() === 0
  );
}
</script>