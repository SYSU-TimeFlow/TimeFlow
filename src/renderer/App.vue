<!--
  @file App.vue
  @component 应用根组件
  @description Vue 应用的入口点，负责全局样式、主题、字号初始化，以及主进程消息监听和路由视图挂载。
  为什么这样做：
  - 通过 onMounted 钩子在应用启动时加载并应用用户设置，保证界面风格和体验一致。
  - 监听主进程 show-info-message 事件，实现跨进程消息通知，提升用户交互体验。
  - 使用 <router-view /> 挂载路由视图，支持页面切换和模块化开发。
  - 全局样式统一引入，保证主题、字号、配色等一致性，便于维护和扩展。
  - 根容器样式保证应用自适应窗口，提升视觉一致性和响应式体验。
-->

<script setup>
import { onMounted } from "vue";
import { useSettingStore } from "./stores/setting";
import { useUiStore } from "./stores/ui";

// 在应用挂载时应用主题和字号
onMounted(async () => {
  const settingStore = useSettingStore();
  
  // 先加载设置
  await settingStore.loadSettings();
  
  settingStore.applyTheme(settingStore.themeMode);
  settingStore.applyFontSize(settingStore.fontSize);

  // 新增：监听主进程 show-info-message 事件
  const uiStore = useUiStore();
  if (window.electronAPI && window.electronAPI.on) {
    window.electronAPI.on("show-info-message", (_event, message) => {
      uiStore.showInfoMessage("提示", message);
    });
  }
});
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
@import "./styles/style.css";
@import "./styles/theme.css";
@import "./styles/font-size.css";

.app-container {
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
