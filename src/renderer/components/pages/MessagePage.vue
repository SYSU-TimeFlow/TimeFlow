<!--
 @component MessagePage.vue
 @description
  消息页面模态框。
  用于显示应用内的消息和通知。
-->
<template>
  <!-- 模态框容器，仅当 showMessageModal 为 true 时显示 -->
  <div
    v-if="uiStore.showMessageModal"
    :class="['message-modal-root', settingStore.themeMode]"
    class="fixed inset-0 flex items-center justify-center z-50"
    style="background: rgba(0, 0, 0, 0.18); backdrop-filter: blur(2px)"
    @click="uiStore.closeMessageModal"
  >
    <!-- 弹窗主容器，阻止点击事件冒泡 -->
    <div
      class="message-modal-content relative overflow-y-auto transition-all duration-300 flex flex-col items-center"
      style="
        min-width: 320px;
        max-width: 90vw;
        max-height: 90vh;
        padding: 32px 36px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
        border-radius: 16px;
      "
      @click.stop
    >
      <!-- 头部 -->
      <h3
        class="message-modal-title text-xl font-semibold mb-4 text-center"
        style="letter-spacing: 0.5px"
      >
        {{ uiStore.messageModalTitle }}
      </h3>
      <!-- 主体 -->
      <div
        class="modal-body text-base text-center mb-6 message-modal-body"
        style="min-width: 220px; background: inherit"
      >
        {{ uiStore.messageModalContent }}
      </div>
      <!-- 底部按钮区 -->
      <div class="flex gap-4 justify-center w-full">
        <button
          v-if="uiStore.messageModalType === 'confirm'"
          class="modal-save-btn w-28 h-10"
          style="font-weight: 500; font-size: 1.08rem"
          @click="uiStore.handleMessageConfirm"
        >
          确定
        </button>
        <button
          v-if="uiStore.messageModalType === 'confirm'"
          class="modal-cancel-btn w-28 h-10"
          style="
            font-weight: 500;
            font-size: 1.08rem;
            background: #eee;
            color: #444;
          "
          @click="uiStore.closeMessageModal"
        >
          取消
        </button>
        <button
          v-if="uiStore.messageModalType === 'info'"
          class="modal-save-btn w-28 h-10"
          style="font-weight: 500; font-size: 1.08rem"
          @click="uiStore.closeMessageModal"
        >
          确定
        </button>
      </div>
      <!-- 关闭按钮 -->
      <button
        class="modal-close-btn absolute top-3 right-3"
        @click="uiStore.closeMessageModal"
        title="关闭"
        style="padding: 2px"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from "../../stores/ui";
import { useSettingStore } from "../../stores/setting";
const uiStore = useUiStore();
const settingStore = useSettingStore();
</script>

<style scoped>
.message-modal-root.light .message-modal-content {
  background: #fff;
  color: #222;
}
.message-modal-root.dark .message-modal-content {
  background: #23272f;
  color: #f3f3f3;
}
.message-modal-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 12px;
}
.message-modal-body {
  font-size: 1rem;
  margin-bottom: 20px;
  text-align: center;
  background: inherit;
}
.modal-save-btn {
  padding: 6px 24px;
  border: none;
  border-radius: 6px;
  background: #4a86e8;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}
.modal-save-btn:hover {
  background: #3c78d8;
}
.modal-cancel-btn {
  padding: 6px 24px;
  border: none;
  border-radius: 6px;
  background: #eee;
  color: #444;
  font-size: 1rem;
  cursor: pointer;
}
.modal-cancel-btn:hover {
  background: #ddd;
}
.modal-close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 1.2rem;
  cursor: pointer;
}
.modal-close-btn:hover {
  color: #e63946;
}
</style>
