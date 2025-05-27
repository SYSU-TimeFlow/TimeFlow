<!-- 
 @component: App.vue 应用的根组件
 @description: 该组件是 Vue 应用的入口点，包含了路由视图和其他全局组件。 
-->
<script setup>
import { onMounted, watch } from "vue";
import { useSettingStore } from "./stores/setting";

const settingStore = useSettingStore();

// 在应用挂载时应用主题和字号
onMounted(() => {
  settingStore.applyTheme(settingStore.themeMode);
  settingStore.applyFontSize(settingStore.fontSize);
});

// 监听字号变化
watch(
  () => settingStore.fontSize,
  (newSize) => {
    settingStore.applyFontSize(newSize);
  }
);
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
  font-size: var(--text-size);
}

/* 应用字号到所有标题 */
h1 {
  font-size: var(--heading-1-size);
}

h2 {
  font-size: var(--heading-2-size);
}

h3 {
  font-size: var(--heading-3-size);
}

/* 应用字号到所有文本 */
p,
span,
div {
  font-size: var(--text-size);
}

/* 小号文本 */
.text-sm {
  font-size: var(--text-small-size);
}
</style>
