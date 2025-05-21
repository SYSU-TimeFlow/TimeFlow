import { createRouter, createWebHashHistory } from 'vue-router'
import cld from '../components/cld.vue' // 导入你的组件

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
