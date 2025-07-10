/**
 * @description: 路由定义文件，一个页面对应一个路由，由于我们是单页面应用，所以暂时只有一个页面路由
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import CalendarApp from '../views/CalendarApp.vue' // 导入你的组件
import logger from '../utils/logger.js'

// 定义路由，每个路由应该映射到一个组件
const routes = [
  {
    path: '/',
    name: 'CalendarApp',
    component: CalendarApp
  }
]

const router = createRouter({
  history: createWebHashHistory(), // ← hash 模式，适配 Electron
  routes
})

// 添加路由守卫以记录导航
router.beforeEach((to, from, next) => {
  logger.navigation(from.path || 'initial', to.path, {
    fromName: from.name?.toString() || 'initial',
    toName: to.name?.toString() || 'unknown',
    params: to.params,
    query: to.query
  });
  next();
});

router.onError((error) => {
  logger.error('Router error', {
    error: error.message,
    stack: error.stack
  });
});

export default router
