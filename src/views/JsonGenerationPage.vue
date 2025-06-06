<template>
  <div class="json-generation-page">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>

    <div class="top-bar" style="display: flex; align-items: center; justify-content: space-between; padding: 0 10px 10px 10px; border-bottom: 1px solid #e0e0e0; background-color: rgba(245,245,245,0.8); margin-bottom: 18px;">
      <div style="font-size: 22px; color: #333; font-weight: bold;">📄 json数据条目生成</div>
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
        <div class="model-api-info model-api-info-blue">
          当前已加载的模型/api: {{ currentModelApiInfo || '未加载' }}
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <el-button @click="refreshPage" type="text" class="icon-button"><el-icon><Refresh /></el-icon></el-button>
        <el-button @click="goHome" type="text" class="icon-button"><el-icon><HomeFilled /></el-icon></el-button>
        <span class="current-time" style="font-size: 22px; color: purple; font-weight: bold; margin-left: 10px;">{{ currentTime }}</span>
      </div>
    </div>

    <el-card
      class="main-content-card"
      v-loading="isLoading"
      element-loading-text="正在生成内容，请稍候..."
      :element-loading-spinner="Loading"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(255, 255, 255, 0.8)"
    >
      <div class="top-section">
        <div class="upload-info-section">
          <div class="upload-header">
            <el-icon><FolderOpened /></el-icon>
            <span>上传json文件</span>
          </div>
          <el-upload
            class="json-upload-area"
            ref="jsonUpload"
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
        </div>
        <div class="file-details-section">
          <div v-if="uploadedFile" class="file-details-preview file-details-bordered">
            <h4>文件信息:</h4>
            <p>数据条目: {{ fileDetails.entries }}</p>
            <p>已包含字段: {{ fileDetails.fields }}</p>
            <p>最长字段长度: {{ fileDetails.maxLength }}</p>
            <p>文件大小: {{ (fileDetails.size && typeof fileDetails.size === 'string') ? (parseFloat(fileDetails.size) / 1024).toFixed(2) + ' KB' : fileDetails.size }}</p>
            <div v-if="fileDetails.maxFieldLengths && Object.keys(fileDetails.maxFieldLengths).length" style="margin-top:8px;">
              <span style="font-weight:500;">各字段最大长度：</span>
              <span v-for="(len, key) in fileDetails.maxFieldLengths" :key="key" style="margin-right:12px;">{{ key }}: {{ len }}</span>
            </div>
          </div>
          <div v-else class="file-details-preview file-details-bordered" style="color:#888; font-size:15px;">请先上传json文件，上传后将展示详细信息</div>
        </div>
        <div class="config-section config-section-vertical">
          <div class="config-item">
            <label>选择要生成的字段</label>
            <el-select v-model="selectedField" placeholder="下拉选择框">
              <el-option label="Context" value="context"></el-option>
              <el-option label="Output" value="output"></el-option>
              <el-option label="History" value="history"></el-option>
            </el-select>
          </div>
        </div>
      </div>

      <div class="processed-files-section">
        <h2>已处理的json文件</h2>
        <el-table :data="processedFiles" stripe border style="width: 100%;">
          <el-table-column prop="name" label="文件名" sortable />
          <el-table-column prop="path" label="文件路径" sortable />
          <el-table-column prop="time" label="转化时间" sortable />
          <el-table-column prop="size" label="文件大小" sortable />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="viewProcessedFile(scope.row)">查看文件</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="width:100%;display:flex;justify-content:center;gap:24px;margin-top:24px;">
          <el-button type="success" class="start-generation-btn" @click="handleStartGeneration" style="width: 180px; font-size: 15px;">开始生成</el-button>
          <el-button type="warning" @click="directUpload" class="direct-upload-btn" style="width: 180px; font-size: 15px;">直接上传</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { UploadFilled, Refresh, HomeFilled, FolderOpened, Loading } from '@element-plus/icons-vue';
import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000';

export default {
  name: 'JsonGenerationPage',
  components: { UploadFilled, Refresh, HomeFilled, FolderOpened, Loading },
  data() {
    return {
      currentTime: new Date().toLocaleTimeString(),
      currentModelApiInfo: '', // 新增
      uploadedFile: null,
      fileDetails: {
        entries: 0,
        fields: 'N/A',
        maxLength: 0,
        size: '0KB',
        maxFieldLengths: {} // 确保初始状态有这个属性
      },
      selectedField: '',
      selectedModel: '',
      selectedApi: '',
      localModelPath: '', // 新增本地模型路径
      processedFiles: [],
      isLoading: false, // <--- 新增：控制加载状态
      Loading, // <--- 新增：将导入的Loading组件暴露给template，用于v-loading的自定义spinner
    };
  },
  methods: {
    refreshPage() {
      location.reload();
    },
    goHome() {
      this.$router.push('/'); // Adjust
    },
    async handleJsonFileUpload(file) {
      if (!file) return;
      this.uploadedFile = file.raw || file;
      try {
        const payload = { file_path: file.name };
        const res = await axios.post(
          `${API_BASE_URL}/convert/upload`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const backendData = res.data;
        if (backendData.success) {
          this.fileDetails = {
            entries: backendData.total_entries,
            fields: Array.isArray(backendData.fields) ? backendData.fields.join(', ') : '',
            maxLength: backendData.max_field_lengths ? Math.max(...Object.values(backendData.max_field_lengths)) : 0,
            size: backendData.file_size_kb ? backendData.file_size_kb + 'B' : '', // 注意：如果后端file_size_kb是KB单位，这里应为 + 'KB'
            maxFieldLengths: backendData.max_field_lengths || {}
          };
          this.$message.success('文件信息获取成功');
        } else {
          this.$message.error('后端返回失败: ' + (backendData.message || '未知错误'));
          this.fileDetails = { entries: 0, fields: 'N/A', maxLength: 0, size: '0KB', maxFieldLengths: {} };
        }
      } catch (e) {
        this.$message.error('文件解析失败或后端接口异常');
        this.fileDetails = { entries: 0, fields: 'N/A', maxLength: 0, size: '0KB', maxFieldLengths: {} };
      }
    },
    handleJsonFileRemove() {
        this.uploadedFile = null;
        this.fileDetails = { entries: 0, fields: 'N/A', maxLength: 0, size: '0KB', maxFieldLengths: {} };
    },
    viewFileDetails() {
      if (this.uploadedFile) {
        alert(`查看文件详情: ${this.uploadedFile.name}`);
      }
    },
    directUpload() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const payload = { file_path: file.name };

        try {
          const res = await axios.post(
            `${API_BASE_URL}/convert/upload-direct`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
          );

          const data = res.data;
          if (data.success) {
            this.$message.success(data.message || '文件上传成功');
            this.fetchProcessedFiles();
          } else {
            this.$message.error(data.message || '文件上传失败');
          }
        } catch (error) {
          console.error('直接上传出错:', error);
          this.$message.error('文件上传失败，请检查网络连接或服务器状态');
        }
      };
      input.click();
    },
    async viewProcessedFile(row) {
      try {
        const res = await axios.post(`${API_BASE_URL}/convert/preview`, {
          file_path: row.name
        });

        if (res.data && res.data.success) {
          this.$router.push({
            path: '/data-integration',
            query: { fromJson: '1' },
            state: {
              integratedData: res.data.content,
              fileStats: {
                entries: res.data.information.total_entries,
                size: this.formatFileSize(res.data.information.file_size),
                maxFieldLengths: res.data.information.max_field_lengths
              }
            }
          });
        } else {
          this.$message.error(res.data.message || '获取文件预览失败');
        }
      } catch (e) {
        this.$message.error('获取文件预览失败: ' + (e.message || '未知错误'));
      }
    },
    downloadFile(row) {
      alert(`下载文件: ${row.name}`);
    },
    async selectLocalModelPath() {
      const path = prompt('请输入本地safetensors模型文件夹路径:');
      if (path) {
        this.localModelPath = path;
      }
    },
    async handleStartGeneration() {
      if (!this.uploadedFile) {
        this.$message.warning('请先上传json文件');
        return;
      }
      if (!this.selectedField) {
        this.$message.warning('请选择要生成的字段');
        return;
      }

      const maxWorkers = await this.$prompt('请输入并行线程数（1-8）', '参数设置', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^[1-8]$/,
        inputErrorMessage: '请输入1-8之间的数字'
      }).then(({ value }) => parseInt(value))
        .catch(() => null);

      if (maxWorkers === null) return;

      const batchSize = await this.$prompt('请输入每批次处理的数据量（1-50）', '参数设置', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^[1-9]|[1-4][0-9]|50$/,
        inputErrorMessage: '请输入1-50之间的数字'
      }).then(({ value }) => parseInt(value))
        .catch(() => null);

      if (batchSize === null) return;

      this.isLoading = true; // <--- 在请求开始前，设置isLoading为true

      try {
        const payload = {
          file_path: this.uploadedFile.name,
          target_field: this.selectedField,
          max_workers: maxWorkers,
          batch_size: batchSize
        };

        const res = await axios.post(
          `${API_BASE_URL}/convert/generate`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );

        const data = res.data;
        if (data.success) {
          this.$message.success(data.message || '生成成功');

          const stats = data.stats;
          this.$alert(
            `处理完成！\n\n` +
            `总数据条数：${stats['总数据条数']}\n` +
            `处理数据量：${stats['处理数据量']}\n` +
            `处理时间：${stats['处理时间']}\n` +
            `处理速度：${stats['处理速度']}`,
            '处理统计',
            {
              confirmButtonText: '确定',
              callback: () => {
                this.fetchProcessedFiles();
              }
            }
          );
        } else {
          this.$message.error(data.message || '生成失败');
        }
      } catch (error) {
        console.error('生成过程出错:', error);
        this.$message.error('生成失败，请检查网络连接或服务器状态');
      } finally {
        this.isLoading = false; // <--- 在请求结束后（无论成功或失败），设置isLoading为false
      }
    },
    async fetchProcessedFiles() {
      try {
        const res = await axios.get(`${API_BASE_URL}/convert`);
        const data = res.data;
        const files = data.files || [];
        if (data.success && Array.isArray(data.files)) {
          this.processedFiles = data.files.map(f => ({
            name: f.file_name,
            path: f.absolute_path,
            size: this.formatFileSize(f.size_bytes),
            time: f.converted_time
          }));
        } else {
          this.processedFiles = [];
        }
      } catch (e) {
        this.$message.error('获取已处理文件列表失败');
        this.processedFiles = [];
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  },
  mounted() {
    this.timer = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
    const savedModelApiInfo = localStorage.getItem('currentModelApiInfo');
    if (savedModelApiInfo) {
      this.currentModelApiInfo = savedModelApiInfo;
    }
    this.fetchProcessedFiles();
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

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 10px 10px;
  border-bottom: 1px solid #e0e0e0;
  background-color: rgba(245, 245, 245, 0.8);
  margin-bottom: 18px;
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
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 30px;
}
.upload-info-section {
  flex-basis: 38%;
  min-width: 400px;
  max-width: 560px;
  border: 1px solid #e0e0e0;
  padding: 20px;
  border-radius: 8px;
  background-color: #fdfdff;
}
.file-details-section {
 flex-basis: 38%;
  min-width: 400px;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}


.config-section-vertical {
   flex-basis: 20%;
  min-width: 180px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  margin-top: 0;
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

.file-info-section {
  flex-basis: 40%;
  min-width: 400px;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}
.file-details-preview {
  margin-top: 15px;
  background-color: #fdfdff; /* 与上传区域统一 */
  padding: 22px 24px;
  border-radius: 8px;
  font-size: 16px;
  color: #495057;
  min-height: 180px;
}
.file-details-preview h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 17px;
}
.file-details-preview p {
  margin: 7px 0;
  font-size: 15px;
}
.file-details-bordered {
  border: 2px solid #e0e0e0; /* 与上传区域统一 */
  border-radius: 8px;
  padding: 18px 20px;
  background-color: #fdfdff; /* 与上传区域统一 */
  color: #0056b3;
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

.model-api-info-blue {
  background-color: #e9f5ff;
  color: #2563eb;
  font-size: 15px;
  font-weight: 500;
  padding: 5px 18px;
  border-radius: 15px;
  border: 1px solid #cce7ff;
  margin-top: 2px;
  margin-bottom: 2px;
  text-align: center;
  display: inline-block;
}
</style>