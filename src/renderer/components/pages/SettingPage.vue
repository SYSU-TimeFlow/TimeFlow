<!--
  @component: Setting
  @description: 设置页面组件，提供主题、字号、图标风格、通知、声音、日期时间、语言等个性化选项的配置界面。
  用户可通过本组件自定义应用外观和行为，所有设置项统一使用Pinia进行状态管理。
  @author: lijzh89
  @modified: liaohr
  @date: 2025-06-07
-->

<template>
  <!-- 模态框容器，仅当 showSettings 为 true 时显示 -->
  <div
    v-if="uiStore.showSettings"
    class="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.closeSettings()"
  >
    <!-- 设置弹窗主容器，阻止点击事件冒泡 -->
    <div
      class="settings-container rounded-lg shadow-lg w-[448px] max-w-[90vw] relative overflow-y-auto transition-all duration-300"
      style="max-height: 90vh"
      @click.stop
    >
      <!-- 模态框头部 -->
      <div class="modal-header p-6 pb-0 relative">
        <h3 class="text-2xl font-semibold">Settings</h3>
        <!-- 关闭按钮 -->
        <button
          class="modal-close-btn absolute top-4 right-4"
          @click="uiStore.closeSettings"
          title="Close"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 模态框主体 -->
      <div class="modal-body p-6">
        <!-- 通用小标题 -->
        <div class="text-secondary text-sm font-semibold mb-2 mt-2">
          General
        </div>

        <!-- 主题切换（选择条，选项为亮/暗） -->
        <div class="form-group mb-4 flex items-center justify-between">
          <label class="flex items-center">
            <!-- 月亮图标 -->
            <svg
              class="w-5 h-5 mr-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Theme
          </label>
          <select
            v-model="settingStore.themeMode"
            class="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="applyThemeChange"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <!-- 字号选择 -->
        <div class="form-group mb-4 flex items-center justify-between">
          <label class="flex items-center">
            <!-- 小A大A图标 -->
            <svg
              class="w-5 h-5 mr-2 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <text
                x="2"
                y="19"
                font-size="10"
                fill="currentColor"
                font-family="Arial"
              >
                A
              </text>
              <text
                x="12"
                y="19"
                font-size="16"
                fill="currentColor"
                font-family="Arial"
              >
                A
              </text>
            </svg>
            Font Size
          </label>
          <select
            v-model="settingStore.fontSize"
            class="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="applyFontSizeChange"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <!-- 通知开关 -->
        <div class="form-group mb-4 flex items-center justify-between">
          <label class="flex items-center">
            <svg
              class="w-5 h-5 mr-2 text-yellow-500"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Notifications
          </label>
          <input
            type="checkbox"
            v-model="settingStore.notifications"
            class="toggle-checkbox accent-blue-600"
          />
        </div>

        <!-- 日期和时间小标题 -->
        <div class="text-secondary text-sm font-semibold mb-2 mt-6">
          Date & Time
        </div>

        <!-- 每周起始日 -->
        <div class="form-group mb-4 flex items-center justify-between">
          <label class="flex items-center">
            <!-- 周历图标 -->
            <svg
              class="w-5 h-5 mr-2 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="16"
                rx="3"
                fill="currentColor"
                opacity="0.15"
              />
              <rect
                x="3"
                y="8"
                width="18"
                height="12"
                rx="2"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
              <circle cx="8" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="16" cy="12" r="1" fill="currentColor" />
            </svg>
            Week Start
          </label>
          <select
            v-model="settingStore.weekStart"
            class="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
        </div>

        <!-- 24小时制 -->
        <div class="form-group mb-4 flex items-center justify-between">
          <label class="flex items-center">
            <svg
              class="w-5 h-5 mr-2 text-orange-500"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path
                d="M12 6v6l4 2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            24-Hour Format
          </label>
          <input
            type="checkbox"
            v-model="settingStore.hour24"
            class="toggle-checkbox accent-blue-600"
          />
        </div>

        <!-- 农历开关 -->
        <div class="form-group mb-4 flex items-center justify-between">
          <label class="flex items-center">
            <!-- 日历图标 -->
            <svg
              class="w-5 h-5 mr-2 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="16"
                rx="2"
                fill="currentColor"
                opacity="0.15"
              />
              <rect
                x="3"
                y="8"
                width="18"
                height="12"
                rx="2"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
              <line
                x1="7"
                y1="4"
                x2="7"
                y2="8"
                stroke="currentColor"
                stroke-width="2"
              />
              <line
                x1="17"
                y1="4"
                x2="17"
                y2="8"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            Lunar Calendar
          </label>
          <input
            type="checkbox"
            v-model="settingStore.showLunar"
            class="toggle-checkbox accent-blue-600"
          />
        </div>

        <!-- 联系我们小标题 -->
        <div class="text-secondary text-sm font-semibold mb-2 mt-6">
          Contact Us
        </div>

        <!-- 关于 -->
        <div class="form-group mb-4 flex items-center justify-between">
          <label class="flex items-center">
            <svg
              class="w-5 h-5 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path
                d="M12 16v-4m0-4h.01"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            About
          </label>
          <span class="text-secondary text-sm"
            >TimeFlow Calendar v1.0.0<br />Author: SYSU-TimeFlow</span
          >
        </div>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer p-6 pt-0">
        <!-- 重置按钮 -->
        <button class="modal-save-btn w-full" @click="resetSettings">
          Reset to Default
        </button>
      </div>

      <!-- 自动消失的提示 -->
      <transition name="fade">
        <div
          v-if="showToast"
          class="fixed left-1/2 top-20 -translate-x-1/2 px-6 py-2 rounded shadow-lg z-50"
          :class="[
            toastType === 'success' ? 'bg-green-500' : 'bg-blue-500',
            'text-white',
          ]"
        >
          {{ toastMessage }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useSettingStore } from "../../stores/setting";
import { useUiStore } from "../../stores/ui";

// 使用Pinia仓库
const settingStore = useSettingStore();
const uiStore = useUiStore();
const showToast = ref(false);
const toastMessage = ref("Settings saved!");
const toastType = ref("success");

/**
 * 处理ESC键关闭设置模态框
 */
function handleKeyDown(event) {
  if (event.key === "Escape" && uiStore.showSettings) {
    uiStore.closeSettings();
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});

/**
 * 重置设置到默认值
 * 显示一个提示，告知用户设置已重置
 */
function resetSettings() {
  // 使用store的方法重置设置
  settingStore.resetSettings();

  // 显示提示
  toastMessage.value = "Reset to default settings";
  toastType.value = "info";
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2500);
}

/**
 * 立即应用主题变化，而不等待保存
 */
function applyThemeChange() {
  settingStore.applyTheme(settingStore.themeMode);
}

/**
 * 立即应用字号变化，而不等待保存
 */
function applyFontSizeChange() {
  settingStore.applyFontSize(settingStore.fontSize);
}
</script>

<style scoped>
/* 
  组件特定的基础样式和动画。
  大部分主题化（包括暗黑模式）现在由 theme.css 统一处理。
*/
.settings-container {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  animation: fadeIn 0.1s ease-out;
}

/* 定义淡入动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
