<!--
  @description 待办事项列表。
  显示所有待办事项，包括没有截止时间和有截止时间的待办事项。
  待办事项的开始时间始终使用1970年作为占位符，截止时间为空时也使用1970年作为占位符。
-->
<template>
  <main class="todo-main flex-1 flex flex-col overflow-hidden">
    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-6xl mx-auto flex flex-col items-center">
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
            v-for="todo in eventStore.filteredTodos"
            :key="todo.id"
            @click="eventStore.toggleTodo(todo.id)"
            class="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border-l-4 group"
            :style="{
              borderLeftColor: eventStore.categories.find(c => c.id === todo.categoryId)?.color || '#e5e7eb',
              opacity: todo.completed ? 0.7 : 1,
              backgroundColor: todo.completed ? '#f9fafb' : 'white',
            }"
          >
            <div class="flex items-center gap-4">
              <!-- 分类色块 -->
              <div
                v-if="eventStore.categories.find(c => c.id === todo.categoryId)?.color"
                class="w-3 h-3 rounded-full mr-2"
                :style="{ backgroundColor: eventStore.categories.find(c => c.id === todo.categoryId)?.color }"
              ></div>
              <!-- 完成状态复选框 -->
              <input
                type="checkbox"
                :checked="todo.completed"
                @click.stop="eventStore.toggleTodo(todo.id)"
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
                <!-- 备注 -->
                <div v-if="todo.description" class="text-xs text-gray-400 mt-1">
                  {{ todo.description }}
                </div>                <!-- 格式化显示的截止日期（精确到分钟） -->
                <div v-if="todo.end && new Date(todo.end).getFullYear() > 1970" class="text-sm text-gray-500 mt-1">
                  截止：{{ eventStore.formatDateForDisplay(todo.end) }}
                </div>
                <div v-else class="text-sm text-gray-500 mt-1">
                  无截止时间
                </div>
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
import { useEventStore, FilterType } from "../stores/event";

const eventStore = useEventStore();

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
