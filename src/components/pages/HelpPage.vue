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
      class="help-modal bg-white rounded-lg shadow-lg w-full max-w-xl overflow-hidden"
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
      <div class="modal-body p-6 max-h-[70vh] overflow-y-auto hide-scrollbar">
        <!-- 导航部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">
            导航
          </h4>
          <div class="grid grid-cols-1 gap-3">
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>h</kbd> 或 <kbd>←</kbd></span>
              <span class="description text-gray-700">上一个(周/月)</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>l</kbd> 或 <kbd>→</kbd></span>
              <span class="description text-gray-700">下一个(周/月)</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>j</kbd> 或 <kbd>↓</kbd></span>
              <span class="description text-gray-700">向下滚动</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>k</kbd> 或 <kbd>↑</kbd></span>
              <span class="description text-gray-700">向上滚动</span>
            </div>
          </div>
        </div>

        <!-- 视图切换部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">
            视图切换
          </h4>
          <div class="grid grid-cols-1 gap-3">
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>1</kbd></span>
              <span class="description text-gray-700">月视图</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>2</kbd></span>
              <span class="description text-gray-700">周视图</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>3</kbd></span>
              <span class="description text-gray-700">日视图</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>4</kbd></span>
              <span class="description text-gray-700">待办事项视图</span>
            </div>
          </div>
        </div>

        <!-- 模式切换部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">
            模式与搜索
          </h4>
          <div class="grid grid-cols-1 gap-3">
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>/</kbd></span>
              <span class="description text-gray-700">进入搜索模式</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>:</kbd></span>
              <span class="description text-gray-700">进入命令模式</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>Esc</kbd></span>
              <span class="description text-gray-700">返回普通模式</span>
            </div>
          </div>
        </div>

        <!-- 事件操作部分 -->
        <div class="shortcut-section mb-6">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">
            事件操作
          </h4>
          <div class="grid grid-cols-1 gap-3">
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>a</kbd></span>
              <span class="description text-gray-700">切换事件页</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>s</kbd></span>
              <span class="description text-gray-700">切换设置页</span>
            </div>
            <div class="shortcut-item flex justify-between items-center">
              <span class="key-combo"><kbd>空格</kbd></span>
              <span class="description text-gray-700">切换侧边栏</span>
            </div>
          </div>
        </div>

        <!-- 其他快捷键 -->
        <div class="shortcut-section">
          <h4 class="text-md font-semibold mb-3 text-gray-700 border-b pb-1">
            其他
          </h4>
          <div class="grid grid-cols-1 gap-3">
            <div class="shortcut-item flex justify-between items-center">
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
import { onMounted, onUnmounted } from "vue";
import { useUiStore } from "@/stores/ui";

// 使用Pinia仓库
const uiStore = useUiStore();

/**
 * 处理ESC键关闭设置模态框
 */
function handleKeyDown(event) {
  if (event.key === "Escape" && uiStore.showHelpModal) {
    uiStore.closeHelpModal();
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

/* 改善整体布局，使内容更宽敞 */
.help-modal {
  max-height: 80vh; /* 限制最大高度 */
}

.modal-body {
  padding: 2rem !important; /* 增加内边距 */
  line-height: 1.8; /* 增加行高，使排版更舒适 */
}

.shortcut-section {
  margin-bottom: 2rem; /* 增加章节间距 */
}

/* 标题样式 - 亮色模式 */
.shortcut-section h4 {
  color: #4a5568 !important; /* 与快捷键颜色一致的深灰色 */
  margin-bottom: 1rem; /* 增加标题下方间距 */
  font-size: 1.1rem;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0; /* 稍微加粗边框 */
  padding-bottom: 0.5rem;
}

/* 快捷键项样式 */
.shortcut-item {
  padding: 0.75rem 0; /* 增加行间距 */
  border-bottom: 1px solid #f1f5f9; /* 添加淡色分隔线 */
}

.shortcut-item:last-child {
  border-bottom: none;
}

/* 快捷键组合样式 */
.key-combo {
  font-weight: 600;
  min-width: 160px; /* 增加最小宽度，使对齐更整齐 */
  display: inline-block;
}

/* 描述文本样式 */
.description {
  font-size: 1rem; /* 稍微增大字体 */
  color: #6b7280 !important;
}

/* 暗黑模式适配 */
.dark-mode .help-modal {
  background-color: var(--modal-bg) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--modal-border) !important;
  box-shadow: var(--modal-shadow) !important;
}

.dark-mode .modal-header {
  border-color: var(--modal-border) !important;
  background-color: var(--modal-header-bg) !important;
}

.dark-mode .modal-header h3 {
  color: var(--modal-title-color) !important;
}

.dark-mode .modal-body {
  background-color: var(--modal-bg) !important;
}

/* 暗黑模式下的标题颜色 - 与快捷键颜色一致 */
.dark-mode .shortcut-section h4 {
  color: var(--modal-title-color) !important; /* 使用最亮的颜色，与快捷键一致 */
  border-bottom: 2px solid var(--modal-border) !important;
}

/* 暗黑模式下的快捷键样式 */
.dark-mode kbd {
  background-color: var(--modal-input-bg) !important;
  border: 1px solid var(--modal-input-border) !important;
  color: var(--modal-title-color) !important;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark-mode .key-combo {
  color: var(--modal-title-color) !important; /* 与标题相同的亮色 */
  font-weight: 600;
}

.dark-mode .description {
  color: var(--modal-label-color) !important;
}

/* 暗黑模式下的分隔线 */
.dark-mode .shortcut-item {
  border-bottom: 1px solid var(--modal-border);
}

.dark-mode .shortcut-item:last-child {
  border-bottom: none;
}

/* 关闭按钮增强 */
.dark-mode .modal-header button {
  color: var(--text-secondary) !important;
}

.dark-mode .modal-header button:hover {
  color: #ff6b6b !important;
  background-color: rgba(255, 107, 107, 0.1);
}

.dark-mode .modal-footer {
  border-color: var(--modal-border) !important;
  background-color: var(--modal-footer-bg) !important;
}

.dark-mode .modal-footer button {
  background-color: var(--modal-button-bg) !important;
  color: var(--modal-button-text) !important;
  border: 1px solid var(--modal-button-bg);
}

.dark-mode .modal-footer button:hover {
  background-color: var(--modal-button-hover) !important;
}

/* 特别强调导航相关的快捷键 */
.dark-mode .help-section li:contains('导航'),
.dark-mode .help-section li:contains('视图'),
.dark-mode .help-section li:contains('切换') {
  color: var(--modal-title-color) !important;
}

/* 列表样式增强 */
.dark-mode .help-section ul {
  border-left: 2px solid var(--modal-border);
  padding-left: 1rem;
}

.dark-mode .shortcut-item {
  border-bottom: 1px solid var(--modal-border);
  padding: 0.75rem 0; /* 增加行间距 */
}

.dark-mode .shortcut-item:last-child {
  border-bottom: none;
}

/* 改善整体布局，使内容更紧凑 */
.help-modal {
  max-height: 80vh; /* 限制最大高度 */
}

.modal-body {
  padding: 1.5rem !important; /* 减小内边距 */
  line-height: 1.6; /* 优化行高 */
}

.help-section {
  margin-bottom: 1.5rem; /* 减小章节间距 */
}

.help-section h3 {
  margin-bottom: 0.75rem; /* 减小标题下方间距 */
  font-size: 1.1rem; /* 稍微减小标题字体 */
}

.help-section ul {
  margin-bottom: 1rem; /* 减小列表下方间距 */
}

.help-section li {
  margin-bottom: 0.5rem; /* 减小列表项间距 */
  font-size: 0.9rem; /* 稍微减小正文字体 */
}

/* 特殊样式：让快捷键组合更突出 */
.dark-mode .shortcut-item .key-combo {
  display: inline-block;
  min-width: 120px; /* 设置最小宽度，对齐更整齐 */
}
</style>
