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
      <el-menu :default-active="activeMenu" router @select="handleMenuSelect">
       
        <el-menu-item index="/chat" class="menu-item">
          <!-- 使用 el-icon 组件来包裹图标，确保一致性 -->
          <el-icon><ChatDotRound /></el-icon>
          <span>智能聊天</span>
        </el-menu-item>

        <el-menu-item index="/rag-management" class="menu-item">
          <el-icon><Document /></el-icon>
          <span>RAG 模块管理</span>
        </el-menu-item>

       

        <!-- <el-menu-item index="/home" class="menu-item">
          <el-icon><UploadFilled /></el-icon>
          <span>数据转化</span>
        </el-menu-item> -->

        <!-- 新增：数据预集成与操作 入口 -->
        <el-menu-item index="/data-integration" class="menu-item">
          <el-icon><Operation /></el-icon> <!-- 使用一个合适的图标 -->
          <span>数据集预览与操作</span>
        </el-menu-item>

        <!-- 新增：JSON数据条目生成 入口 -->
        <el-menu-item index="/json-generation" class="menu-item">
          <el-icon><Tickets /></el-icon> <!-- 使用一个合适的图标 -->
          <span>JSON条目生成</span>
        </el-menu-item>

      </el-menu>

    </el-aside>

    <!-- 内容区域 -->
    <el-main style="overflow-y: hidden;">
      <router-view></router-view>
    </el-main>
  </el-container>
</template>
<script>
import 'element-plus/dist/index.css';
import { ElContainer, ElAside, ElMenu, ElMenuItem, ElMain, ElIcon, ElMessage, ElLoading } from 'element-plus';
import { UploadFilled, Document, ChatDotRound, Operation, Tickets } from '@element-plus/icons-vue';
import axios from 'axios'; // 引入axios

// 后端API根地址
const API_BASE_URL = 'http://localhost:5000'; // <<--- 修改为你后端API的实际地址

export default {
  name: 'App',
  components: {
    ElContainer, ElAside, ElMenu, ElMenuItem, ElMain, ElIcon,
    UploadFilled, Document, ChatDotRound, Operation, Tickets
  },
  data() {
    return {
      activeMenu: this.$route.path,
      systemStatus: { // 用于存储从 / API 获取的状态
        isReady: false,
        ollamaModels: [],
        lowMemory: false,
        message: ''
      },
      isLoadingSystem: true, // 控制全局加载动画
    };
  },
  watch: {
    '$route'(to) {
      this.activeMenu = to.path;
    }
  },
  methods: {
    handleMenuSelect(index) {
      this.activeMenu = index;
    },
    async initializeSystem() {
      const loadingInstance = ElLoading.service({
        lock: true,
        text: '正在初始化系统，请稍候...',
        background: 'rgba(0, 0, 0, 0.7)',
      });
      this.isLoadingSystem = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/`);
        const data = response.data;
        this.systemStatus.isReady = data.is_ready;
        this.systemStatus.ollamaModels = data.ollama_models || [];
        this.systemStatus.lowMemory = data.low_memory || false;
        this.systemStatus.message = data.message || '';

        if (data.is_ready) {
          ElMessage.success('系统初始化成功！');
          if (data.low_memory) {
            ElMessage.warning(`系统提示: ${data.message || '内存可能不足，请注意系统性能。'}`);
          }
          // 将ollama模型列表存储到全局状态或 localStorage，供其他页面使用
          // 简单起见，这里可以用 localStorage
          localStorage.setItem('ollama_models', JSON.stringify(this.systemStatus.ollamaModels));
        } else {
          ElMessage.error(`系统初始化失败: ${data.message || '未知错误'}`);
        }
      } catch (error) {
        console.error("System initialization error:", error);
        ElMessage.error('无法连接到后端服务或初始化失败，请检查后端服务是否运行。');
        this.systemStatus.message = '无法连接到后端服务或初始化失败。';
      } finally {
        this.isLoadingSystem = false;
        loadingInstance.close();
      }
    }
  },
  created() { // 改为 created，确保在路由解析前或同时执行
    this.initializeSystem();
  },
  mounted() {
    this.activeMenu = this.$route.path;
  }
};
</script>
<!-- <script>
import 'element-plus/dist/index.css';
import { ElContainer, ElAside, ElMenu, ElMenuItem, ElMain, ElIcon } from 'element-plus';
// 确保导入所有需要的图标
import { UploadFilled, Document, ChatDotRound, Operation, Tickets } from '@element-plus/icons-vue';

export default {
  name: 'App',
  components: {
    ElContainer, ElAside, ElMenu, ElMenuItem, ElMain, ElIcon, // 添加 ElIcon
    // 显式列出所有使用的图标组件
    UploadFilled, Document, ChatDotRound, Operation, Tickets
  },
  data() {
    return {
      // activeMenu 会由 vue-router 根据当前路径自动更新，如果 el-menu 的 router 属性为 true
      // 但为了保险起见，或者如果需要手动控制，可以监听路由变化来更新
      activeMenu: this.$route.path
    };
  },
  watch: {
    // 监听路由变化，更新 activeMenu
    '$route'(to, from) {
      this.activeMenu = to.path;
    }
  },
  methods: {
    handleMenuSelect(index) {
      // 当启用 router 模式时，el-menu 会自动处理导航，
      // 但如果需要，可以在这里更新 activeMenu 或执行其他逻辑
      this.activeMenu = index;
    }
  },
  mounted() {
    // 初始化 activeMenu 为当前路径
    this.activeMenu = this.$route.path;
  }
};
</script> -->

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
  border-top: 0.5px solid white; /* 上边框 */
  /* 添加下边框，使每个item都有上下边框，最后一个item的下边框由el-menu自身处理或不处理 */
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1); /* 下边框，颜色可以调整 */
  box-sizing: border-box; /*确保padding和border不增加元素总宽高 */
}

/* 移除第一个菜单项的上边框，或最后一个菜单项的下边框（如果需要） */
.el-menu-item:first-child {
  border-top: none; /* 或者设为与背景色一致的边框 */
}
/* 确保菜单项内的图标和文字垂直居中 */
.el-menu-item .el-icon {
  margin-right: 10px; /* 图标和文字间距 */
  font-size: 18px; /* 调整图标大小 */
}
.el-menu-item span {
  vertical-align: middle;
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