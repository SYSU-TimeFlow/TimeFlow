<!--  
 @component EventModal.vue
 @description
  事件创建与编辑模态框。
  此组件提供一个界面，用于创建新事件或修改现有事件的各项详情，
  例如：事件标题、起止时间、全天设置、分类、描述内容。
-->
<template>
  <!-- 模态框容器，仅当 showEventModal 为 true 时显示 -->
  <div
    v-if="eventStore.showEventModal"
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="eventStore.closeEventModal"
  >
    <!-- 事件模态框主体，阻止事件冒泡到父级 -->
    <div
      class="event-modal bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden"
      @click.stop
    >
      <!-- 模态框头部 -->
      <div
        class="modal-header p-4 border-b border-gray-200 flex justify-between items-center"
        :style="{
          backgroundColor: eventStore.currentEvent.categoryColor + '33',
        }"
      >
        <h3 class="text-lg font-semibold">
          <!-- 根据 isNewEvent 动态显示标题 -->
          {{ eventStore.isNewEvent ? "New Event" : "Edit Event" }}
        </h3>
        <!-- 关闭按钮 -->
        <button
          @click="eventStore.closeEventModal"
          class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- 模态框内容区域 -->
      <div class="modal-body p-4">
        <!-- 标题输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Title</label
          >
          <input
            v-model="eventStore.currentEvent.title"
            type="text"
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Event title"
          />
        </div>
        <!-- 开始和结束时间输入区域 -->
        <div class="form-row flex space-x-4 mb-4">
          <div class="form-group flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Start</label
            >
            <input
              v-model="eventStore.currentEvent.start"
              type="datetime-local"
              class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="form-group flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >End</label
            >
            <input
              v-model="eventStore.currentEvent.end"
              type="datetime-local"
              class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <!-- 全天事件选择区域 -->
        <div class="form-group mb-4">
          <div class="flex items-center mb-2">
            <input
              v-model="eventStore.currentEvent.allDay"
              type="checkbox"
              id="allDay"
              class="mr-2"
            />
            <label for="allDay" class="text-sm text-gray-700"
              >All day event</label
            >
          </div>
        </div>
        <!-- 事件分类选择区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Category</label
          >
          <div class="category-selector flex flex-wrap gap-2">
            <!-- 遍历分类列表并显示颜色按钮 -->
            <button
              v-for="category in eventStore.categories"
              :key="category.id"
              :class="[
                'category-option w-8 h-8 rounded-full border-2',
                eventStore.currentEvent.categoryId === category.id // 当前选中分类高亮显示
                  ? 'border-gray-800'
                  : 'border-transparent',
              ]"
              :style="{ backgroundColor: category.color }"
              @click="
                eventStore.currentEvent.categoryId = category.id; // 更新当前事件的分类ID
                eventStore.currentEvent.categoryColor = category.color; // 更新当前事件的分类颜色
              "
              class="cursor-pointer !rounded-button whitespace-nowrap"
            ></button>
          </div>
        </div>
        <!-- 事件描述输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Description</label
          >
          <textarea
            v-model="eventStore.currentEvent.description"
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            placeholder="Event description"
          ></textarea>      </div>
      </div>
      <!-- 模态框底部，包含操作按钮 -->
      <div
        class="modal-footer p-4 border-t border-gray-200 flex justify-end space-x-3"
      >
        <!-- 删除按钮，仅在编辑事件时显示 (isNewEvent 为 false) -->
        <button
          v-if="!eventStore.isNewEvent"
          @click="eventStore.deleteEvent"
          class="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          Delete
        </button>
        <!-- 取消按钮 -->
        <button
          @click="eventStore.closeEventModal"
          class="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer !rounded-button whitespace-nowrap"
        >
          Cancel
        </button>
        <!-- 保存按钮 -->
        <button
          @click="eventStore.saveEvent"
          class="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useEventStore } from "../stores/event";

// 使用Pinia仓库
const eventStore = useEventStore();

/**
 * 处理ESC键关闭设置模态框
 */
function handleKeyDown(event) {
  if (event.key === "Escape" && eventStore.showEventModal) {
    eventStore.closeEventModal();
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
</script>

<style scoped>
/* 定义淡入动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0; /* 动画开始时透明度为0 */
  }
  to {
    opacity: 1; /* 动画结束时透明度为1 */
  }
}
/* 事件模态框应用淡入动画 */
.event-modal {
  animation: fadeIn 0.1s ease-out; /* 动画名称、持续时间、缓动函数 */
}

/* 确保背景模糊效果兼容性 */
.backdrop-blur-sm {
  backdrop-filter: blur(4px); /* 轻微高斯模糊，数值可调整 */
  -webkit-backdrop-filter: blur(4px); /* 兼容 Safari */
  background: rgba(0, 0, 0, 0.1); /* 轻微透明黑色，增强模糊可见性 */
}

/* 暗黑模式适配 */
.dark-mode .event-modal {
  background-color: var(--modal-bg);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.dark-mode .modal-header {
  border-color: var(--border-color);
  background-color: var(--bg-tertiary);
}

.dark-mode .modal-body {
  color: var(--text-primary);
}

.dark-mode .modal-footer {
  border-color: var(--border-color);
  background-color: var(--bg-tertiary);
}

/* 表单元素样式 */
.dark-mode .form-group label {
  color: var(--text-secondary);
}

.dark-mode .form-group input,
.dark-mode .form-group select,
.dark-mode .form-group textarea {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.dark-mode .form-group input::placeholder,
.dark-mode .form-group textarea::placeholder {
  color: var(--text-tertiary);
}

/* 分类颜色选择器边框 */
.dark-mode .category-option {
  box-shadow: 0 0 0 1px var(--border-color);
}

.dark-mode .category-option.border-gray-800 {
  box-shadow: 0 0 0 2px var(--heading-color);
  border-color: var(--heading-color) !important;
}

/* 日期时间选择器 */
.dark-mode input[type="date"],
.dark-mode input[type="time"] {
  color-scheme: dark;
}

/* 复选框调整 */
.dark-mode input[type="checkbox"] {
  filter: invert(0.8) hue-rotate(180deg); /* 改变复选框颜色以匹配暗色主题 */
}
</style>
