<!--
  @component: LogViewer
  @description: 日志查看器组件，用于显示应用日志
  @date: 2025-07-10
-->

<template>
  <div class="log-viewer">
    <div class="log-header">
      <h3>应用日志</h3>
      <div class="log-controls">
        <select v-model="selectedLevel" class="level-filter">
          <option value="">所有级别</option>
          <option value="debug">调试</option>
          <option value="info">信息</option>
          <option value="warn">警告</option>
          <option value="error">错误</option>
        </select>
        <button @click="clearLogs" class="clear-btn">清空日志</button>
        <button @click="exportLogs" class="export-btn">导出日志</button>
      </div>
    </div>

    <div class="log-content" ref="logContainer">
      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        :class="['log-entry', `log-${log.level}`]"
      >
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span class="log-level">{{ log.level.toUpperCase() }}</span>
        <span class="log-message">{{ log.message }}</span>
        <div
          v-if="log.meta && Object.keys(log.meta).length > 0"
          class="log-meta"
        >
          <pre>{{ JSON.stringify(log.meta, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useLogger } from "../../utils/useLogger.js";

const { logInfo, logUserAction } = useLogger("LogViewer");

// 响应式数据
const logs = ref([]);
const selectedLevel = ref("");
const logContainer = ref(null);

// 计算属性
const filteredLogs = computed(() => {
  if (!selectedLevel.value) {
    return logs.value;
  }
  return logs.value.filter((log) => log.level === selectedLevel.value);
});

// 方法
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

const addLog = (logData) => {
  logs.value.push(logData);
  // 限制日志数量，避免内存问题
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-1000);
  }

  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

const clearLogs = () => {
  logs.value = [];
  logUserAction("clear_logs");
};

const exportLogs = () => {
  try {
    const logData = JSON.stringify(filteredLogs.value, null, 2);
    const blob = new Blob([logData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `timeflow-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    logUserAction("export_logs", { logCount: filteredLogs.value.length });
  } catch (error) {
    console.error("Failed to export logs:", error);
  }
};

// 模拟接收日志数据（在实际应用中，这些数据会从日志系统中获取）
const initializeLogs = () => {
  // 添加一些示例日志
  addLog({
    timestamp: new Date().toISOString(),
    level: "info",
    message: "Log viewer initialized",
    meta: { component: "LogViewer" },
  });
};

// 生命周期
onMounted(() => {
  logInfo("LogViewer mounted");
  initializeLogs();
});

// 暴露方法供父组件使用
defineExpose({
  addLog,
});
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 400px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.log-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.log-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.level-filter {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}

.clear-btn,
.export-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover,
.export-btn:hover {
  background: #f3f4f6;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #64748b;
  white-space: nowrap;
  min-width: 140px;
}

.log-level {
  font-weight: 600;
  white-space: nowrap;
  min-width: 50px;
}

.log-debug .log-level {
  color: #6b7280;
}

.log-info .log-level {
  color: #2563eb;
}

.log-warn .log-level {
  color: #d97706;
}

.log-error .log-level {
  color: #dc2626;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-meta {
  flex-basis: 100%;
  margin-top: 4px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  border-left: 3px solid #e2e8f0;
}

.log-meta pre {
  margin: 0;
  font-size: 11px;
  color: #475569;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-debug {
  background: #f8fafc;
}

.log-warn {
  background: #fefce8;
}

.log-error {
  background: #fef2f2;
}
</style>
