<!--
 @component HelpModal.vue
 @description
  快捷键帮助模态框。
  此组件提供TimeFlow应用的所有键盘快捷键说明，帮助用户快速了解和使用应用功能。
-->
<template>
  <!-- 模态框容器，仅当 showHelpModal 为 true 时显示 -->
  <div
    v-if="uiStore.showHelpModal"
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.closeHelpModal"
  >
    <!-- 帮助模态框主体，阻止事件冒泡到父级 -->
    <div
      class="help-modal bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden"
      @click.stop
    >
      <!-- 模态框头部 -->
      <div
        class="modal-header p-4 border-b border-gray-200 flex justify-between items-center bg-blue-50"
      >
        <h3 class="text-lg font-semibold text-blue-800">
          <i class="fas fa-keyboard mr-2"></i> TimeFlow Keyboard Shortcuts
        </h3>
        <!-- 关闭按钮 -->
        <button
          @click="uiStore.closeHelpModal"
          class="text-gray-500 hover:text-gray-700 cursor-pointer rounded-md p-1"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 模态框内容区域 -->
      <div class="modal-body p-6 max-h-[70vh] overflow-y-auto">
        <!-- 导航部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">导航</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>h</kbd> 或 <kbd>←</kbd></span>
              <span class="description text-gray-700">上一个(周/月)</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>l</kbd> 或 <kbd>→</kbd></span>
              <span class="description text-gray-700">下一个(周/月)</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>j</kbd> 或 <kbd>↓</kbd></span>
              <span class="description text-gray-700">向下滚动</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>k</kbd> 或 <kbd>↑</kbd></span>
              <span class="description text-gray-700">向上滚动</span>
            </div>
          </div>
        </div>
        
        <!-- 视图切换部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">视图切换</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>1</kbd></span>
              <span class="description text-gray-700">月视图</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>2</kbd></span>
              <span class="description text-gray-700">周视图</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>3</kbd></span>
              <span class="description text-gray-700">日视图</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>4</kbd></span>
              <span class="description text-gray-700">待办事项视图</span>
            </div>
          </div>
        </div>
        
        <!-- 模式切换部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">模式与搜索</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>/</kbd></span>
              <span class="description text-gray-700">进入搜索模式</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>:</kbd></span>
              <span class="description text-gray-700">进入命令模式</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>Esc</kbd></span>
              <span class="description text-gray-700">返回普通模式</span>
            </div>
          </div>
        </div>
        
        <!-- 事件操作部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">事件操作</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>a</kbd></span>
              <span class="description text-gray-700">切换事件页</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>s</kbd></span>
              <span class="description text-gray-700">切换设置页</span>
            </div>
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>空格</kbd></span>
              <span class="description text-gray-700">切换侧边栏</span>
            </div>
          </div>
        </div>
        
        <!-- 其他快捷键 -->
        <div class="shortcut-section">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">其他</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="shortcut-item flex justify-between">
              <span class="key-combo"><kbd>?</kbd></span>
              <span class="description text-gray-700">显示此帮助</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 模态框底部 -->
      <div class="modal-footer p-4 border-t border-gray-200 flex justify-end">
        <button
          @click="uiStore.closeHelpModal"
          class="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from "../stores/ui";

// 使用Pinia仓库
const uiStore = useUiStore();
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

/* 帮助模态框应用淡入动画 */
.help-modal {
  animation: fadeIn 0.2s ease-out;
}

/* 确保背景模糊效果兼容性 */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
}

/* 键盘按键样式 */
kbd {
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  color: #4a5568;
  display: inline-block;
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
}

/* 快捷键项样式 */
.shortcut-item {
  padding: 0.5rem 0;
}

/* 快捷键组合样式 */
.key-combo {
  font-weight: 500;
}

/* 描述文本样式 */
.description {
  font-size: 0.9rem;
}
</style>