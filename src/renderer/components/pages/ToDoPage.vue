<!-- 
 @component ToDoPage.vue
 @description: 待办事项模态框组件，负责新建和编辑待办事项，提供完整的待办事项管理功能。
 
 主要功能：
 1. 新建和编辑待办事项
 2. 设置任务标题和描述
 3. 可选择设置截止时间
 4. 分类管理和颜色标识
 5. 支持键盘快捷键操作
 6. 错误提示和抖动动画
 7. 删除待办事项
-->

<!-- 编辑 todo 事项模态框 -->
<template>
  <!-- 模态框容器，仅当 showTodoModal 为 true 时显示 -->
  <div
    v-if="uiStore.showTodoModal"
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.closeTodoModal"
  >
    <!-- 待办事项模态框主体，阻止事件冒泡到父级 -->
    <div
      class="todo-modal rounded-lg shadow-lg w-full max-w-md overflow-hidden"
      @click.stop
      ref="modalRef"
    >
      <!-- 模态框头部 -->
      <div
        class="modal-header p-4 flex justify-between items-center"
        :style="{
          backgroundColor: eventStore.currentEvent.categoryColor + '33',
        }"
      >
        <h3 class="text-lg font-semibold">
          <!-- 根据 isNewTodo 动态显示标题 -->
          {{ eventStore.isNewTodo ? "New Todo" : "Edit Todo" }}
        </h3>
        <!-- 关闭按钮 -->
        <button
          @click="uiStore.closeTodoModal"
          class="modal-close-btn"
          title="关闭"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 模态框内容区域 -->
      <div class="modal-body p-4">
        <!-- 标题输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">Task Title</label>
          <input
            v-model="eventStore.currentEvent.title"
            type="text"
            class="w-full"
            placeholder="Enter task title"
          />
          <div v-if="eventStore.todoError" class="text-red-500 text-xs mt-1">
            {{ eventStore.todoError }}
          </div>
        </div>

        <!-- 截止时间设置区域 -->
        <div class="form-group mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium">Deadline</label>
            <div class="flex items-center">
              <input
                type="checkbox"
                v-model="hasDeadline"
                id="hasDeadline"
                class="mr-2"
              />
              <label for="hasDeadline" class="text-sm">Set deadline</label>
            </div>
          </div>
          <!-- 截止时间输入框 -->
          <input
            v-if="hasDeadline"
            v-model="eventStore.currentEvent.end"
            type="datetime-local"
            class="w-full"
          />
          <div
            v-else
            class="no-deadline w-full p-2 border rounded-md h-10 flex items-center text-base dark:bg-[var(--modal-input-bg)]"
            style="font-family: inherit"
          >
            <span class="w-full">无截止时间</span>
          </div>
        </div>

        <!-- 事件分类选择区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">Category</label>
          <div class="category-selector flex flex-wrap gap-2">
            <!-- 遍历分类列表并显示颜色按钮 -->
            <button
              v-for="category in eventStore.categories"
              :key="category.id"
              :class="[
                'category-option w-8 h-8 rounded-full border-2',
                eventStore.currentEvent.categoryId === category.id
                  ? 'border-gray-800'
                  : 'border-transparent',
              ]"
              :style="{ backgroundColor: category.color }"
              @click="
                eventStore.currentEvent.categoryId = category.id;
                eventStore.currentEvent.categoryColor = category.color;
              "
              class="cursor-pointer !rounded-button whitespace-nowrap"
            ></button>
          </div>
        </div>

        <!-- 备注描述输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea
            v-model="eventStore.currentEvent.description"
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            placeholder="Add task description"
          ></textarea>
        </div>
      </div>

      <!-- 模态框底部，包含操作按钮 -->
      <div class="modal-footer p-4 flex justify-between items-center">
        <!-- 空占位符（左侧） -->
        <div></div>
        <div class="flex space-x-3">
          <!-- 删除按钮，仅在编辑待办事项时显示 (isNewTodo 为 false) -->
          <button
            v-if="!eventStore.isNewTodo"
            @click="eventStore.deleteTodo()"
            class="modal-del-btn"
          >
            Delete
          </button>
          <!-- 保存按钮 -->
          <button @click="saveTodo" class="modal-save-btn">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useEventStore } from "../../stores/event";
import { useUiStore } from "../../stores/ui";
import { formatDateForInput } from "../../utils";

const eventStore = useEventStore();
const uiStore = useUiStore();

/**
 * 处理键盘事件 - 支持ESC键关闭模态框和Enter键保存
 * @param {KeyboardEvent} event - 键盘事件对象
 */
function handleKeyDown(event) {
  // 仅在待办事项模态框显示时处理键盘事件
  if (uiStore.showTodoModal) {
    if (event.key === "Escape") {
      uiStore.closeTodoModal();
    } else if (event.key === "Enter") {
      saveTodo();
      uiStore.closeTodoModal();
    }
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

// 使用本地变量跟踪是否设置截止时间
const hasDeadline = ref(true);
// 模态框DOM引用，用于添加抖动动画
const modalRef = ref<HTMLElement | null>(null);

// 监听事件错误状态，触发抖动动画
watch(
  () => eventStore.todoError,
  (val) => {
    if (val && modalRef.value) {
      // 先移除再添加，确保动画能重复触发
      modalRef.value.classList.remove("shake");
      void modalRef.value.offsetWidth;
      modalRef.value.classList.add("shake");
    }
  }
);

// 监听抖动状态，触发抖动动画
watch(
  () => eventStore.todoShake,
  (val) => {
    if (val && modalRef.value) {
      modalRef.value.classList.remove("shake");
      void modalRef.value.offsetWidth;
      modalRef.value.classList.add("shake");
      // 动画触发后立即重置 shake 标志，避免下次无效
      eventStore.todoShake = false;
    }
  }
);

// 监听模态框开关状态，初始化截止时间设置
watch(
  () => uiStore.showTodoModal,
  (isOpen) => {
    if (isOpen) {
      // 检查是否有截止时间，并排除1970年的占位符日期
      if (eventStore.currentEvent.end) {
        const endDate = new Date(eventStore.currentEvent.end);
        // 如果截止时间的年份大于1970年，才视为有截止时间
        hasDeadline.value = endDate.getFullYear() > 1970;
      } else {
        hasDeadline.value = false;
      }
    }
  }
);

// 监听截止时间设置变化，处理截止时间的设置和取消
watch(hasDeadline, (newValue) => {
  if (!newValue) {
    // 如果取消设置截止时间，使用1970年作为占位符
    const placeholderDate = new Date(0); // 1970-01-01
    eventStore.currentEvent.end = formatDateForInput(placeholderDate);
  } else if (
    !eventStore.currentEvent.end ||
    new Date(eventStore.currentEvent.end).getFullYear() <= 1970
  ) {
    // 如果设置了截止时间但end为空或是占位符，设置默认值为今天结束
    const today = new Date();
    today.setHours(23, 59, 59, 0);
    eventStore.currentEvent.end = formatDateForInput(today);
  }
});

// 监听标题输入变化，清除错误提示
watch(
  () => eventStore.currentEvent.title,
  () => {
    if (eventStore.todoError) eventStore.todoError = "";
  }
);

/**
 * 保存待办事项
 * 调用 eventStore 中的 saveTodo 函数，传递截止时间设置参数
 */
function saveTodo() {
  // 调用 eventStore 中的 saveTodo 函数，传递 hasDeadline 参数
  // 所有处理逻辑均移至 store 内部处理
  eventStore.saveTodo(hasDeadline.value);
}
</script>

<style scoped>
/* 定义淡入动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 待办事项模态框应用淡入动画 */
.todo-modal {
  animation: fadeIn 0.1s ease-out;
}

/* 确保背景模糊效果兼容性 */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
}

/* 无截止时间div的特殊样式 */
.form-group .no-deadline {
  border: 1px solid #d1d5db !important;
  color: #111827 !important;
  background: #fff !important;
}

.dark-mode .form-group .no-deadline {
  background-color: var(--modal-input-bg) !important;
  color: var(--modal-input-text) !important;
  border: 1px solid var(--modal-input-border) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 摇动动画 */
@keyframes shake {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-8px);
  }
  80% {
    transform: translateX(8px);
  }
  100% {
    transform: translateX(0);
  }
}

.shake {
  animation: shake 0.3s;
}
</style>
