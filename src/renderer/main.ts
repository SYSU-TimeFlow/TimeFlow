/**
 * @description: vue.js 入口文件，负责创建应用实例和挂载路由
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
