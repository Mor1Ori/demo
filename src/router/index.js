import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/HomeView.vue'
import RAGManagement from '../views/RAGManagement.vue'
import Chat from '../views/Chat.vue'

const routes = [
  {
    path: '/',
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
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
