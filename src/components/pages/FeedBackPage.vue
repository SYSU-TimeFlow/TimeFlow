<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useUiStore } from "@/stores/ui";

// 使用Pinia仓库
const uiStore = useUiStore();
const modalRef = ref(null);
</script>

<template>
  <!-- 反馈问卷弹窗 -->
  <div
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.showFeedbackModal = false"
  >
    <div class="feedback-modal rounded-lg w-[600px] h-[600px] relative" @click.stop>
      <!-- 关闭按钮 -->
      <button
        @click="uiStore.showFeedbackModal = false"
        class="absolute right-2 top-2 w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800"
      >
        <i class="fas fa-times text-xl"></i>
      </button>
      <!-- 问卷iframe -->
      <iframe
        src="https://www.wjx.cn/vm/QmIwc3u.aspx"
        class="w-full h-full rounded-lg"
        frameborder="0"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
}

.feedback-modal {
  background-color: var(--modal-bg);
}
</style>
