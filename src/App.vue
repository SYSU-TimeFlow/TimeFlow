<!-- 
 @component: App.vue 应用的根组件
 @description: 该组件是 Vue 应用的入口点，包含了路由视图和其他全局组件。 
-->
<script setup>
import { useSettingStore } from "./stores/setting";
import CalendarApp from "./views/CalendarApp.vue";

const settingStore = useSettingStore();
</script>

<template>
  <div
    :class="[
      'app-container',
      settingStore.themeMode === 'dark' ? 'dark-theme' : 'light-theme',
      `font-size-${settingStore.fontSize}`,
    ]"
  >
    <router-view></router-view>

    <!-- <CalendarApp></CalendarApp> -->
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  width: 100%;
}
</style>
