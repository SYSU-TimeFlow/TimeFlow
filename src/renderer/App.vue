<!-- 
 @component: App.vue 应用的根组件
 @description: 该组件是 Vue 应用的入口点，包含了路由视图和其他全局组件。 
-->
<script setup>
import { onMounted } from "vue";
import { useSettingStore } from "./stores/setting";
import { useUiStore } from "./stores/ui";

// 在应用挂载时应用主题和字号
onMounted(() => {
  const settingStore = useSettingStore();
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
