<!-- src/App.vue (首页) -->
<template>
  <el-container style="height: 100vh;margin: -6px; "  >
    <!-- 左侧导航栏 -->
    <el-aside width="220px" style="background-color: #2D3A4B; color: white; z-index: 2;">
      
    <!--       
      <div style="padding: 20px; text-align: center;">
        <img src="/logo.png" alt="Logo" class="image">
        <h1 style="color: #fff; font-size: 30px;"> FinIntel系统</h1>
      </div>
    -->
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/" class="menu-item">
          <el-icon><UploadFilled /></el-icon>
          <span>数据转化</span>
        </el-menu-item>

        <el-menu-item index="/rag-management" class="menu-item">
          <el-icon><Document /></el-icon>
          <span>RAG 模块管理</span>
        </el-menu-item>

        <el-menu-item index="/chat" class="menu-item">
          <span>💬 智能聊天</span>
        </el-menu-item>
      </el-menu>
      
    </el-aside>

    <!-- 内容区域 -->
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script>
import 'element-plus/dist/index.css';
import { ElContainer, ElAside, ElMenu, ElMenuItem, ElMain } from 'element-plus';
import { UploadFilled, Document, Message } from '@element-plus/icons-vue';

export default {
  name: 'App',
  components: {
    ElContainer, ElAside, ElMenu, ElMenuItem, ElMain,
    UploadFilled, Document,Message
  },
  data() {
    return {
      activeMenu: '/'
    };
  }
};
</script>

<style>
 .image {
    width: 100px; /* 根据需要调整图片大小 */
    height: 100px;
    margin-right: 10px;  /* 图片与标题之间的间距 */
    border-radius: 20px;
  }
.el-menu-item {
  background-color: #3E515B;  /* 默认接近渐变底色的灰蓝色 */
  color: #D9E5E8;  /* 浅灰蓝色文字，增强可读性 */
  transition: all 0.3s;
  font-size: 16px;
  width: 220px;
  height: 65px;
  border-top: 0.5px solid white;
}
.el-menu-item:hover {
  background-color: #5C6B75;  /* hover 状态使用较深灰蓝色 */
  color: #E6F0F3;  /* 浅色文字 */
}

.el-menu-item.is-active {
  background-color: #2F3F47;  /* active 状态使用深灰蓝色背景 */
  color: #ffffff;  /* 白色文字 */
}
.el-aside {
  position: relative;
  background-color: #2D3A4B;
  overflow: hidden;  /* 隐藏超出部分 */
}

.el-aside::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0));
  animation: lightFlow 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes lightFlow {
  0% {
    left: -100%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0));
  }
  50% {
    left: 100%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.15));
  }
  100% {
    left: -100%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0));
  }
}


@keyframes slideUp {
  0% {
    transform: translateY(100%);
  }
  100% {
    transform: translateY(0);
  }
}

.el-aside {
  animation: slideUp 0.5s ease-out;
}
</style>
