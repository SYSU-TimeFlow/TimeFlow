<!-- 
 @component Categories.vue
 @description: 事件分类组件，用于显示和选择事件的分类。 
-->

<template>
  <!-- 分类组件根元素 -->
  <div
    class="categories mx-4 my-3"
    :class="settingStore.themeMode === 'dark' ? 'dark-theme' : 'light-theme'"
    :style="{ fontSize: fontSize }"
  >
    <!-- 分类头部区域，仅在侧边栏未折叠时显示 -->
    <div
      v-if="!uiStore.sidebarCollapsed"
      class="flex items-center justify-between mb-2"
    >
      <span class="text-sm font-medium text-gray-700">Categories</span>
      <!-- 添加新分类按钮 -->
      <button
        @click="eventStore.openNewCategoryModal"
        class="text-gray-500 hover:text-gray-700 cursor-pointer !rounded-button whitespace-nowrap"
        title="添加新分类"
      >
        <i class="fas fa-plus text-xs"></i>
      </button>
    </div>
    <!-- 分类列表区域 -->
    <div class="flex flex-col space-y-1">
      <!-- 遍历 categories 数组，为每个分类创建一个条目 -->
      <div
        v-for="category in eventStore.categories"
        :key="category.id"
        :class="[
          'category-item flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-200',
          category.active ? '' : 'opacity-50', // 如果分类未激活，则降低其不透明度
        ]"
      >
        <!-- 点击圆点切换激活状态 -->
        <span
          :class="[
            'category-color w-3 h-3 rounded-full',
            uiStore.sidebarCollapsed ? '' : 'mr-3', // 侧边栏折叠时不显示右边距
          ]"
          :style="{ backgroundColor: category.color }"
          @click="eventStore.toggleCategory(category.id)"
        ></span>
        <!-- 分类名称，仅在侧边栏未折叠时显示 -->
        <span
          v-if="!uiStore.sidebarCollapsed"
          class="text-sm flex-1"
          @click="eventStore.toggleCategory(category.id)"
        >
          {{ category.name }}
        </span>
        <!-- 编辑按钮，仅在侧边栏未折叠且鼠标悬停时显示 -->
        <button
          v-if="!uiStore.sidebarCollapsed"
          @click="eventStore.openCategoryDetails(category)"
          class="edit-button text-gray-400 hover:text-gray-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          title="编辑分类"
        >
          <i class="fas fa-edit text-xs"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEventStore } from "../stores/event";
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";
import { computed } from "vue";

// 使用Pinia仓库
const eventStore = useEventStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();

// 计算字体大小
const fontSize = computed(() => {
  switch (settingStore.fontSize) {
    case "large":
      return "20px";
    case "medium":
      return "18px";
    case "small":
      return "16px";
    default:
      return "18px";
  }
});
</script>

<style scoped>
.category-item {
  position: relative;
}

.category-item:hover .edit-button {
  opacity: 1 !important;
}

.edit-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.dark-theme {
  background-color: #131723;
  color: #ffffff;
}

.dark-theme .category-item:hover {
  background-color: #898989;
}

.dark-theme .text-gray-700,
.dark-theme .text-gray-500,
.dark-theme .text-gray-400,
.dark-theme .text-gray-600 {
  color: #ffffff;
}

.categories {
  font-size: v-bind("fontSize");
}

/* 调整各个元素的字体大小比例 */
.category-title {
  font-size: 1.2em;
}

.category-item {
  font-size: 1em;
}

.category-name {
  font-size: 1em;
}

.category-count {
  font-size: 0.9em;
}
</style>
