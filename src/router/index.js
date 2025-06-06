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

  {
    path: '/data-integration',
    name: 'DataIntegration',
    component: DataIntegrationPage
  },
  
  {
    path: '/json-generation',
    name: 'JsonGeneration',
    component: JsonGenerationPage
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
