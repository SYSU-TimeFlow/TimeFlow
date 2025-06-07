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
    v-if="uiStore.showCategoryModal"
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.closeCategoryModal()"
  >
    <!-- 分类模态框主体，阻止事件冒泡到父级 -->
    <div
      class="category-modal rounded-lg shadow-lg w-full max-w-md overflow-hidden"
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
          @click="uiStore.closeCategoryModal()"
          class="modal-close-btn"
          title="关闭"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- 模态框内容区域 -->
      <div class="modal-body p-4">
        <!-- 分类名称输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">分类名称</label>
          <input
            v-model="eventStore.currentCategory.name"
            type="text"
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入分类名称"
          />
        </div>

        <!-- 分类颜色选择区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">颜色</label>
          <!-- 预设颜色选项 -->
          <div class="color-selector flex flex-wrap gap-3 mb-2">
            <button
              v-for="color in colorOptions"
              :key="color"
              :class="[
                'color-option w-8 h-8 rounded-full border-2 relative flex items-center justify-center',
                eventStore.currentCategory.color === color
                  ? 'border-gray-800'
                  : 'border-transparent',
                eventStore.isColorUsed(color)
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer',
              ]"
              :style="{ backgroundColor: color }"
              @click="
                !eventStore.isColorUsed(color) && eventStore.selectColor(color)
              "
              :disabled="eventStore.isColorUsed(color)"
              :title="eventStore.isColorUsed(color) ? '此颜色已被使用' : ''"
              class="!rounded-button whitespace-nowrap"
            >
              <span
                v-if="eventStore.isColorUsed(color)"
                class="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <i class="fas fa-ban text-base text-gray-500"></i>
              </span>
            </button>
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
          class="modal-del-btn"
        >
          删除
        </button>
        <!-- 保存按钮 -->
        <button
          @click="eventStore.saveCategory"
          :disabled="!eventStore.isCategoryFormValid"
          :class="[
            'modal-save-btn',
            !eventStore.isCategoryFormValid && 'opacity-50 cursor-not-allowed'
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
import { useEventStore } from "@/stores/event";
import { useUiStore } from "@/stores/ui";
import { colorOptions } from "@/const";

// 使用Pinia仓库
const eventStore = useEventStore();
const uiStore = useUiStore();

/**
 * 处理ESC键关闭设置模态框
 */
function handleKeyDown(event) {
  if (uiStore.showCategoryModal) {
    if (event.key === "Escape") {
      uiStore.closeCategoryModal();
    } else if (event.key === "Enter") {
      eventStore.saveCategory();
      uiStore.closeCategoryModal();
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

/* 分类模态框应用淡入动画 */
.category-modal {
  animation: fadeIn 0.1s ease-out;
}

/* 确保背景模糊效果兼容性 */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
}

/* 颜色选择器布局 */
.color-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  justify-items: center;
}

/* 字体大小变量 */
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
</style>
