<!--
  @description 待办事项列表。
  在新建 events 时，也可以同时添加到 Todo List 中。
  实现日历与待办事项的同步。
-->
<template>
  <div
    class="min-h-screen bg-gray-50 p-6 w-full"
    :class="settingStore.themeMode === 'dark' ? 'dark-theme' : 'light-theme'"
  >
    <div class="max-w-2xl mx-auto flex flex-col items-center">
      <!-- 标题区 -->
      <h1 class="text-3xl font-bold text-indigo-600 text-center mb-10">
        To-Do
      </h1>

        <!-- 过滤选项 -->
        <div class="w-full mb-6 flex justify-center gap-4">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="eventStore.setFilter(filter.value)"
            class="px-4 py-2 rounded-xl transition cursor-pointer"
            :class="{
              'bg-indigo-600 text-white': eventStore.activeFilter === filter.value,
              'bg-gray-100 text-gray-700 hover:bg-gray-200':
                eventStore.activeFilter !== filter.value,
            }"
          >
            {{ filter.label }} ({{ getFilterCount(filter.value) }})
          </button>
        </div>

      <!-- 待办事项列表 -->
      <div class="w-full space-y-4">
        <div
          v-for="todo in todoStore.filteredTodos"
          :key="todo.id"
          @click="todoStore.toggleTodo(todo.id)"
          class="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border"
          :class="{
            'border-red-500': todo.id % 3 === 0,
            'border-orange-500': todo.id % 3 === 1,
            'border-green-500': todo.id % 3 === 2,
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

            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <!-- 编辑按钮 -->
              <button
                @click.stop="eventStore.openEditTodoModal(todo)"
                class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
              >
                <i class="fas fa-pen fa-sm"></i>
              </button>

              <!-- 删除按钮 -->
              <button
                @click.stop="eventStore.deleteEvent(todo.id)"
                class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <i class="fas fa-trash-alt fa-sm"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态提示：当没有待办事项时显示 -->
        <div
          v-if="eventStore.filteredTodos.length === 0"
          class="text-gray-400 text-center py-12"
        >
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <div>{{ eventStore.emptyStateMessage }}</div>
        </div>
      </div>
    </div>

    <!-- 添加新待办事项按钮 -->
    <button
      @click="eventStore.openNewTodoModal"
      class="fixed right-6 bottom-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition"
    >
      <i class="fas fa-plus text-xl"></i>
    </button>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useTodoStore } from "../stores/todoStore";
import { useSettingStore } from "../stores/setting";

const todoStore = useTodoStore();
const settingStore = useSettingStore();

// 定义过滤器选项，并明确指定类型
const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
];

// 获取不同过滤器的待办事项数量
function getFilterCount(filterType: FilterType) {
  switch (filterType) {
    case "active":
      return eventStore.activeTodos.length;
    case "completed":
      return eventStore.completedTodos.length;
    default:
      return eventStore.allTodos.length;
  }
}
</script>

<style scoped>
.todo-list {
  font-size: inherit;
}

/* 调整各个元素的字体大小比例 */
.todo-title {
  font-size: 1.2em;
}

.todo-item {
  font-size: 1em;
}

.todo-date {
  font-size: 0.9em;
}

.filter-button {
  font-size: 0.9em;
}
</style>
