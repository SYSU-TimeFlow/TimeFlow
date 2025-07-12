<!--
  @component: TutorialGuide
  @description: 引导教程组件，使用聚光灯效果引导用户了解主要功能
  @author: GitHub Copilot
  @date: 2025-07-12
-->

<template>
  <div v-if="showTutorial" class="tutorial-overlay">
    <!-- 遮罩层 -->
    <div class="tutorial-mask" :style="maskStyle"></div>
    
    <!-- 聚光灯区域 -->
    <div 
      class="spotlight"
      :style="spotlightStyle"
    ></div>
    
    <!-- 引导提示框 -->
    <div 
      v-if="showTooltip"
      class="tutorial-tooltip" 
      :style="tooltipStyle"
    >
      <div class="tooltip-content">
        <h3 class="tooltip-title">{{ currentStep.title }}</h3>
        <p class="tooltip-description">{{ currentStep.description }}</p>
        
        <!-- 步骤指示器 -->
        <div class="step-indicator">
          <span 
            v-for="(step, index) in tutorialSteps" 
            :key="index"
            class="step-dot"
            :class="{ active: index === currentStepIndex }"
          ></span>
        </div>
        
        <!-- 操作按钮 -->
        <div class="tutorial-actions">
          <button 
            v-if="currentStepIndex > 0" 
            class="tutorial-btn secondary" 
            @click="previousStep"
          >
            上一步
          </button>
          
          <button 
            v-if="currentStepIndex < tutorialSteps.length - 1" 
            class="tutorial-btn primary" 
            @click="nextStep"
          >
            下一步
          </button>
          
          <button 
            v-if="currentStepIndex === tutorialSteps.length - 1" 
            class="tutorial-btn primary" 
            @click="completeTutorial"
          >
            开始使用
          </button>
          
          <button 
            class="tutorial-btn skip" 
            @click="skipTutorial"
          >
            跳过引导
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

// Props
const props = defineProps<{
  show: boolean;
}>();

// Emits
const emit = defineEmits<{
  complete: [];
  skip: [];
}>();

// 响应式数据
const showTutorial = ref(false);
const showTooltip = ref(false);
const currentStepIndex = ref(0);

// 引导步骤配置
const tutorialSteps = ref([
  {
    title: '创建事件',
    description: '点击这里可以创建新的日程事件，也可以点击对应的日期窗格。',
    selector: '.add-event-btn, [data-tutorial="add-event"]',
    position: 'right'
  },
  {
    title: '切换视图',
    description: '这里可以切换不同的日历视图，包括月、周、日和Todo视图。',
    selector: '.view-buttons, [data-tutorial="view-switcher"]',
    position: 'right'
  },
  {
    title: '智能搜索',
    description: '在标题输入框中可以搜索事件，还可以使用AI助手帮助您管理日程。',
    selector: '.mode-indicator, .search-input, [data-tutorial="search"]',
    position: 'bottom'
  },
  {
    title: '帮助文档',
    description: "按下 ? 可以查看帮助文档，了解更多功能和使用技巧。",
    selector: null,
    position: 'center'
  },
  {
    title: '开始体验',
    description: '现在您已经了解了主要功能，开始使用TimeFlow管理您的时间吧！',
    selector: null,
    position: 'center'
  }
]);

// 当前步骤
const currentStep = computed(() => tutorialSteps.value[currentStepIndex.value]);

// 聚光灯样式
const spotlightStyle = ref({});
const tooltipStyle = ref({});
const maskStyle = ref({});

// 更新聚光灯位置
const updateSpotlight = async () => {
  await nextTick();
  
  const step = currentStep.value;
  if (!step.selector) {
    // 最后一步，居中显示
    spotlightStyle.value = {
      display: 'none'
    };
    tooltipStyle.value = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
    maskStyle.value = {
      background: 'rgba(0, 0, 0, 0.8)'
    };
    return;
  }
  
  const element = document.querySelector(step.selector);
  if (!element) {
    console.warn(`找不到选择器对应的元素: ${step.selector}`);
    // 如果找不到元素，显示通用提示
    spotlightStyle.value = {
      display: 'none'
    };
    tooltipStyle.value = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
    maskStyle.value = {
      background: 'rgba(0, 0, 0, 0.8)'
    };
    return;
  }
  
  const rect = element.getBoundingClientRect();
  const padding = 4;
  
  // 聚光灯样式
  const spotlightTop = rect.top - padding;
  const spotlightLeft = rect.left - padding;
  const spotlightWidth = rect.width + padding * 2;
  const spotlightHeight = rect.height + padding * 2;
  
  spotlightStyle.value = {
    display: 'block',
    top: `${spotlightTop}px`,
    left: `${spotlightLeft}px`,
    width: `${spotlightWidth}px`,
    height: `${spotlightHeight}px`
  };
  
  // 提示框位置
  let tooltipTop, tooltipLeft, transform = '';
  
  switch (step.position) {
    case 'bottom':
      tooltipTop = rect.bottom + padding + 20;
      tooltipLeft = rect.left + rect.width / 2;
      transform = 'translateX(-50%)';
      break;
    case 'top':
      tooltipTop = rect.top - padding - 20;
      tooltipLeft = rect.left + rect.width / 2;
      transform = 'translateX(-50%) translateY(-100%)';
      break;
    case 'left':
      tooltipTop = rect.top + rect.height / 2;
      tooltipLeft = rect.left - padding - 20;
      transform = 'translateX(-100%) translateY(-50%)';
      break;
    case 'right':
      tooltipTop = rect.top + rect.height / 2 + 30; // 向下移动30px
      tooltipLeft = rect.right + padding + 20;
      transform = 'translateY(-50%)';
      break;
    default:
      tooltipTop = rect.bottom + padding + 20;
      tooltipLeft = rect.left + rect.width / 2;
      transform = 'translateX(-50%)';
  }
  
  // 确保提示框在视窗内
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 40;
  
  if (tooltipLeft < 20) tooltipLeft = 20;
  if (tooltipLeft > maxWidth - 300) tooltipLeft = maxWidth - 300;
  if (tooltipTop < 20) tooltipTop = 20;
  if (tooltipTop > maxHeight - 200) tooltipTop = maxHeight - 200;
  
  tooltipStyle.value = {
    top: `${tooltipTop}px`,
    left: `${tooltipLeft}px`,
    transform
  };
  
  // 遮罩样式 - 简化为单一背景色，通过聚光灯元素实现高亮
  maskStyle.value = {
    background: 'rgba(0, 0, 0, 0.8)'
  };
};

// 下一步
const nextStep = () => {
  if (currentStepIndex.value < tutorialSteps.value.length - 1) {
    showTooltip.value = false;
    currentStepIndex.value++;
    updateSpotlight();
    setTimeout(() => {
      showTooltip.value = true;
    }, 200);
  }
};

// 上一步
const previousStep = () => {
  if (currentStepIndex.value > 0) {
    showTooltip.value = false;
    currentStepIndex.value--;
    updateSpotlight();
    setTimeout(() => {
      showTooltip.value = true;
    }, 200);
  }
};

// 完成教程
const completeTutorial = () => {
  showTutorial.value = false;
  emit('complete');
};

// 跳过教程
const skipTutorial = () => {
  showTutorial.value = false;
  emit('skip');
};

// 开始教程
const startTutorial = () => {
  showTutorial.value = true;
  showTooltip.value = false;
  currentStepIndex.value = 0;
  // 延迟更新聚光灯，确保DOM已渲染
  setTimeout(() => {
    updateSpotlight();
    // 0.1秒后显示tooltip
    setTimeout(() => {
      showTooltip.value = true;
    }, 100);
  }, 300);
};

// 监听窗口大小变化
const handleResize = () => {
  if (showTutorial.value) {
    updateSpotlight();
  }
};

// 监听props变化
watch(() => props.show, (newVal) => {
  if (newVal) {
    startTutorial();
  } else {
    showTutorial.value = false;
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  if (props.show) {
    startTutorial();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 暴露方法给父组件
defineExpose({
  startTutorial,
  completeTutorial,
  skipTutorial
});
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  pointer-events: auto;
}

.tutorial-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  transition: all 0.3s ease;
}

.spotlight {
  position: absolute;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 3px solid rgba(56, 139, 253, 0.8);
  box-shadow: 
    0 0 0 4px rgba(56, 139, 253, 0.4),
    0 0 20px rgba(56, 139, 253, 0.6),
    0 0 40px rgba(56, 139, 253, 0.4),
    inset 0 0 0 2px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  pointer-events: none;
  z-index: 10001;
  animation: spotlight-pulse 2s ease-in-out infinite;
}

@keyframes spotlight-pulse {
  0%, 100% {
    box-shadow: 
      0 0 0 4px rgba(56, 139, 253, 0.4),
      0 0 20px rgba(56, 139, 253, 0.6),
      0 0 40px rgba(56, 139, 253, 0.4),
      inset 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow: 
      0 0 0 6px rgba(56, 139, 253, 0.6),
      0 0 30px rgba(56, 139, 253, 0.8),
      0 0 60px rgba(56, 139, 253, 0.6),
      inset 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
}

.tutorial-tooltip {
  position: absolute;
  background: white;
  border-radius: 12px;
  padding: 20px;
  max-width: 320px;
  min-width: 280px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 10002;
}

.tooltip-content {
  text-align: left;
}

.tooltip-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 6px;
}

.tooltip-description {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 16px;
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #d1d5db;
  transition: all 0.1s ease;
}

.step-dot.active {
  background-color: #388bfd;
  transform: scale(1.2);
}

.tutorial-actions {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
}

.tutorial-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease;
  white-space: nowrap;
  min-width: 70px;
}

.tutorial-btn.primary {
  background: #388bfd;
  color: white;
  flex: 1;
}

.tutorial-btn.primary:hover {
  background: #1f6feb;
}

.tutorial-btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  flex: 1;
}

.tutorial-btn.secondary:hover {
  background: #e5e7eb;
}

.tutorial-btn.skip {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  flex: 0 0 auto;
  min-width: 70px;
}

.tutorial-btn.skip:hover {
  background: #f9fafb;
  color: #374151;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .tutorial-tooltip {
    max-width: 260px;
    min-width: 240px;
    padding: 16px;
  }
  
  .tooltip-title {
    font-size: 1rem;
  }
  
  .tooltip-description {
    font-size: 0.85rem;
  }
  
  .tutorial-actions {
    gap: 8px;
  }
  
  .tutorial-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    min-width: 60px;
  }
}
</style>
