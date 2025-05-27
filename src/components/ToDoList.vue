<!--
  @description 待办事项列表。
  在新建 events 时，也可以同时添加到 Todo List 中。
  实现日历与待办事项的同步。
-->
<template>
  <main class="todo-main flex-1 flex flex-col overflow-hidden">
    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-6xl mx-auto flex flex-col items-center">
        <!-- 标题区 -->
        <h1 class="text-3xl font-bold text-indigo-600 text-center mb-10">
          To-Do
        </h1>
      </div>
      <!-- 过滤器区域使用计算属性过滤事件 -->
      <div class="w-full mb-6 flex justify-center gap-4">
        <button
          v-for="filter in ['全部', '未完成', '已完成']"
          :key="filter"
          @click="currentFilter = filter"
          class="px-4 py-2 rounded-xl transition cursor-pointer"
          :class="{
            'bg-indigo-600 text-white': currentFilter === filter,
            'bg-gray-100 text-gray-700 hover:bg-gray-200':
              currentFilter !== filter,
          }"
        >
          {{ filter }}
        </button>
      </div>

      <!-- 待办事项列表改用 eventStore 的事件 -->
      <div class="w-full space-y-4">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          @click="toggleEventComplete(event)"
          class="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border"
          :class="{
            'border-red-500': event.id % 3 === 0,
            'border-orange-500': event.id % 3 === 1,
            'border-green-500': event.id % 3 === 2,
            'opacity-70 bg-gray-50': event.completed,
          }"
        >
          <div class="flex items-center gap-4">
            <!-- 完成状态复选框 -->
            <input
              type="checkbox"
              :checked="event.completed || false"
              @click.stop="toggleEventComplete(event)"
              class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div>
              <!-- 任务标题 - 完成时显示删除线 -->
              <div
                class="font-medium"
                :class="{ 'line-through text-gray-500': event.completed }"
              >
                {{ event.title }}
              </div>
              <!-- 格式化显示的截止日期 -->
              <div class="text-sm text-gray-500">
                {{ settingStore.formatEventTime(event) }}
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <!-- 编辑按钮 -->
            <button
              @click.stop="eventStore.openEventDetails(event)"
              class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
            >
              <i class="fas fa-pen fa-sm"></i>
            </button>

            <!-- 删除按钮 -->
            <button
              @click.stop="eventStore.deleteEvent(0)"
              class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <i class="fas fa-trash-alt fa-sm"></i>
            </button>
          </div>
        </div>

        <!-- 空状态提示：当没有待办事项时显示 -->
        <div
          v-if="filteredEvents.length === 0"
          class="text-gray-400 text-center py-12"
        >
          <i class="fas fa-inbox text-3xl mb-2"></i>
          {{ emptyMessage }}
        </div>
      </div>
    </div>

    <!-- 添加新待办事项按钮 -->
    <button
      @click="eventStore.openNewTodoModal"
      class="fixed right-6 bottom-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition"
    >
      <i class="fas fa-plus text-xl"></i>
    </button>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useEventStore } from "../stores/event";
import { useSettingStore } from "../stores/setting";

const eventStore = useEventStore();
const settingStore = useSettingStore();

// 使用本地 filter 状态
const currentFilter = ref("全部");

// 过滤待办事件
const filteredEvents = computed(() => {
  // 只获取标记为 addToTodo 的事件
  let events = eventStore.events.filter((event) => event.eventType === "todo");

  switch (currentFilter.value) {
    case "已完成":
      return events.filter((event) => event.completed || false); // 添加 || false 作为默认值
    case "未完成":
      return events.filter((event) => !event.completed);
    default:
      return events;
  }
});

// 空状态消息
const emptyMessage = computed(() => {
  switch (currentFilter.value) {
    case "已完成":
      return "暂无已完成事项";
    case "未完成":
      return "暂无未完成事项";
    default:
      return "暂无待办事项";
  }
});

// 切换完成状态
function toggleEventComplete(event: any) {
  // 确保 completed 属性存在
  if (typeof event.completed === "undefined") {
    event.completed = false;
  }
  event.completed = !event.completed;
  eventStore.saveEvent();
}
</script>
