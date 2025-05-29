<!--
  @description 待办事项列表。
  显示所有待办事项，包括没有截止时间和有截止时间的待办事项。
  待办事项的开始时间始终使用1970年作为占位符，截止时间为空时也使用1970年作为占位符。
-->
<template>
  <!-- 修改主容器类，添加todo-list-container类 -->
  <div class="w-full h-full bg-white p-6 overflow-auto todo-list-container">
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
          <div class="w-full space-y-4">            <div
              v-for="todo in eventStore.filteredTodos"
              :key="todo.id"
              @click="eventStore.openEditTodoModal(todo)"
              class="flex justify-between items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border-l-4 group todo-item min-h-[3rem] h-[3rem]"
              :style="{
                borderLeftColor:
                  eventStore.categories.find((c) => c.id === todo.categoryId)
                    ?.color || '#e5e7eb',
                opacity: todo.completed ? 0.7 : 1,
                backgroundColor: todo.completed ? '#f9fafb' : 'white',
              }"
            >              <!-- 左侧内容区域 -->
              <div class="flex items-center h-full flex-grow mr-4 overflow-hidden">
                <!-- 标题行 -->
                <div class="flex items-center gap-2">
                  <!-- 完成状态指示器 -->
                  <div 
                    class="w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer"
                    :class="todo.completed ? 'bg-indigo-500 border-indigo-600' : 'border-gray-300'"
                    @click.stop="eventStore.toggleTodo(todo.id)">
                    <i v-if="todo.completed" class="fas fa-check text-white text-xs"></i>
                  </div>
                  
                  <!-- 标题 -->
                  <div
                    class="font-medium text-base truncate max-w-[200px] sm:max-w-[300px]"
                    :class="{ 'line-through text-gray-500': todo.completed }"
                  >
                    {{ todo.title }}
                  </div>
                    <!-- 分类标签 -->
                  <div v-if="eventStore.categories.find(c => c.id === todo.categoryId)"
                      class="text-xs px-2 py-0.5 rounded-full"
                      :style="{
                        backgroundColor: `${eventStore.categories.find(c => c.id === todo.categoryId)?.color}20`,
                        color: eventStore.categories.find(c => c.id === todo.categoryId)?.color
                      }">
                    {{ eventStore.categories.find(c => c.id === todo.categoryId)?.name }}
                  </div>
                  <!-- 备注图标提示 -->
                  <i v-if="todo.description" class="fas fa-sticky-note text-gray-400 text-xs ml-1 note-icon" :title="todo.description"></i>
                </div>
              </div>
              <!-- 右侧操作区：截止时间单独渲染，删除按钮单独渲染 -->
              <div v-if="todo.end && new Date(todo.end).getFullYear() > 1970"
                   class="text-sm flex items-center gap-1 mr-4">
                <i class="far fa-clock text-xs flex-shrink-0"></i>
                <span :class="isOverdue(todo.end) && !todo.completed ? 'text-red-500' : 'text-gray-400'">
                  {{ formatDateForDisplay(todo.end) }}
                </span>
              </div>
              <div class="flex gap-1 todo-actions">
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

      <!-- 已移除添加按钮 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventStore } from "../stores/event";
import { formatDateForDisplay } from "../utils";
import { FilterType } from "../const";

const eventStore = useEventStore();

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

<style scoped>
/* 修改字号相关的样式 */
.todo-title {
  font-size: var(--heading-font-size);
}

.todo-item {
  font-size: var(--base-font-size);
}

.todo-description {
  font-size: var(--small-text-font-size);
}

/* 原有样式保持不变 */

/* Todo视图分类选项颜色调整 */
.dark-mode button[class*="bg-indigo-600"],
.dark-mode button[class*="bg-blue-100"][class*="text-blue-700"] {
  background-color: var(--active-item-bg) !important; /* 使用更柔和的灰色 */
  color: var(--heading-color) !important;
  border-left: 2px solid var(--active-item-border);
}

.dark-mode button[class*="bg-gray-100"] {
  background-color: var(--bg-tertiary) !important;
  color: var(--text-secondary) !important;
}

.dark-mode button[class*="bg-gray-100"]:hover {
  background-color: var(--hover-bg) !important;
  color: var(--text-primary) !important;
}

/* 修复重复的过滤按钮样式 */
.dark-mode .filter-button {
  background-color: var(--bg-tertiary) !important;
  color: var(--text-secondary) !important;
  border: 1px solid var(--border-color);
}

.dark-mode .filter-button.active,
.dark-mode .filter-button[class*="bg-blue-100"] {
  background-color: var(--active-item-bg) !important;
  color: var(--heading-color) !important;
  border-left: 2px solid var(--active-item-border);
}

/* 修复底部添加按钮 */
.dark-mode button[class*="bg-indigo-600"].fixed {
  background-color: var(--button-primary) !important;
  color: var(--text-primary) !important;
}

.dark-mode button[class*="bg-indigo-600"].fixed:hover {
  background-color: var(--button-primary-hover) !important;
}

/* 修复标题颜色 */
.dark-mode .text-indigo-600 {
  color: var(--heading-color) !important;
}

/* 调整列表项样式 */
.dark-mode .todo-item {
  background-color: var(--bg-secondary) !important;
  box-shadow: 0 1px 3px var(--shadow-color) !important;
}

.dark-mode .todo-item:hover {
  background-color: var(--hover-bg) !important;
  box-shadow: 0 2px 6px var(--shadow-color) !important;
}

/* 调整待办项目文本颜色 - 修改为实际使用的类选择器 */
.dark-mode .todo-item .font-medium {
  color: var(--text-secondary) !important; /* 使用更亮的主文本颜色 */
}

.dark-mode .todo-item .text-gray-400,
.dark-mode .todo-item .text-gray-500 {
  color: var(--text-secondary) !important; /* 使用次级文本颜色，更容易看清 */
}

/* 已完成项目的样式调整 */
.dark-mode .todo-item .line-through {
  color: var(--text-tertiary) !important; /* 已完成项目可以稍微暗一点 */
}

/* 添加新的样式 */
.todo-item {
  transition: all 0.2s ease;
  border-radius: 12px;
}

.todo-item:hover {
  transform: translateY(-2px);
}

/* 暗模式下的额外样式 */
.dark-mode .todo-item .text-red-500 {
  color: #ff6b6b !important;
}

/* 完成状态指示器动画 */
.todo-item .w-5.h-5 {
  transition: all 0.2s ease;
  position: relative;
  z-index: 10; /* 确保复选框在最上层，便于点击 */
}

.todo-item:hover .w-5.h-5:not(.bg-indigo-500) {
  border-color: #818cf8;
}

/* 增强复选框悬停效果 */
.todo-item .w-5.h-5:hover {
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2);
}

/* 确保备注不会影响操作按钮 */
.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 3rem;
}

/* 备注文本限制 */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

/* 确保操作按钮可见性 - 使用新的交互方式 */
.todo-actions {
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  visibility: visible; /* 使按钮始终可见 */
  opacity: 0; /* 默认透明 */
  transition: opacity 0.2s ease-in-out;
}

/* Todo项在悬停时显示按钮 */
.todo-item:hover .todo-actions {
  opacity: 1;
}

/* 确保暗模式下按钮样式正确 */
.dark-mode .todo-actions button.text-blue-500:hover {
  background-color: rgba(59, 130, 246, 0.15) !important;
}

.dark-mode .todo-actions button.text-red-500:hover {
  background-color: rgba(239, 68, 68, 0.15) !important;
}

/* 备注图标悬停样式 */
.note-icon {
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.note-icon:hover {
  color: #6366f1 !important;
  transform: scale(1.2);
}
</style>
