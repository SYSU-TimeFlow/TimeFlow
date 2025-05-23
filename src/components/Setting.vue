<!--
  @component: Setting
  @description: 设置页面组件，提供主题、字号、图标风格、通知、声音、日期时间、语言等个性化选项的配置界面。
  用户可通过本组件自定义应用外观和行为，所有设置项统一收集并可持久化保存。
  @author: lijzh89
  @date: 2025-05-23
-->

<template>
  <!-- 设置弹窗主容器 -->
  <div
    class="settings-container w-[448px] max-w-3xl mx-auto p-6 bg-white rounded-lg shadow relative overflow-y-auto"
    style="max-height: 90vh"
  >
    <!-- 右上角按钮组 -->
    <div class="absolute top-4 right-4 flex space-x-2 z-10">
      <!-- 关闭按钮 -->
      <button
        class="text-red-500 hover:text-red-700 cursor-pointer text-xl transition"
        @click="$emit('close')"
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
        v-model="themeMode"
        class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        v-model="fontSize"
        class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        v-model="iconStyle"
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
        v-model="notifications"
        class="toggle-checkbox accent-blue-600"
      />
    </div>
    <!-- 通知声音 -->
    <div class="mb-4 flex items-center justify-between">
      <span class="flex items-center text-gray-700">
        <!-- 音符图标 -->
        <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24">
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
        v-model="notificationSound"
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
        v-model="soundEffect"
        class="toggle-checkbox accent-blue-600"
      />
    </div>
    <!-- 空一行 -->
    <div class="text-gray-700"></div>
    <!-- 日期和时间小标题 -->
    <div class="text-gray-500 text-sm font-semibold mb-2 mt-2">日期和时间</div>
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
        v-model="weekStart"
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
        v-model="hour24"
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
        v-model="showLunar"
        class="toggle-checkbox accent-blue-600"
      />
    </div>
    <!-- 空一行 -->
    <div class="text-gray-700"></div>
    <!-- 其他小标题 -->
    <div class="text-gray-500 text-sm font-semibold mb-2 mt-2">其他</div>
    <!-- 语言选择 -->
    <div class="mb-4 flex items-center justify-between">
      <span class="flex items-center text-gray-700">
        <!-- Lan字样的图标 -->
        <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24">
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="3"
            fill="currentColor"
            opacity="0.15"
          />
          <text
            x="6"
            y="17"
            font-size="10"
            fill="currentColor"
            font-family="Arial"
          >
            Lan
          </text>
        </svg>
        语言
      </span>
      <select
        v-model="language"
        class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="zh-CN">简体中文</option>
        <option value="en-US">English</option>
      </select>
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
    <!-- 保存按钮 -->
    <button
      class="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer !rounded-button whitespace-nowrap font-medium"
      @click="saveSettings"
    >
      保存设置
    </button>

    <!-- 自动消失的提示 -->
    <transition name="fade">
      <div
        v-if="showToast"
        class="fixed left-1/2 top-20 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded shadow-lg z-50"
      >
        设置已保存！
      </div>
    </transition>
  </div>
</template>

<script setup>
/*
  @section: 变量与响应式数据
  说明：定义所有设置项的响应式变量，并统一收集到 settings 对象，便于保存和读取。
*/
import { ref, computed, onMounted } from "vue";

const themeMode = ref("light"); // 主题模式（亮/暗）
const fontSize = ref("medium"); // 字号
const iconStyle = ref("default"); // 图标风格
const notifications = ref(true); // 通知开关
const notificationSound = ref(false); // 通知声音开关
const soundEffect = ref(false); // 声效开关
const hour24 = ref(false); // 24小时制
const showLunar = ref(false); // 农历显示
const weekStart = ref("0"); // 每周起始日
const language = ref("zh-CN"); // 语言

const emit = defineEmits(["close"]);
const showToast = ref(false);

/*
  @section: 统一设置项收集
  说明：将所有设置项统一收集到 settings 变量，便于整体保存和读取。
*/
const settings = computed(() => ({
  themeMode: themeMode.value,
  fontSize: fontSize.value,
  iconStyle: iconStyle.value,
  notifications: notifications.value,
  notificationSound: notificationSound.value,
  soundEffect: soundEffect.value,
  hour24: hour24.value,
  showLunar: showLunar.value,
  weekStart: weekStart.value,
  language: language.value,
}));

/*
  @section: 打开设置界面时读取已保存的设置
  说明：组件挂载后读取 localStorage 中的设置项，如果存在则填充到表单中。
*/
onMounted(() => {
  const saved = localStorage.getItem("settings");
  if (saved) {
    try {
      const obj = JSON.parse(saved);
      if (obj.themeMode) themeMode.value = obj.themeMode;
      if (obj.fontSize) fontSize.value = obj.fontSize;
      if (obj.iconStyle) iconStyle.value = obj.iconStyle;
      if (typeof obj.notifications === "boolean")
        notifications.value = obj.notifications;
      if (typeof obj.notificationSound === "boolean")
        notificationSound.value = obj.notificationSound;
      if (typeof obj.soundEffect === "boolean")
        soundEffect.value = obj.soundEffect;
      if (typeof obj.hour24 === "boolean") hour24.value = obj.hour24;
      if (typeof obj.showLunar === "boolean") showLunar.value = obj.showLunar;
      if (obj.weekStart !== undefined) weekStart.value = obj.weekStart;
      if (obj.language) language.value = obj.language;
    } catch (e) {
      // 解析失败忽略
    }
  }
});

/*
  @section: 保存设置方法
  说明：将所有设置项保存到 localStorage，并弹出自动消失的提示，随后自动关闭设置界面。
*/
function saveSettings() {
  // 你可以直接使用 settings.value 获取所有设置项
  // 例如保存到 localStorage
  localStorage.setItem("settings", JSON.stringify(settings.value));

  showToast.value = true;
  setTimeout(() => {
    emit("close");
    setTimeout(() => {
      showToast.value = false;
    }, 2500);
  }, 1000);
}
</script>

<style scoped>
/* 组件样式，圆角、阴影、滚动条、动画等 */
.settings-container {
  min-width: 320px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  transition: all 0.3s;
}
.toggle-checkbox {
  width: 40px;
  height: 20px;
  accent-color: #2563eb; /* Tailwind blue-600 */
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
