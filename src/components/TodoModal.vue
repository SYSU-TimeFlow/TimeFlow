<!-- 编辑 todo 事项模态框 -->
<template>
  <div
    v-if="todoStore.showTodoModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    :class="settingStore.themeMode === 'dark' ? 'dark-theme' : 'light-theme'"
  >
    <!-- 高斯模糊背景 -->
    <div
      class="absolute inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm"
      @click="todoStore.closeEditModal"
    ></div>

    <!-- 模态框内容 -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <h3 class="text-xl font-bold text-indigo-600 mb-4 modal-title">
        <!-- 根据 isNewTodo 动态显示标题 -->
        {{ todoStore.isNewTodo ? "New Todo" : "Edit Todo" }}
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1 form-label"
            >任务标题
          </label>
          <input
            v-model="todoStore.currentEditingTodo.title"
            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition form-input"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1 form-label"
            >截止日期
          </label>
          <input
            v-model="todoStore.currentEditingTodo.dueDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition form-input"
          />
        </div>

        <!-- 同步到日历 -->
        <div class="form-group mb-4">
          <div class="flex items-center mb-2">
            <input
              v-model="todoStore.currentEditingTodo.addToCalendar"
              type="checkbox"
              id="addToCalendar"
              class="mr-2"
            />
            <label for="addToCalendar" class="text-sm text-gray-700 form-label">
              添加到日历
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            @click="todoStore.closeEditModal"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition modal-button"
          >
            取消
          </button>
          <button
            @click="todoStore.saveEdit"
            class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition modal-button"
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
import { useSettingStore } from "../stores/setting";

// 使用 Pinia 仓库
const todoStore = useTodoStore();
const settingStore = useSettingStore();
</script>

<style scoped>
.todo-modal {
  font-size: inherit;
}

/* 调整各个元素的字体大小比例 */
.modal-title {
  font-size: 1.2em;
}

.form-label {
  font-size: 1em;
}

.form-input {
  font-size: 1em;
}

.modal-button {
  font-size: 0.9em;
}
</style>
