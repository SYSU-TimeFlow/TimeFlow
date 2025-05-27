/**
 * @description: vue.js 入口文件，负责创建应用实例和挂载路由
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router/index.js";
import './styles/style.css'
import './styles/theme.css'

const app = createApp(App);
const pinia = createPinia();

// 挂载路由
app.use(router);
// 挂载状态管理
app.use(pinia);
// 挂载应用
app.mount("#app");
