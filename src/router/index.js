/**
 * @description: 路由定义文件，一个页面对应一个路由，由于我们是单页面应用，所以暂时只有一个页面路由
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import cld from '../components/cld.vue' // 导入你的组件

// 定义路由，每个路由应该映射到一个组件
const routes = [
  {
    path: '/',
    name: 'cld',
    component: cld
  }
]

const router = createRouter({
  history: createWebHashHistory(), // ← hash 模式，适配 Electron
  routes
})

export default router
