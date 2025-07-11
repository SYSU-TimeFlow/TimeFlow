<template>
  <!-- 反馈问卷弹窗 -->
  <div
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.showFeedbackModal = false"
  >
    <div class="feedback-modal w-[600px] h-[600px] relative" @click.stop>
      <!-- 关闭按钮 -->
      <button
        @click="uiStore.showFeedbackModal = false"
        class="modal-close-btn absolute top-0 right-0 z-10"
        title="关闭"
      >
        <i class="fas fa-times"></i>
      </button>
      <!-- 问卷iframe -->
      <iframe
        src="https://www.wjx.cn/vm/QmIwc3u.aspx"
        class="w-full h-full"
        frameborder="0"
        onload="this.contentWindow.document.body.style.backgroundColor = 'black';"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useUiStore } from "../../stores/ui";

// 使用Pinia仓库
const uiStore = useUiStore();
const modalRef = ref(null);
</script>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
}
</style>
