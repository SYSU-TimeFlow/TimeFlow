<!-- 
 @component FeedBackPage.vue
 @description: 用户反馈页面组件，负责展示用户反馈问卷的模态框界面，通过iframe嵌入外部问卷系统，提供用户反馈收集功能。
 
 主要功能：
 1. 展示反馈问卷弹窗
 2. 嵌入外部问卷系统
 3. 提供关闭交互功能
 4. 背景遮罩和模糊效果
 5. 点击外部区域关闭
-->

<template>
  <!-- 反馈问卷弹窗 - 模态框背景遮罩 -->
  <div
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.showFeedbackModal = false"
  >
    <!-- 反馈模态框主体 - 阻止事件冒泡到父级 -->
    <div class="feedback-modal w-[600px] h-[600px] relative" @click.stop>
      <!-- 关闭按钮 - 位于右上角 -->
      <button
        @click="uiStore.showFeedbackModal = false"
        class="modal-close-btn absolute top-0 right-0 z-10"
        title="关闭"
      >
        <i class="fas fa-times"></i>
      </button>
      <!-- 问卷iframe - 嵌入外部问卷系统 -->
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
/* 背景模糊效果兼容性处理 */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.1);
}
</style>
