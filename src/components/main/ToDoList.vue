<!--
  @description 待办事项列表。
  显示所有待办事项，包括没有截止时间和有截止时间的待办事项。
  待办事项的开始时间始终使用1970年作为占位符，截止时间为空时也使用1970年作为占位符。
-->
<template>
  <!-- 修改主容器类，添加todo-list-container类 -->
  <div class="w-full h-full  p-6 overflow-auto todo-list-container">
    <div class="todo-list max-w-3xl mx-auto">
      <!-- 待办事项列表其余部分保持不变 -->
      <div class="flex-1 overflow-auto p-6">
        <div class="max-w-6xl mx-auto flex flex-col items-center">
          <!-- 过滤选项 -->
          <div class="w-full mb-6 flex justify-center gap-4">
            <button
              v-for="filter in filters"
              :key="filter.value"
              @click="eventStore.setFilter(filter.value)"
              class="px-4 py-2 rounded-xl transition cursor-pointer"
              :class="{
                'bg-indigo-600 text-white':
                  eventStore.activeFilter === filter.value,
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
              @click="uiStore.openEditTodoModal(todo)"
              class="flex justify-between items-center p-3  rounded-[12px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out cursor-pointer border-l-4 group todo-item min-h-[3rem] h-[3rem]"
              :style="{
                borderLeftColor:
                  eventStore.categories.find((c) => c.id === todo.categoryId)
                    ?.color || '#e5e7eb',
                opacity: todo.completed ? 0.7 : 1,
                backgroundColor: todo.completed ? '#f9fafb' : 'white',
              }"
            >
              <!-- 左侧内容区域 -->
              <div
                class="flex items-center h-full flex-grow mr-4 overflow-hidden"
              >
                <!-- 标题行 -->
                <div class="flex items-center gap-2">
                  <!-- 完成状态指示器 -->
                  <div
                    class="w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer relative z-10 transition-all duration-200 ease group-hover:border-indigo-400 hover:ring-2 hover:ring-indigo-300/20"
                    :class="
                      todo.completed
                        ? 'bg-indigo-500 border-indigo-600'
                        : 'border-gray-300'
                    "
                    @click.stop="eventStore.toggleTodo(todo.id)"
                  >
                    <i
                      v-if="todo.completed"
                      class="fas fa-check text-white small-text"
                    ></i>
                  </div>

                  <!-- 标题 -->
                  <div
                    class="font-medium truncate max-w-[200px] sm:max-w-[300px]"
                    :class="{ 'line-through text-gray-500': todo.completed }"
                  >
                    {{ todo.title }}
                  </div>
                  <!-- 分类标签 -->
                  <div
                    v-if="
                      eventStore.categories.find(
                        (c) => c.id === todo.categoryId
                      )
                    "
                    class="small-text px-2 py-0.5 rounded-full"
                    :style="{
                      backgroundColor: `${
                        eventStore.categories.find(
                          (c) => c.id === todo.categoryId
                        )?.color
                      }20`,
                      color: eventStore.categories.find(
                        (c) => c.id === todo.categoryId
                      )?.color,
                    }"
                  >
                    {{
                      eventStore.categories.find(
                        (c) => c.id === todo.categoryId
                      )?.name
                    }}
                  </div>
                  <!-- 备注图标提示 -->
                  <i
                    v-if="todo.description"
                    class="fas fa-sticky-note text-gray-400 small-text ml-1 cursor-pointer relative transition-all duration-200 ease hover:text-indigo-500 hover:scale-110"
                    :title="todo.description"
                  ></i>
                </div>
              </div>
              <!-- 右侧操作区：截止时间单独渲染，删除按钮单独渲染 -->
              <div
                v-if="todo.end && new Date(todo.end).getFullYear() > 1970"
                class="flex items-center gap-1 mr-4"
              >
                <i class="far fa-clock small-text flex-shrink-0"></i>
                <span
                  :class="
                    isOverdue(todo.end) && !todo.completed
                      ? 'text-red-500'
                      : 'text-gray-400'
                  "
                >
                  {{ formatDateForDisplay(todo.end) }}
                </span>
              </div>
              <div class="flex gap-1 todo-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
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
            <i class="fas fa-inbox mb-2"></i>
            <div>{{ eventStore.emptyStateMessage }}</div>
          </div>
        </div>
      </div>

      <!-- 已移除添加按钮 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventStore } from "@/stores/event";
import { useUiStore } from "@/stores/ui";
import { formatDateForDisplay } from "@/utils";
import { FilterType } from "@/const";

const eventStore = useEventStore();
const uiStore = useUiStore();

// 定义过滤器选项，并明确指定类型
const filters: { value: FilterType; label: string }[] = [
  { value: "today", label: "我的一天" },
  { value: "all", label: "全部" },
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
];

// 获取不同过滤器的待办事项数量
function getFilterCount(filterType: FilterType) {
  switch (filterType) {
    case "today":
      return eventStore.todayTodos.length;
    case "active":
      return eventStore.activeTodos.length;
    case "completed":
      return eventStore.completedTodos.length;
    default:
      return eventStore.allTodos.length;
  }
}

// 判断任务是否已过期
function isOverdue(endDate: any): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (end.getFullYear() <= 1970) return false;
  return end < new Date();
}
</script>