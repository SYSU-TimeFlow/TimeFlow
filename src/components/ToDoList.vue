<template>
  <div class="todo-list p-8 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-blue-700 flex items-center">
      <i class="fas fa-list-check mr-2"></i> ToDo 任务列表
    </h2>
    <div v-if="todos.length === 0" class="text-gray-400 text-center py-12">
      <i class="fas fa-inbox text-3xl mb-2"></i>
      <div>暂无待办事项</div>
    </div>
    <ul class="space-y-6">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="flex items-start gap-8 p-10 bg-white rounded-[2rem] shadow-2xl hover:shadow-3xl transition group border-4 border-blue-400"
      >
        <!-- 完成勾选框 -->
        <input
          type="checkbox"
          :checked="todo.completed"
          class="mt-2 accent-blue-600 w-7 h-7"
          @change="toggleTodo(todo.id)"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-4 mb-3">
            <span
              class="inline-block w-4 h-4 rounded-full"
              :style="{ background: todo.categoryColor || '#888' }"
            ></span>
            <span
              class="font-semibold text-2xl truncate"
              :class="{ 'line-through text-gray-400': todo.completed }"
              :title="todo.title"
            >
              {{ todo.title }}
            </span>
            <span
              v-if="todo.categoryName"
              class="ml-4 px-4 py-1 rounded-full text-sm font-bold"
              :style="{ background: todo.categoryColor + '22', color: todo.categoryColor }"
            >
              {{ todo.categoryName }}
            </span>
            <span
              v-if="todo.completed"
              class="ml-4 text-green-500 text-sm font-bold"
            >已完成</span>
          </div>
          <div class="text-base text-gray-500 mb-2">
            <span v-if="isAllDay(todo.start, todo.end)">全天</span>
            <span v-else>
              {{ formatDate(todo.start) }} ~ {{ formatDate(todo.end) }}
            </span>
          </div>
          <div class="text-lg text-gray-700 break-words mb-4">{{ todo.description }}</div>
          <div class="flex items-center gap-8 mt-2">
            <!-- 添加到日历选项 -->
            <label class="flex items-center cursor-pointer select-none text-base">
              <input
                type="checkbox"
                :checked="todo.addToCalendar"
                @change="toggleSyncToCalendar(todo)"
                :id="'sync-'+todo.id"
                class="mr-2 accent-blue-600"
              />
              <span :for="'sync-'+todo.id">同步到日历</span>
            </label>
            <button
              class="ml-6 text-red-500 hover:text-red-700 transition"
              @click="deleteTodo(todo.id)"
              title="删除"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
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