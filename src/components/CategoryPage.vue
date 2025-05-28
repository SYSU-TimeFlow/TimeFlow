<!--  
 @component CategoryModal.vue
 @description
  分类创建与编辑模态框。
  此组件提供一个界面，用于创建新分类或修改现有分类的详情，
  例如：分类名称和颜色。
-->
<template>
  <!-- 模态框容器，仅当 showCategoryModal 为 true 时显示 -->
  <div
    v-if="eventStore.showCategoryModal"
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="eventStore.closeCategoryModal"
  >
    <!-- 分类模态框主体，阻止事件冒泡到父级 -->
    <div
      class="category-modal bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden"
      @click.stop
    >
      <!-- 模态框头部 -->
      <div
        class="modal-header p-4 border-b border-gray-200 flex justify-between items-center"
        :style="{
          backgroundColor: eventStore.currentCategory.color + '33',
        }"
      >
        <h3 class="text-lg font-semibold">
          <!-- 根据 isNewCategory 动态显示标题 -->
          {{ eventStore.isNewCategory ? "添加分类" : "编辑分类" }}
        </h3>
        <!-- 关闭按钮 -->
        <button
          @click="eventStore.closeCategoryModal"
          class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- 模态框内容区域 -->
      <div class="modal-body p-4">
        <!-- 分类名称输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >分类名称</label
          >
          <input
            v-model="eventStore.currentCategory.name"
            type="text"
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入分类名称"
          />
        </div>

        <!-- 分类颜色选择区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >颜色</label
          >
          <!-- 预设颜色选项 -->
          <div class="color-selector flex flex-wrap gap-3 mb-2">
            <button
              v-for="color in eventStore.colorOptions"
              :key="color"
              :class="[
                'color-option w-8 h-8 rounded-full border-2',
                eventStore.currentCategory.color === color
                  ? 'border-gray-800'
                  : 'border-transparent',
                eventStore.isColorUsed(color)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer',
              ]"
              :style="{ backgroundColor: color }"
              @click="eventStore.selectColor(color)"
              :disabled="eventStore.isColorUsed(color)"
              :title="eventStore.isColorUsed(color) ? '此颜色已被使用' : ''"
              class="!rounded-button whitespace-nowrap"
            ></button>
          </div>
        </div>
      </div>
      <!-- 模态框底部，包含操作按钮 -->
      <div
        class="modal-footer p-4 border-t border-gray-200 flex justify-end space-x-3"
      >
        <!-- 删除按钮，仅在编辑分类时显示 -->
        <button
          v-if="!eventStore.isNewCategory"
          @click="eventStore.deleteCategory"
          class="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer !rounded-button whitespace-nowrap"
        >
          删除
        </button>
        <!-- 保存按钮 -->
        <button
          @click="eventStore.saveCategory"
          :disabled="!eventStore.isCategoryFormValid"
          :class="[
            'py-2 px-4 rounded-lg !rounded-button whitespace-nowrap',
            eventStore.isCategoryFormValid
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          ]"
        >
          保存
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
  if (event.key === "Escape" && eventStore.showCategoryModal) {
    eventStore.closeCategoryModal();
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

/* 分类模态框应用淡入动画 */
.category-modal {
  animation: fadeIn 0.1s ease-out; /* 动画名称、持续时间、缓动函数 */
}

/* 确保背景模糊效果兼容性 */
.backdrop-blur-sm {
  backdrop-filter: blur(4px); /* 轻微高斯模糊，数值可调整 */
  -webkit-backdrop-filter: blur(4px); /* 兼容 Safari */
  background: rgba(0, 0, 0, 0.1); /* 轻微透明黑色，增强模糊可见性 */
}

/* 颜色选择器样式 */
.color-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  justify-items: center;
}

/* 添加字体大小变量 */
.text-lg {
  font-size: var(--font-size-lg);
}

.text-sm {
  font-size: var(--font-size-sm);
}

input {
  font-size: var(--font-size-base);
}

button {
  font-size: var(--font-size-base);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
}

.modal-footer button {
  font-size: var(--font-size-base);
}

/* 深色模式样式 */
.dark-mode .category-modal {
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
  background-color: var(--modal-bg);
}

.dark-mode .modal-body label {
  color: var(--modal-label-color) !important;
  font-weight: 500;
}

.dark-mode .modal-body input {
  background-color: var(--modal-input-bg) !important;
  color: var(--modal-input-text) !important;
  border: 1px solid var(--modal-input-border) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark-mode .modal-body input:focus {
  border-color: #58a6ff !important;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
}

.dark-mode .modal-body input::placeholder {
  color: var(--text-tertiary) !important;
}

.dark-mode .modal-footer {
  border-color: var(--modal-border);
  background-color: var(--modal-footer-bg) !important;
}

.dark-mode .modal-footer button {
  color: var(--modal-button-text) !important;
}

.dark-mode .modal-footer button.bg-blue-600 {
  background-color: var(--modal-button-bg) !important;
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

.dark-mode .modal-footer button.bg-red-600 {
  background-color: #da3633 !important;
  color: var(--modal-button-text) !important;
  border: 1px solid #da3633;
}

.dark-mode .modal-footer button.bg-red-600:hover {
  background-color: #f85149 !important;
}

/* 颜色选择器增强 */
.dark-mode .color-option {
  box-shadow: 0 0 0 2px var(--modal-border), 0 2px 4px rgba(0, 0, 0, 0.4);
}

.dark-mode .color-option.border-gray-800 {
  box-shadow: 0 0 0 3px #58a6ff !important;
}

/* 关闭按钮增强 */
.dark-mode .modal-header button {
  color: var(--text-secondary) !important;
}

.dark-mode .modal-header button:hover {
  color: #ff6b6b !important;
  background-color: rgba(255, 107, 107, 0.1);
}
</style>
