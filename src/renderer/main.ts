/**
 * @file main.ts
 * @description Vue 3 应用入口文件，负责创建应用实例、挂载路由和状态管理、全局错误与警告处理，并最终挂载到 DOM。
 * 
 * 为什么这样做：
 * - 通过 createApp 创建 Vue 实例，保证应用初始化流程标准化。
 * - 挂载 Pinia 状态管理和 Vue Router，统一管理全局状态和页面路由，提升可维护性和扩展性。
 * - 全局错误和警告处理接入日志系统，便于问题追踪和线上监控，提升健壮性和可运维性。
 * - 样式文件统一引入，保证页面样式一致性和可扩展性。
 * - 挂载到 #app 节点，保证与 index.html 结构解耦，便于前端框架升级和页面重构。
 * - 关键流程均有日志记录，便于调试和行为分析。
 */

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import logger from "./utils/logger.js";

import "./styles/index.css";

logger.info("Starting Vue application", {
  environment: process.env.NODE_ENV || "development",
});

const app = createApp(App);
const pinia = createPinia();

// 挂载路由
app.use(router);
// 挂载状态管理
app.use(pinia);

// 全局错误处理
app.config.errorHandler = (err: unknown, instance, info) => {
  const error = err as Error;
  logger.error("Vue global error", {
    error: error.message,
    stack: error.stack,
    componentInfo: info,
    instanceType: instance?.$options.name || "Unknown",
  });
};

// 全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
  logger.warn("Vue warning", {
    message: msg,
    componentName: instance?.$options.name || "Unknown",
    trace,
  });
};

logger.info("Vue application configured, mounting to DOM");

// 挂载应用
app.mount("#app");

logger.info("Vue application mounted successfully");
