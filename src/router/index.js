import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomeView.vue'
import RAGManagement from '../views/RAGManagement.vue'
import Chat from '../views/Chat.vue'

import DataIntegrationPage from '../views/DataIntegrationPage.vue';
import JsonGenerationPage from '../views/JsonGenerationPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/home',
    name: 'home',
    component: Home
  },
  {
    path: '/rag-management',
    name: 'rag-management',
    component: RAGManagement 
  },
  {
    path: '/chat',
    name: 'chat',
    component: Chat 
  },
   // 新增路由定义
  {
    path: '/data-integration', // 对应 App.vue 中的 <el-menu-item index="/data-integration">
    name: 'DataIntegration',   // 保持一致性或自定义
    component: DataIntegrationPage
  },
  {
    path: '/json-generation', // 对应 App.vue 中的 <el-menu-item index="/json-generation">
    name: 'JsonGeneration',   // 保持一致性或自定义
    component: JsonGenerationPage
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
