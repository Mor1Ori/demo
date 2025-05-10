<template>
  <div class="json-generation-page">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>

    <div class="top-right-icons-container">
      <el-button @click="refreshPage" type="text" class="icon-button"><el-icon><Refresh /></el-icon></el-button>
      <el-button @click="goHome" type="text" class="icon-button"><el-icon><HomeFilled /></el-icon></el-button>
      <span class="current-time">{{ currentTime }}</span>
    </div>

    <h1 class="page-title">📄 json数据条目生成</h1>

    <el-card class="main-content-card">
      <div class="top-section">
        <!-- Left: Upload and File Info -->
        <div class="upload-info-section">
          <div class="upload-header">
            <el-icon><FolderOpened /></el-icon>
            <span>上传json文件</span>
          </div>
          <el-upload
            class="json-upload-area"
            drag
            action=""
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            @change="handleJsonFileUpload"
            @remove="handleJsonFileRemove"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖拽至此或点击上传</div>
          </el-upload>
          <el-button
            type="primary"
            plain
            @click="viewFileDetails"
            :disabled="!uploadedFile"
            style="margin-top: 15px; width: 100%;"
          >
            查看文件详情
          </el-button>
          <div v-if="uploadedFile" class="file-details-preview">
            <h4>文件信息:</h4>
            <p>数据条目: {{ fileDetails.entries }}</p>
            <p>已包含字段: {{ fileDetails.fields }}</p>
            <p>最长字段长度: {{ fileDetails.maxLength }}</p>
            <p>文件大小: {{ fileDetails.size }}</p>
            <p>......</p>
          </div>
        </div>

        <!-- Middle: Configuration -->
        <div class="config-section">
          <div class="config-item">
            <label>选择要生成的字段</label>
            <el-select v-model="selectedField" placeholder="下拉选择框">
              <el-option label="Instruction" value="instruction"></el-option>
              <el-option label="Input" value="input"></el-option>
              <el-option label="Output" value="output"></el-option>
              <el-option label="History" value="history"></el-option>
            </el-select>
          </div>
          <div class="config-item">
            <label>选择模型</label>
            <el-select v-model="selectedModel" placeholder="下拉选择框">
              <el-option label="模型 A (GPT-3.5)" value="model_a"></el-option>
              <el-option label="模型 B (LLaMA)" value="model_b"></el-option>
              <el-option label="模型 C (PaLM)" value="model_c"></el-option>
            </el-select>
          </div>
          <div class="config-item">
            <label>选择API</label>
            <el-select v-model="selectedApi" placeholder="下拉选择框">
              <el-option label="API Endpoint 1" value="api_1"></el-option>
              <el-option label="API Endpoint 2" value="api_2"></el-option>
            </el-select>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="actions-section">
          <el-card class="loading-placeholder-small">
            <el-icon><Loading /></el-icon>
            <div>需要添加的加载动画...</div>
            <div>需要添加的加载进度...</div>
          </el-card>
          <el-button type="warning" @click="directUpload" class="direct-upload-btn">
            直接上传
          </el-button>
        </div>
      </div>

      <!-- Bottom: Processed Files Table -->
      <div class="processed-files-section">
        <h2>已处理的json文件</h2>
        <el-table :data="processedFiles" stripe border style="width: 100%;">
          <el-table-column prop="name" label="文件名" sortable />
          <el-table-column prop="scene" label="适用场景" sortable />
          <el-table-column prop="time" label="转化时间" sortable />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="viewProcessedFile(scope.row)">查看文件</el-button>
              <el-button type="primary" size="small" @click="downloadFile(scope.row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import { UploadFilled, Refresh, HomeFilled, FolderOpened, Loading } from '@element-plus/icons-vue';

export default {
  name: 'JsonGenerationPage',
  components: { UploadFilled, Refresh, HomeFilled, FolderOpened, Loading },
  data() {
    return {
      currentTime: new Date().toLocaleTimeString(),
      uploadedFile: null,
      fileDetails: {
        entries: 0,
        fields: 'N/A',
        maxLength: 0,
        size: '0KB'
      },
      selectedField: '',
      selectedModel: '',
      selectedApi: '',
      processedFiles: [
        { id: 1, name: '已转化文件1.json', scene: '情感分类', time: '2025-03-19 10:30:45' },
        { id: 2, name: '已转化文件2.txt', scene: '工单预测', time: '2025-03-19 10:30:45' },
        { id: 3, name: '已转化文件3.pdf', scene: '合规检测', time: '2025-03-19 10:30:45' },
      ]
    };
  },
  methods: {
    refreshPage() {
      location.reload();
    },
    goHome() {
      this.$router.push('/'); // Adjust
    },
    handleJsonFileUpload(file, fileList) {
      if (fileList.length > 0) {
        this.uploadedFile = fileList[0]; // Assuming limit is 1
        // Simulate fetching file details
        this.fileDetails = {
          entries: 143,
          fields: 'instruction, input, history...',
          maxLength: 280,
          size: '24KB'
        };
      } else {
        this.uploadedFile = null;
      }
    },
    handleJsonFileRemove() {
        this.uploadedFile = null;
        this.fileDetails = { entries: 0, fields: 'N/A', maxLength: 0, size: '0KB' };
    },
    viewFileDetails() {
      if (this.uploadedFile) {
        alert(`查看文件详情: ${this.uploadedFile.name}`);
      }
    },
    directUpload() {
      alert('直接上传功能触发');
    },
    viewProcessedFile(row) {
      alert(`查看已处理文件: ${row.name}`);
    },
    downloadFile(row) {
      alert(`下载文件: ${row.name}`);
    }
  },
  mounted() {
    this.timer = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
};
</script>

<style scoped>
.json-generation-page {
  padding: 20px;
  position: relative;
  min-height: calc(100vh - 40px);
}

.top-right-icons-container {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  z-index: 10;
}

.icon-button {
  font-size: 28px;
  color: #409EFF;
  background-color: transparent;
  border: none;
  padding: 5px;
}
.icon-button .el-icon {
  font-size: inherit;
}

.current-time {
  font-size: 24px;
  color: purple;
  font-weight: bold;
  margin-left: 15px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
  text-align: left;
}

.main-content-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 25px;
}

.top-section {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 30px;
}

.upload-info-section {
  flex-basis: 35%;
  border: 1px solid #e0e0e0;
  padding: 20px;
  border-radius: 8px;
  background-color: #fdfdff;
}
.upload-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #555;
}
.upload-header .el-icon {
  margin-right: 8px;
  font-size: 22px;
  color: #67C23A;
}
.json-upload-area :deep(.el-upload-dragger) {
  padding: 20px; /* Smaller padding */
}

.file-details-preview {
  margin-top: 15px;
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #495057;
}
.file-details-preview h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
}
.file-details-preview p {
  margin: 4px 0;
}


.config-section {
  flex-basis: 35%;
  display: flex;
  flex-direction: column;
  gap: 25px;
  justify-content: center; /* Center items vertically if space allows */
}
.config-item {
  display: flex;
  flex-direction: column;
}
.config-item label {
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 16px;
  color: #333;
}
.config-item .el-select {
  width: 100%;
  background-color: #4a90e2; /* Blue background for select */
  border-radius: 6px;
}
/* Style the select input itself if needed, might need :deep */
.config-item :deep(.el-input__inner) {
  color: white !important; /* Text color for select */
  border-color: #4a90e2 !important;
  height: 45px; /* Taller select */
  line-height: 45px;
}
.config-item :deep(.el-input .el-select__caret) {
  color: white !important; /* Arrow color */
}


.actions-section {
  flex-basis: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between; /* Push button to bottom if placeholder takes space */
}
.loading-placeholder-small {
  background-color: #aedcfc;
  color: #004085;
  text-align: center;
  padding: 20px;
  width: 100%;
  height: 150px; /* Example height */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  margin-bottom: auto; /* Pushes itself up */
}
.loading-placeholder-small .el-icon {
  font-size: 30px;
  margin-bottom: 10px;
}
.direct-upload-btn {
  width: 100%;
  padding: 15px 0; /* Taller button */
  font-size: 16px;
  background-color: #f5a623; /* Yellow/Orange button */
  border-color: #f5a623;
}

.processed-files-section h2 {
  margin-top: 30px;
  margin-bottom: 15px;
  font-size: 20px;
  color: #333;
}

/* Common background styles */
.floating-particles, .rainbow-stripes { /* Same as in DataIntegrationPage.vue */ }
.floating-particles {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: -2;
}
@keyframes float {
  0% { transform: translateY(0) translateX(0); opacity: 0.5; }
  50% { opacity: 1; }
  100% { transform: translateY(-200px) translateX(80px); opacity: 0; }
}
.floating-particles::before,
.floating-particles::after {
  content: ''; position: absolute; top: 100%; left: 50%;
  width: 10px; height: 10px; background-color: #a3bffa;
  border-radius: 50%; animation: float 4s infinite linear; opacity: 0.5;
}
.floating-particles::after {
  width: 15px; height: 15px; background-color: #9f7aea;
  animation-duration: 6s; animation-delay: 2s;
}
.rainbow-stripes {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(45deg, #f7d1d1, #f9e1b2, #f3f9b6, #d1f3e1, #b8d3f3, #d0bdf0, #f0b8f6);
  background-size: 400% 400%; animation: rainbowMove 10s linear infinite;
  pointer-events: none; z-index: -3;
}
@keyframes rainbowMove {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}
</style>