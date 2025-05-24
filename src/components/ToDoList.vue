<!--
  @description 待办事项列表。
  在新建 events 时，也可以同时添加到 Todo List 中。
  新建 todo 事项时，用户也可以手动选择将 todo 事项添加到日历，实现日历与待办事项的同步。
-->
<template>
  <div class="todo-list p-8 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-blue-700 flex items-center">
      <i class="fas fa-list-check mr-2"></i> ToDo 任务列表
    </h2>
    <div v-if="todos.length === 0" class="text-gray-400 text-center py-12">
      <i class="fas fa-inbox text-3xl mb-2"></i>
      <div>暂无待办事项</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const todos = ref([]); // 仅供调试
</script>
