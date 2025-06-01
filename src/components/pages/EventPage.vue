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
    v-if="uiStore.showEventModal"
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.closeEventModal()"
  >
    <!-- 事件模态框主体，阻止事件冒泡到父级 -->
    <div
      class="event-modal bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden"
      @click.stop
      ref="modalRef"
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
          @click="uiStore.closeEventModal()"
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
          <div v-if="eventStore.eventTitleError" class="text-red-500 text-xs mt-1">{{ eventStore.eventTitleError }}</div>
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
        <div v-if="eventStore.eventTimeError" class="text-red-500 text-xs mb-2">{{ eventStore.eventTimeError }}</div>
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
                eventStore.currentEvent.categoryId = category.id;
                eventStore.currentEvent.categoryColor = category.color;
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
          ></textarea>
        </div>
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
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useEventStore } from "@/stores/event";
import { useUiStore } from "@/stores/ui";

// 使用Pinia仓库
const eventStore = useEventStore();
const uiStore = useUiStore();
const modalRef = ref(null);

/**
 * 处理ESC键关闭设置模态框
 */
function handleKeyDown(event) {
  if (uiStore.showEventModal) {
    if(event.key === "Escape") {
      uiStore.closeEventModal();
    }else if(event.key == "Enter") {
      eventStore.saveEvent();
      uiStore.closeEventModal();
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

// 监听 eventShake，触发 shake 动画
watch(
  () => eventStore.eventShake,
  (val) => {
    if (val && modalRef.value) {
      modalRef.value.classList.remove("shake");
      void modalRef.value.offsetWidth;
      modalRef.value.classList.add("shake");
      // 动画触发后立即重置 shake 标志，避免下次无效
      eventStore.eventShake = false;
    }
  }
);

// 监听开始/结束时间输入，清除时间错误提示
watch(
  [() => eventStore.currentEvent.start, () => eventStore.currentEvent.end],
  () => {
    if (eventStore.eventTimeError) eventStore.eventTimeError = "";
  }
);
// 监听标题输入，清除标题错误提示
watch(
  () => eventStore.currentEvent.title,
  () => {
    if (eventStore.eventTitleError) eventStore.eventTitleError = "";
  }
);
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

/* 暗黑模式适配 - 增强区分度，但保留动态头部颜色 */
.dark-mode .event-modal {
  background-color: var(--modal-bg) !important;
  color: var(--text-primary);
  border: 1px solid var(--modal-border);
  box-shadow: var(--modal-shadow);
}

/* 保留头部动态颜色，不覆盖背景 */
.dark-mode .modal-header {
  border-color: var(--modal-border);
  /* 不覆盖 background-color，保持动态颜色 */
}

.dark-mode .modal-header h3 {
  color: var(--modal-title-color) !important;
  /* 确保文字在任何背景色上都清晰可见 */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  font-weight: 600;
}

.dark-mode .modal-body {
  color: var(--text-primary);
  background-color: var(--modal-bg);
}

.dark-mode .modal-footer {
  border-color: var(--modal-border);
  background-color: var(--modal-footer-bg) !important;
}

/* 表单元素样式增强 */
.dark-mode .form-group label {
  color: var(--modal-label-color) !important;
  font-weight: 500;
}

.dark-mode .form-group input,
.dark-mode .form-group select,
.dark-mode .form-group textarea {
  background-color: var(--modal-input-bg) !important;
  color: var(--modal-input-text) !important;
  border: 1px solid var(--modal-input-border) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark-mode .form-group input:focus,
.dark-mode .form-group textarea:focus {
  border-color: #58a6ff !important;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
}

.dark-mode .form-group input::placeholder,
.dark-mode .form-group textarea::placeholder {
  color: var(--text-tertiary) !important;
}

/* 分类颜色选择器增强 */
.dark-mode .category-option {
  box-shadow: 0 0 0 2px var(--modal-border), 0 2px 4px rgba(0, 0, 0, 0.4);
}

.dark-mode .category-option.border-gray-800 {
  box-shadow: 0 0 0 3px #58a6ff !important;
  border-color: #58a6ff !important;
}

/* 按钮样式增强 */
.dark-mode .modal-footer button.bg-blue-600 {
  background-color: var(--modal-button-bg) !important;
  color: var(--modal-button-text) !important;
  border: 1px solid var(--modal-button-bg);
}

.dark-mode .modal-footer button.bg-blue-600:hover {
  background-color: var(--modal-button-hover) !important;
}

.dark-mode .modal-footer button.bg-gray-200 {
  background-color: var(--modal-button-secondary) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--modal-border);
}

.dark-mode .modal-footer button.bg-gray-200:hover {
  background-color: var(--modal-button-secondary-hover) !important;
}

/* 关闭按钮增强 */
.dark-mode .modal-header button {
  color: var(--text-secondary) !important;
}

.dark-mode .modal-header button:hover {
  color: #ff6b6b !important;
  background-color: rgba(255, 107, 107, 0.1);
}

/* 摇动动画定义 */
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-8px); }
  80% { transform: translateX(8px); }
  100% { transform: translateX(0); }
}
.shake {
  animation: shake 0.3s;
}
</style>
