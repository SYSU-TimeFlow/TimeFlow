<!--
  @component: CalendarApp
  @description: App主界面，承载其他子页面。包括侧边栏、主日历视图（月、周、日）、事件创建/编辑模态框以及各种交互功能。
  @author: liaohr
  @modified: duxuan
  @date: 2025-05-24
-->

<template>
  <!-- 主日历应用程序容器 -->
  <div class="calendar-app min-h-screen bg-white text-gray-800 flex flex-col">
    <!-- 应用程序头部 -->
    <header
      class="app-header drag bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between"
    >
      <div class="flex items-center">
        <h1 class="text-xl font-semibold text-gray-800">TimeFlow</h1>
      </div>
      <!-- 窗口控制按钮 (装饰性) -->
      <div class="no-drag window-controls flex items-center space-x-4">
        <button class="text-gray-500 hover:text-gray-700 cursor-pointer">
          <i class="fas fa-bell"></i>
          <!-- 通知图标 -->
        </button>
        <!-- 设置按钮，添加点击事件 -->
        <button
          @click="settingStore.toggleSettings"
          class="text-gray-500 hover:text-gray-700 cursor-pointer"
          title="打开设置"
        >
          <i class="fas fa-cog"></i>
        </button>
        <div class="window-actions flex space-x-2">
          <button
            class="text-gray-500 hover:text-gray-700 cursor-pointer"
            @click="electronAPI.minimize()"
          >
            <i class="fas fa-window-minimize"></i>
            <!-- 最小化图标 -->
          </button>
          <button
            class="text-gray-500 hover:text-gray-700 cursor-pointer"
            @click="electronAPI.maximize()"
          >
            <i class="fas fa-window-maximize"></i>
            <!-- 最大化图标 -->
          </button>
          <button
            class="text-red-500 hover:text-red-700 cursor-pointer"
            @click="electronAPI.close()"
          >
            <i class="fas fa-times"></i>
            <!-- 关闭图标 -->
          </button>
        </div>
      </div>
    </header>
    <!-- 主内容区域，包含侧边栏和日历视图 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏组件 -->
      <Sidebar />
      <!-- 主日历区域组件 -->
      <CalendarMain />
    </div>
    <!-- 事件模态框组件 (用于创建/编辑事件) -->
    <EventModal />

    <!-- 分类模态框组件 (用于创建/编辑分类) -->
    <CategoryModal />

    <!-- 设置模态框，仅在showSettings为true时显示 -->
    <Setting />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import Sidebar from "../components/Sidebar.vue";
import CalendarMain from "../components/CalendarMain.vue";
import EventModal from "../components/EventModal.vue";
import CategoryModal from "../components/CategoryModal.vue"; // 导入分类模态框组件
import Setting from "../components/Setting.vue"; // 导入设置组件
import { useUiStore } from "../stores/ui";
import { useSettingStore } from "../stores/setting";

// 引入preload中定义的electronAPI
// 该API用于与Electron主进程进行通信
const electronAPI = (window as any).electronAPI;

// 使用UI仓库仅用于初始化
const uiStore = useUiStore();
const settingStore = useSettingStore();

// 生命周期钩子
onMounted(() => {
  // 加载设置
  settingStore.loadSettings();

  // 组件挂载后，默认显示今天的日期
  uiStore.goToToday();
});
</script>

<style scoped>
.calendar-app {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

/* 可拖动区域 */
.drag {
  -webkit-app-region: drag;
}

/* 排除拖动区域（如按钮） */
.no-drag {
  -webkit-app-region: no-drag;
}
</style>
