<!-- 编辑 todo 事项模态框 -->
<template>
  <div
    v-if="todoStore.showEditModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- 高斯模糊背景 -->
    <div
      class="absolute inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm"
      @click="todoStore.closeEditModal"
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
</template>

<script lang="ts" setup>
import { useTodoStore } from "../stores/todoStore";

const todoStore = useTodoStore();
</script>
