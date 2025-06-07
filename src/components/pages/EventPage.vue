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
      class="event-modal rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-fadeIn"
      @click.stop
      ref="modalRef"
      :class="{ 'animate-shake': eventStore.eventShake }"
    >
      <!-- 模态框头部 -->
      <div
        class="modal-header p-4 border-b flex justify-between items-center"
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
          class="modal-close-btn"
          title="关闭"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- 模态框内容区域 -->
      <div class="modal-body p-4">
        <!-- 标题输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">Title</label>
          <input
            v-model="eventStore.currentEvent.title"
            type="text"
            class="w-full"
            placeholder="Event title"
          />
          <div
            v-if="eventStore.eventTitleError"
            class="text-red-500 text-xs mt-1"
          >
            {{ eventStore.eventTitleError }}
          </div>
        </div>
        <!-- 开始和结束时间输入区域 -->
        <div class="form-row flex space-x-4 mb-4">
          <div class="form-group flex-1">
            <label class="block text-sm font-medium mb-1">Start</label>
            <input
              v-model="eventStore.currentEvent.start"
              type="datetime-local"
              class="w-full"
            />
          </div>
          <div class="form-group flex-1">
            <label class="block text-sm font-medium mb-1">End</label>
            <input
              v-model="eventStore.currentEvent.end"
              type="datetime-local"
              class="w-full"
            />
          </div>
        </div>
        <div v-if="eventStore.eventTimeError" class="text-red-500 text-xs mb-2">
          {{ eventStore.eventTimeError }}
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
            <label for="allDay" class="text-sm">All day</label>
          </div>
        </div>
        <!-- 事件分类选择区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">Category</label>
          <div class="category-selector flex flex-wrap gap-2">
            <!-- 遍历分类列表并显示颜色按钮 -->
            <button
              v-for="category in eventStore.categories"
              :key="category.id"
              :class="[
                'category-option w-8 h-8 rounded-full border-2 cursor-pointer whitespace-nowrap transition-all', // 基础类
                eventStore.currentEvent.categoryId === category.id
                  ? 'border-gray-800' // 亮色模式选中
                  : 'border-transparent', // 亮色模式未选中
              ]"
              :style="{ backgroundColor: category.color }"
              @click="
                eventStore.currentEvent.categoryId = category.id;
                eventStore.currentEvent.categoryColor = category.color;
              "
            ></button>
          </div>
        </div>
        <!-- 事件描述输入区域 -->
        <div class="form-group mb-4">
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea
            v-model="eventStore.currentEvent.description"
            class="w-full h-24"
            placeholder="Event description"
          ></textarea>
        </div>
      </div>
      <!-- 模态框底部，包含操作按钮 -->
      <div
        class="modal-footer p-4 border-t flex justify-end space-x-3"
      >
        <!-- 删除按钮，仅在编辑事件时显示 (isNewEvent 为 false) -->
        <button
          v-if="!eventStore.isNewEvent"
          @click="eventStore.deleteEvent"
          class="modal-del-btn"
        >
          Delete
        </button>
        <!-- 保存按钮 -->
        <button
          @click="eventStore.saveEvent"
          class="modal-save-btn"
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
    if (event.key === "Escape") {
      uiStore.closeEventModal();
    } else if (event.key === "Enter") {
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
/* 
  动画定义保留在此处。
  fadeIn 通过类 .animate-fadeIn 应用。
  shake 通过类 .animate-shake 应用，并动态触发。
*/
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fadeIn {
  animation: fadeIn 0.1s ease-out;
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-8px);
  }
  80% {
    transform: translateX(8px);
  }
  100% {
    transform: translateX(0);
  }
}
.animate-shake {
  animation: shake 0.3s;
}
</style>
