<!-- 编辑 todo 事项模态框 -->
<template>
  <div
    v-if="eventStore.showTodoModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- 高斯模糊背景 -->
    <div
      class="absolute inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm"
      @click="eventStore.closeTodoModal"
    ></div>

    <!-- 模态框内容 -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <h3 class="text-xl font-bold text-indigo-600 mb-4">
        <!-- 根据 isNewTodo 动态显示标题 -->
        {{ eventStore.isNewTodo ? "新建待办事项" : "编辑待办事项" }}
      </h3>

      <div class="space-y-4">
        <!-- 标题 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >任务标题</label
          >
          <input
            v-model="eventStore.currentEvent.title"
            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="请输入任务标题"
          />
        </div>
        <!-- 截止日期（精确到分钟） -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block text-sm font-medium text-gray-700"
              >截止时间</label
            >
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                v-model="hasDeadline"
                class="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span class="ml-2 text-sm text-gray-600">设置截止时间</span>
            </label>
          </div>
          <input
            v-if="hasDeadline"
            v-model="eventStore.currentEvent.end"
            type="datetime-local"
            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <div v-else class="text-sm text-gray-500">无截止时间</div>
        </div>
        <!-- 分类选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >分类</label
          >
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="category in eventStore.categories"
              :key="category.id"
              :class="[
                'w-7 h-7 rounded-full border-2',
                eventStore.currentEvent.categoryId === category.id
                  ? 'border-gray-800'
                  : 'border-transparent',
              ]"
              :style="{ backgroundColor: category.color }"
              @click="
                eventStore.currentEvent.categoryId = category.id;
                eventStore.currentEvent.categoryColor = category.color;
              "
              type="button"
            ></button>
          </div>
        </div>
        <!-- 备注 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >备注</label
          >
          <textarea
            v-model="eventStore.currentEvent.description"
            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-20"
            placeholder="可填写详细说明"
          ></textarea>
        </div>
        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            @click="eventStore.closeTodoModal"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            取消
          </button>
          <button
            @click="saveTodo"
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
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useEventStore, EventType } from "../stores/event";

const eventStore = useEventStore();

/**
 * 处理ESC键关闭设置模态框
 */
function handleKeyDown(event) {
  if (event.key === "Escape" && eventStore.showTodoModal) {
    eventStore.closeTodoModal();
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});

// 使用本地变量跟踪是否将待办事项同步到日历
const syncToCalendar = ref(false);
// 使用本地变量跟踪是否设置截止时间
const hasDeadline = ref(true);

// 打开待办事项模态框时的处理
watch(
  () => eventStore.showTodoModal,
  (isOpen) => {
    if (isOpen) {
      // 检查是否有截止时间
      hasDeadline.value = !!eventStore.currentEvent.end;
    }
  }
);

// 监听截止时间设置变化
watch(hasDeadline, (newValue) => {
  if (!newValue) {
    // 如果取消设置截止时间，清空end字段
    eventStore.currentEvent.end = "";
  } else if (!eventStore.currentEvent.end) {
    // 如果设置了截止时间但end为空，设置默认值为今天结束
    const today = new Date();
    today.setHours(23, 59, 59, 0);
    eventStore.currentEvent.end = eventStore.formatDateTimeForInput(today);
  }
});

// 保存待办事项
function saveTodo() {
  // 调用 eventStore 中的 saveTodo 函数，传递 hasDeadline 参数
  // 所有处理逻辑均移至 store 内部处理
  eventStore.saveTodo(hasDeadline.value);
}
</script>

<style scoped>
/* 原有样式保留 */

/* 暗黑模式适配 */
.todo-page {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.todo-header {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}

.todo-content {
  background-color: var(--bg-primary);
}

.filter-button {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.filter-button.active {
  background-color: var(--active-bg);
  color: var(--text-primary);
}

/* 输入框样式适配暗黑模式 */
.dark-mode input,
.dark-mode textarea {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.dark-mode input::placeholder,
.dark-mode textarea::placeholder {
  color: var(--text-tertiary);
}

/* 确保模态框正确显示 */
.dark-mode .bg-white {
  background-color: var(--modal-bg) !important;
  color: var(--text-primary);
}

.dark-mode .text-indigo-600 {
  color: var(--heading-color) !important;
}

.dark-mode input,
.dark-mode textarea,
.dark-mode select {
  background-color: var(--bg-tertiary) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
}

.dark-mode input[type="date"],
.dark-mode input[type="time"] {
  color-scheme: dark;
}

/* 按钮调整 */
.dark-mode .bg-indigo-600 {
  background-color: #3a5277 !important; /* 更柔和的蓝色 */
}

.dark-mode .bg-indigo-600:hover {
  background-color: #445c85 !important; /* 悬停时略深一点 */
}

.dark-mode .bg-gray-200 {
  background-color: var(--bg-tertiary) !important;
  color: var(--text-secondary) !important;
}

/* 添加字体大小变量 */
.text-xl {
  font-size: var(--font-size-xl);
}

.text-sm {
  font-size: var(--font-size-sm);
}

input,
textarea {
  font-size: var(--font-size-base);
}

button {
  font-size: var(--font-size-base);
}
</style>
