<!--
  @component: WelcomePage
  @description: 欢迎界面组件，包含感谢信息和彩色飘带动画效果，只在首次使用时显示
  @author: GitHub Copilot
  @date: 2025-07-12
-->

<template>
  <div v-if="showWelcome" class="welcome-modal-overlay" @click="closeWelcome">
    <!-- 彩色飘带背景 -->
    <div class="confetti-container">
      <div 
        v-for="(ribbon, index) in ribbons" 
        :key="index"
        class="ribbon"
        :style="getRibbonStyle(ribbon)"
      ></div>
    </div>
    
    <!-- 欢迎内容 -->
    <div class="welcome-modal" @click.stop>
      <div class="welcome-content">
        <!-- 应用图标 -->
        <div class="welcome-icon">
          <div class="icon-circle">
            <img src="/icon.png" alt="TimeFlow" class="app-icon" />
          </div>
        </div>
        
        <!-- 欢迎标题 -->
        <h1 class="welcome-title">欢迎使用 TimeFlow!</h1>
        
        <!-- 感谢信息 -->
        <p class="welcome-message">
          感谢您选择 TimeFlow 来管理您的时间和日程。
          <br>
          我们致力于为您提供最优质的时间管理体验！
        </p>
        
        <!-- 开始按钮 -->
        <button class="start-button" @click="closeWelcome">
          开始使用
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useSettingStore } from '../../stores/setting';

const settingStore = useSettingStore();

// 响应式数据
const showWelcome = ref(false);
const ribbons = ref<Array<{color: string, delay: number, duration: number, left: number}>>([]);

// 彩色飘带配置 - 恢复彩色效果
const ribbonColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#FF9999', '#66CDAA', '#87CEEB', '#F0E68C', '#FFB6C1'
];

// 生成飘带数据
const generateRibbons = () => {
  const ribbonCount = 40;
  ribbons.value = [];
  
  for (let i = 0; i < ribbonCount; i++) {
    ribbons.value.push({
      color: ribbonColors[Math.floor(Math.random() * ribbonColors.length)],
      delay: Math.random() * 2000,
      duration: 1500 + Math.random() * 1000,
      left: Math.random() * 100
    });
  }
};

// 获取飘带样式
const getRibbonStyle = (ribbon: any) => {
  return {
    backgroundColor: ribbon.color,
    left: `${ribbon.left}%`,
    animationDelay: `${ribbon.delay}ms`,
    animationDuration: `${ribbon.duration}ms`
  };
};

// 关闭欢迎界面
const closeWelcome = async () => {
  console.log('关闭欢迎界面，设置状态为已显示');
  showWelcome.value = false;
  await settingStore.setWelcomeShown(true);
  console.log('欢迎界面状态已保存:', settingStore.hasWelcomeBeenShown);
};

// 组件挂载时检查是否需要显示欢迎界面
onMounted(async () => {
  // 确保设置已经加载
  await settingStore.loadSettings();
  
  console.log('欢迎界面检查:', {
    hasWelcomeBeenShown: settingStore.hasWelcomeBeenShown,
    shouldShow: !settingStore.hasWelcomeBeenShown
  });
  
  if (!settingStore.hasWelcomeBeenShown) {
    showWelcome.value = true;
    generateRibbons();
  }
});
</script>

<style scoped>
.welcome-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.ribbon {
  position: absolute;
  width: 8px;
  height: 40px;
  top: -40px;
  border-radius: 4px;
  animation: twistAndFall linear infinite;
  opacity: 0.9;
  transform-origin: center;
}

@keyframes twistAndFall {
  0% {
    transform: translateY(-40px) rotateZ(0deg) rotateX(0deg);
    opacity: 1;
  }
  50% {
    transform: translateY(50vh) rotateZ(180deg) rotateX(90deg);
    opacity: 0.8;
  }
  100% {
    transform: translateY(100vh) rotateZ(360deg) rotateX(180deg);
    opacity: 0;
  }
}

.welcome-modal {
  background: linear-gradient(135deg, #388bfd 0%, #1f6feb 50%, #58a6ff 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.5s ease-out;
  position: relative;
  overflow: hidden;
}

.welcome-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

@keyframes modalAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-icon {
  margin-bottom: 24px;
}

.icon-circle {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  animation: pulse 2s ease-in-out infinite;
}

.app-icon {
  width: 64px;
  height: 64px;
  filter: brightness(1.2) contrast(1.1);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.welcome-message {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 40px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.start-button {
  background: linear-gradient(45deg, #388bfd, #58a6ff);
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #1f6feb, #388bfd);
}

.start-button:active {
  transform: translateY(0);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .welcome-modal {
    padding: 24px;
    margin: 20px;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-message {
    font-size: 1rem;
  }
}
</style>
