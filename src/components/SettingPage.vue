<!--
  @component: Setting
  @description: 设置页面组件，提供主题、字号、图标风格、通知、声音、日期时间、语言等个性化选项的配置界面。
  用户可通过本组件自定义应用外观和行为，所有设置项统一使用Pinia进行状态管理。
  @author: lijzh89
  @modified: duxuan
  @date: 2025-05-24
-->

<template>
  <!-- 模态框容器，仅当 showSettings 为 true 时显示 -->
  <div
    v-if="uiStore.showSettings"
    class="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50"
    @click="uiStore.closeSettings()"
  >
    <!-- 设置弹窗主容器，阻止点击事件冒泡 -->
    <div
      class="settings-container bg-white rounded-lg shadow-lg w-[448px] max-w-[90vw] p-6 relative overflow-y-auto"
      style="max-height: 90vh"
      @click.stop
    >
      <!-- 右上角按钮组 -->
      <div class="absolute top-4 right-4 flex space-x-2 z-10">
        <!-- 关闭按钮 -->
        <button
          class="text-red-500 hover:text-red-700 cursor-pointer text-xl transition"
          @click="uiStore.closeSettings"
          title="关闭"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <h2 class="text-2xl font-semibold mb-6">设置</h2>
      <!-- 空一行 -->
      <div class="text-gray-700"></div>
      <!-- 通用小标题 -->
      <div class="text-gray-500 text-sm font-semibold mb-2 mt-2">通用</div>
      <!-- 主题切换（选择条，选项为亮/暗） -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
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
          主题
        </span>
        <select
          v-model="settingStore.themeMode"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @change="applyThemeChange"
        >
          <option value="light">亮</option>
          <option value="dark">暗</option>
        </select>
      </div>
      <!-- 字号选择 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
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
          字号
        </span>
        <select
          v-model="settingStore.fontSize"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @change="applyFontSizeChange"
        >
          <option value="small">小</option>
          <option value="medium">中</option>
          <option value="large">大</option>
        </select>
      </div>
      <!-- 图标选择 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
          <!-- 使用字号的图标，颜色保持 text-pink-500 -->
          <svg
            class="w-5 h-5 mr-2 text-pink-500"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 20h16M4 4h16M4 4v16M20 4v16"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          图标
        </span>
        <select
          v-model="settingStore.iconStyle"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="default">默认</option>
          <option value="filled">填充</option>
          <option value="outlined">线性</option>
        </select>
      </div>
      <!-- 通知开关 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
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
          通知
        </span>
        <input
          type="checkbox"
          v-model="settingStore.notifications"
          class="toggle-checkbox accent-blue-600"
        />
      </div>
      <!-- 通知声音 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
          <!-- 音符图标 -->
          <svg
            class="w-5 h-5 mr-2 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 18V5l12-2v13"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="6" cy="18" r="3" fill="currentColor" opacity="0.2" />
            <circle cx="18" cy="16" r="3" fill="currentColor" opacity="0.2" />
          </svg>
          通知声音
        </span>
        <input
          type="checkbox"
          v-model="settingStore.notificationSound"
          class="toggle-checkbox accent-blue-600"
        />
      </div>
      <!-- 声效开关 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
          <svg
            class="w-5 h-5 mr-2 text-indigo-500"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 19V6l-2 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2l2 2zm7-2a4 4 0 000-8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          声效
        </span>
        <input
          type="checkbox"
          v-model="settingStore.soundEffect"
          class="toggle-checkbox accent-blue-600"
        />
      </div>
      <!-- 空一行 -->
      <div class="text-gray-700"></div>
      <!-- 日期和时间小标题 -->
      <div class="text-gray-500 text-sm font-semibold mb-2 mt-2">
        日期和时间
      </div>
      <!-- 每周起始日 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
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
          每周起始日
        </span>
        <select
          v-model="settingStore.weekStart"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="0">星期日</option>
          <option value="1">星期一</option>
          <option value="2">星期二</option>
          <option value="3">星期三</option>
          <option value="4">星期四</option>
          <option value="5">星期五</option>
          <option value="6">星期六</option>
        </select>
      </div>
      <!-- 24小时制 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
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
          24时制
        </span>
        <input
          type="checkbox"
          v-model="settingStore.hour24"
          class="toggle-checkbox accent-blue-600"
        />
      </div>
      <!-- 农历开关 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
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
          农历
        </span>
        <input
          type="checkbox"
          v-model="settingStore.showLunar"
          class="toggle-checkbox accent-blue-600"
        />
      </div>
      <!-- 空一行 -->
      <div class="text-gray-700"></div>
      <!-- 其他小标题 -->
      <div class="text-gray-500 text-sm font-semibold mb-2 mt-2">其他</div>
      <!-- 系统同步 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
          <svg
            class="w-5 h-5 mr-2 text-teal-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          系统同步
        </span>
        <input
          type="checkbox"
          v-model="settingStore.synced"
          class="toggle-checkbox accent-blue-600"
        />
      </div>

      <!-- 空一行 -->
      <div class="text-gray-700"></div>
      <!-- 联系我们小标题 -->
      <div class="text-gray-500 text-sm font-semibold mb-2 mt-2">联系我们</div>
      <!-- 关于 -->
      <div class="mb-4 flex items-center justify-between">
        <span class="flex items-center text-gray-700">
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
          关于
        </span>
        <span class="text-gray-500 text-sm"
          >TimeFlow 日历 v1.0.0<br />作者：SYSU-TimeFlow</span
        >
      </div>

      <!-- 按钮区域 -->
      <div class="mt-6 flex gap-3">
        <!-- 重置按钮 -->
        <button
          class="w-3/3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer !rounded-button whitespace-nowrap font-medium"
          @click="resetSettings"
        >
          重置默认
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
import { useSettingStore } from "../stores/setting";
import { useUiStore } from "../stores/ui";

// 使用Pinia仓库
const settingStore = useSettingStore();
const uiStore = useUiStore();
const showToast = ref(false);
const toastMessage = ref("设置已保存！");
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
  toastMessage.value = "已重置为默认设置";
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
/* 修改字号相关的样式 */
.settings-title {
  font-size: var(--heading-font-size);
}

.settings-section-title {
  font-size: var(--subheading-font-size);
}

.settings-label {
  font-size: var(--base-font-size);
}

.settings-description {
  font-size: var(--small-text-font-size);
}

/* 组件样式，圆角、阴影、滚动条、动画等 */
.settings-container {
  min-width: 320px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  transition: all 0.3s;
  animation: fadeIn 0.1s ease-out;
  background-color: var(--modal-bg);
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* 深色模式下的设置容器增强 */
.dark-mode .settings-container {
  background-color: var(--modal-bg) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--modal-border) !important;
  box-shadow: var(--modal-shadow) !important;
}

/* 深色模式下的标题增强 */
.dark-mode .settings-container h2 {
  color: var(--modal-title-color) !important;
  border-bottom: 1px solid var(--modal-border);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

/* 深色模式下的标签 */
.dark-mode .text-gray-700 {
  color: var(--modal-label-color) !important;
}

.dark-mode .text-gray-500 {
  color: var(--text-secondary) !important;
}

/* 深色模式下的 select 样式增强 */
.dark-mode select {
  background-color: var(--modal-input-bg) !important;
  color: var(--modal-input-text) !important;
  border: 1px solid var(--modal-input-border) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark-mode select:focus {
  border-color: #58a6ff !important;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
}

.dark-mode select option {
  background-color: var(--modal-input-bg) !important;
  color: var(--modal-input-text) !important;
}

/* 深色模式下的按钮增强 */
.dark-mode button {
  border: 1px solid var(--modal-border);
}

.dark-mode button.bg-blue-600 {
  background-color: var(--modal-button-bg) !important;
  color: var(--modal-button-text) !important;
  border-color: var(--modal-button-bg);
}

.dark-mode button.bg-blue-600:hover {
  background-color: var(--modal-button-hover) !important;
}

.dark-mode button.bg-gray-200 {
  background-color: var(--modal-button-secondary) !important;
  color: var(--text-primary) !important;
  border-color: var(--modal-border);
}

.dark-mode button.bg-gray-200:hover {
  background-color: var(--modal-button-secondary-hover) !important;
}

/* 重置按钮在暗色模式下的绿色样式 */
.dark-mode button.bg-gray-100 {
  background-color: var(--modal-button-bg) !important; /* 使用绿色背景 */
  color: var(--modal-button-text) !important; /* 白色文字 */
  border: 1px solid var(--modal-button-bg) !important;
}

.dark-mode button.bg-gray-100:hover {
  background-color: var(--modal-button-hover) !important; /* 悬停时的亮绿色 */
  border-color: var(--modal-button-hover) !important;
}

/* 开关按钮增强 */
.dark-mode .toggle-checkbox {
  accent-color: #58a6ff;
  filter: brightness(1.2);
}

/* 关闭按钮增强 */
.dark-mode .text-red-500 {
  color: #ff6b6b !important;
}

.dark-mode .text-red-500:hover {
  color: #ff5252 !important;
  background-color: rgba(255, 107, 107, 0.1);
}

/* 图标颜色增强 */
.dark-mode .text-blue-500 {
  color: #58a6ff !important;
}

.dark-mode .text-green-500 {
  color: #56d364 !important;
}

.dark-mode .text-pink-500 {
  color: #f47ac7 !important;
}

.dark-mode .text-yellow-500 {
  color: #ffd33d !important;
}

.dark-mode .text-purple-500 {
  color: #bc8cff !important;
}

.dark-mode .text-orange-500 {
  color: #ff8c42 !important;
}

/* Toast 提示增强 */
.dark-mode .bg-green-500 {
  background-color: var(--modal-button-bg) !important;
}

.dark-mode .bg-blue-500 {
  background-color: #58a6ff !important;
}

/* 定义淡入动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0; /* 动画开始时透明度为0 */
  }
  to {
    opacity: 1; /* 动画结束时透明度为1 */
  }
}

/* 确保背景模糊效果兼容性 */
.backdrop-blur-sm {
  backdrop-filter: blur(4px); /* 轻微高斯模糊，数值可调整 */
  -webkit-backdrop-filter: blur(4px); /* 兼容 Safari */
  background: rgba(0, 0, 0, 0.1); /* 轻微透明黑色，增强模糊可见性 */
}
</style>
