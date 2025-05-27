<!-- 
 @component: App.vue 应用的根组件
 @description: 该组件是 Vue 应用的入口点，包含了路由视图和其他全局组件。 
-->
<script setup>
import { onMounted } from 'vue';
import { useSettingStore } from './stores/setting';

// 在应用挂载时应用主题
onMounted(() => {
  const settingStore = useSettingStore();
  settingStore.applyTheme(settingStore.themeMode);
});
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
@import './styles/style.css';
@import './styles/theme.css';

.app-container {
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
