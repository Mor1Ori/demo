<template>
  <div class="data-conversion">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>
    <div class="top-right-icons">
     
    <el-button @click="refreshPage" type="text" style="width: 60px;"><el-icon style="font-size: 33px;"><Refresh /></el-icon></el-button>
    <el-button @click="goHome" type="text" style="width: 60px;"><el-icon style="font-size: 30px;"><HomeFilled /></el-icon></el-button>
    <span style="font-size: 24px; color: purple; font-weight: bold; padding-left: 20px;">{{ currentTime }}</span>
  </div>
  <h1 style="font-size: 30px; margin-top: 0px;">🚀结构化微调训练数据转换</h1>

    <!-- 外层容器 -->
    <el-card class="box-card">
      <div class="container">

        <!-- 左侧部分 -->
        <div class="left-section">
          <!-- 选择场景 -->
          <div class="form-section">
            <h2>🔧选择场景</h2>
            <el-select v-model="selectedScene" placeholder="选择场景" class="scene-select">
              <el-option label="智能问答" value="qa"></el-option>
              <el-option label="金融欺诈检测" value="fraud"></el-option>
              <el-option label="合规合法检测" value="compliance"></el-option>
            </el-select>
          </div>

          <!-- 上传文件 -->
          <div class="form-section">
            <h2>📁上传文件</h2>
            <el-upload
              action=""
              drag
              multiple
              :auto-upload="false"
              @change="handleFileUpload"
              class="upload-area">
              <i class="el-icon-upload"></i>
              <div class="el-upload__text"><el-icon style="font-size: 30px;"><UploadFilled /></el-icon><br>将文件拖拽至此或点击上传</div>
            </el-upload>
          </div>
          <h2>📝转化后文件名</h2>
          <!-- 转化文件名与转化按钮 -->
          <div class="form-section form-inline">
            <div class="file-name-input">
             
              <el-input v-model="outputFileName" placeholder="请输入转化后的文件名" class="output-input" />
            </div>
            <el-button type="primary" @click="convertData" class="convert-button"><el-icon style="font-size: 20px;"><Refresh/></el-icon>&nbsp;转化数据</el-button>
          </div>
        </div>

        <!-- 右侧部分 -->
        <div class="right-section">
          <!-- 已转化的文件列表 -->
          <h2><el-icon ><List /></el-icon>已转化的文件</h2>

          <!-- 使用双层立体设计 -->
          <el-card class="table-card">
            <el-table :data="convertedFiles" style="width: 100%" border>
              <el-table-column label="文件名" prop="name" header-align="center" align="center" sortable/>
              <el-table-column label="适用场景" prop="scene" header-align="center" align="center" sortable/>
              <el-table-column label="转化时间" prop="date" header-align="center" align="center" sortable/>
            </el-table>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import { ElMessage, ElLoading } from 'element-plus';
import { ElCard, ElUpload, ElSelect, ElOption, ElInput, ElButton, ElTable, ElTableColumn } from 'element-plus';
import { UploadFilled, DeleteFilled, Search,House,Refresh,List,HomeFilled} from '@element-plus/icons-vue';

const API_BASE_URL = 'http://localhost:5000'; // <<--- 修改成后端url

export default {
  name: 'DataConversion',
  components: {
    ElCard, ElUpload, ElSelect, ElOption, ElInput, ElButton, ElTable, ElTableColumn,UploadFilled, DeleteFilled,Search,HomeFilled,Refresh,List
  },
  data() {
    return {
      selectedScene: '智能问答', // 对应 API 1.2 scene
      outputFileName: '',     // 对应 API 1.1 inputData (作为输出文件名)
      uploadedFile: null,     // 用于 API 1.2 的文件对象
      ollamaModels: [],       // Ollama模型列表
      selectedOllamaModel: '',// 用户选择的Ollama模型
      isLoading: false,
      currentTime: new Date().toLocaleTimeString(),
      convertedFiles: [
        {name:'aaa.txt',scene:'欺诈检测',date:'2025-03-19 10:30:45'},
        {name:'bbb.txt',scene:'智能问答',date:'2025-03-19 10:30:45'},
        {name:'ccc.txt',scene:'合规检测',date:'2025-03-19 10:30:45'},
        {name:'欺诈事件.txt',scene:'欺诈检测',date:'2025-03-19 10:30:45'},
        {name:'金融案例.csv.',scene:'智能问答',date:'2025-03-19 10:30:45'},
        {name:'金融论文.pdf',scene:'合规检测',date:'2025-03-19 10:30:45'},
      ],   // 已转化的文件列表，表格数据
    };
  },
  methods: {
    // handleFileUpload(file) {
    //   alert(`文件已上传：${file.name}`);
    // },
    refreshPage() {
      location.reload();
    },
    goHome() {
      this.$router.push('/');
    },

    // 上传文件并转化（API 1.2）
    async handleFileUpload(file) {
      this.uploadedFile = file.raw;
    },

    async convertData() {
      if (this.uploadedFile) {
        // 走文件上传转化接口 1.2
        if (!this.selectedScene) {
          ElMessage.error('请选择一个应用场景');
          return;
        }
        this.isLoading = true;
        const loadingInstance = ElLoading.service({ text: '正在上传并转化文件...' });
        try {
          const formData = new FormData();
          formData.append('file', this.uploadedFile);
          formData.append('scene', this.selectedScene);
          const response = await axios.post(`${API_BASE_URL}/convert/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (response.data.success) {
            this.convertedFiles.push({
              name: response.data.convertedData,
              scene: this.selectedScene,
              date: new Date().toLocaleString()
            });
            ElMessage.success(response.data.message);
            this.uploadedFile = null;
          } else {
            ElMessage.error(response.data.message || '文件上传转化失败');
          }
        } catch (error) {
          ElMessage.error('文件上传转化请求失败: ' + error.message);
        } finally {
          this.isLoading = false;
          loadingInstance.close();
        }
      } else {
        // 走普通数据转化接口 1.1
        if (!this.outputFileName.trim()) {
          ElMessage.error('请输入转化后的文件名');
          return;
        }
        this.isLoading = true;
        const loadingInstance = ElLoading.service({ text: '正在转化...' });
        try {
          const payload = {
            inputData: this.outputFileName,
            conversionType: 'text_to_speech' // 或根据实际需求动态选择
          };
          const response = await axios.post(`${API_BASE_URL}/convert`, payload);
          if (response.data.success) {
            this.convertedFiles.push({
              name: response.data.convertedData,
              scene: this.selectedScene,
              date: new Date().toLocaleString()
            });
            ElMessage.success(response.data.message);
            this.outputFileName = '';
          } else {
            ElMessage.error(response.data.message || '转化失败');
          }
        } catch (error) {
          ElMessage.error('转化请求失败: ' + error.message);
        } finally {
          this.isLoading = false;
          loadingInstance.close();
        }
      }
    },
    loadOllamaModels() {
      const models = localStorage.getItem('ollama_models');
      if (models) {
        this.ollamaModels = JSON.parse(models);
      }
    }
  },
  mounted() {
    this.loadOllamaModels();
    setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }
};
</script>

<style scoped>
.data-conversion {
  padding: 20px;
}

.box-card {
  padding: 20px;
  border-radius: 20px;
}
.top-right-icons {
  position: absolute;
  top: 15px;
  right: 40px;
  display: flex;
  align-items: center;
}
.top-right-icons span {
  margin-left: 10px;
}
.container {
  display: flex;
  justify-content: space-between;
  gap: 30px;
}

.left-section {
  width: 35%;
}

.right-section {
  width: 60%;
  padding-left: 20px;
}

.form-section {
  margin-bottom: 20px;
}

.scene-select, .upload-area, .output-input, .convert-button {
  width: 100%;
}

.form-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-name-input {
  width: 80%;
}

h1 {
  text-align: left;
  margin-bottom: 30px;
}

h2 {
  margin-bottom: 10px;
}

.el-button {
  width: auto;
}
.el-icon{
  font-size: 30px;
}
.el-table {
  width: 100%;
  border-radius: 4px;
}

.el-table th, .el-table td {
  text-align: center;
}

.el-table__header th {
  background-color: #f0f2f5;
  color: #606266;
}

.el-table__body td {
  background-color: #ffffff;
  color: #333;
  padding: 10px 15px;
}

.el-table__body tr:hover {
  background-color: #f2f6fc;
}

.el-input, .el-button {
  margin-top: 10px;
}

.el-input {
  border-radius: 4px;
  padding: 10px;
}

.el-button {
  width: 120px;
  padding: 10px;
  height: 40px;
  margin-left: 20px;
}

.table-card {
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #ffffff;
}
.floating-particles {
  position: fixed; /* 覆盖整个页面 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 不影响用户操作 */
  z-index: 20; /* 在所有组件的后面 */
}

@keyframes float {
  0% { transform: translateY(0) translateX(0); opacity: 0.5; }
  50% { opacity: 1; }
  100% { transform: translateY(-200px) translateX(80px); opacity: 0; }
}

.floating-particles::before,
.floating-particles::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  width: 10px;
  height: 10px;
  background-color: #a3bffa;
  border-radius: 50%;
  animation: float 4s infinite linear;
  opacity: 0.5;
}

.floating-particles::after {
  width: 15px;
  height: 15px;
  background-color: #9f7aea;
  animation-duration: 6s;
  animation-delay: 2s;
}
.rainbow-stripes {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #f7d1d1, #f9e1b2, #f3f9b6, #d1f3e1, #b8d3f3, #d0bdf0, #f0b8f6);
  background-size: 400% 400%;
  animation: rainbowMove 10s linear infinite;
  pointer-events: none;
  z-index: -1;
}

@keyframes rainbowMove {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 100%;
  }
}
</style>
