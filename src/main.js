/**
 * @description: vue.js 入口文件，负责创建应用实例和挂载路由
 */
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router/index.js";

// 创建 Vue 应用实例并挂载路由
createApp(App).use(router).mount("#app");
