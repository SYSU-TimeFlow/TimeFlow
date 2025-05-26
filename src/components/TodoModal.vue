<!-- 编辑 todo 事项模态框 -->
<template>
  <div
    v-if="eventStore.showTodoModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- 高斯模糊背景 -->
    <div
      class="absolute inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm"
      @click="eventStore.closeTodoModal"
    ></div>

    <!-- 模态框内容 -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <h3 class="text-xl font-bold text-indigo-600 mb-4">
        <!-- 根据 isNewTodo 动态显示标题 -->
        {{ eventStore.isNewTodo ? "新建待办事项" : "编辑待办事项" }}
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >任务标题
          </label>
          <input
            v-model="eventStore.currentEvent.title"
            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >截止日期
          </label>
          <input
            v-model="eventStore.currentEvent.end"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <!-- 同步到日历 -->
        <div class="form-group mb-4">
          <div class="flex items-center mb-2">
            <input
              v-model="syncToCalendar"
              type="checkbox"
              id="addToCalendar"
              class="mr-2"
            />
            <label for="addToCalendar" class="text-sm text-gray-700">
              添加到日历
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            @click="eventStore.closeTodoModal"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            取消
          </button>
          <button
            @click="saveTodoWithSync"
            class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useEventStore, EventType } from "../stores/event";

const eventStore = useEventStore();

// 使用本地变量跟踪是否将待办事项同步到日历
const syncToCalendar = ref(false);

// 当打开编辑模式时，检查当前事件类型并设置同步状态
watch(() => eventStore.showTodoModal, (isOpen) => {
  if (isOpen) {
    // 如果事件类型是BOTH，说明已经同步到了日历
    syncToCalendar.value = eventStore.currentEvent.eventType === EventType.BOTH;
  }
});

// 保存待办事项并处理日历同步
function saveTodoWithSync() {
  // 根据同步复选框设置事件类型
  if (syncToCalendar.value) {
    eventStore.currentEvent.eventType = EventType.BOTH;
  } else {
    eventStore.currentEvent.eventType = EventType.TODO;
  }
  
  eventStore.saveTodo();
}
</script>
