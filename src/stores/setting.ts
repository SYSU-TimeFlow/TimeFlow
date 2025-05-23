import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingStore = defineStore('setting', () => {
  // 系统同步状态
  const synced = ref(true);
  
  // 同步设置
  function toggleSync() {
    synced.value = !synced.value;
  }
  
  // 可以在这里添加更多的应用设置，比如主题、语言等
  const theme = ref('light'); // light或dark
  const language = ref('zh-CN');
  
  function setTheme(newTheme: string) {
    theme.value = newTheme;
    // 可以在这里添加应用主题的逻辑
  }
  
  function setLanguage(newLanguage: string) {
    language.value = newLanguage;
    // 可以在这里添加应用语言的逻辑
  }

  return {
    synced,
    theme,
    language,
    toggleSync,
    setTheme,
    setLanguage
  };
});