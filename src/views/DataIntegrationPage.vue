<template>
  <div class="data-integration-page-wrapper">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>

    <div class="page-header">
      <h1 class="page-title">🚀 数据集预览与操作</h1>
      <div class="top-right-icons-container">
        <el-button @click="refreshPage" type="text" class="icon-button"><el-icon><Refresh /></el-icon></el-button>
        <el-button @click="goHome" type="text" class="icon-button"><el-icon><HomeFilled /></el-icon></el-button>
        <span class="current-time">{{ currentTime }}</span>
      </div>
    </div>

    <div class="content-layout">
      <div class="main-content-area">
        <el-card class="main-card">
          <div class="actions-toolbar">
            <el-button type="primary" @click="triggerRemoveSensitiveWords" :loading="isLoadingSensitive">
              <el-icon><Delete /></el-icon> 去除敏感词
            </el-button>
            <el-upload
              class="upload-area-small"
              drag
              action=""
              :auto-upload="false"
              :show-file-list="false"
              @change="handleFileUpload"
              :disabled="isTableLoading"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">将文件拖拽至此或点击上传</div>
            </el-upload>
            <div class="ai-keyword-gen">
              <span>添加敏感词:</span> <!-- 修改了提示 -->
              <el-input v-model="rawKeywordInput" placeholder="输入新敏感词" style="width: 180px; margin: 0 8px;"></el-input>
              <el-button type="success" @click="triggerAddSensitiveKeyword" :loading="isLoadingKeywords" size="small">添加词</el-button>
            </div>
            <el-button type="warning" @click="triggerRemovePersonalInfo" :loading="isLoadingPII">
              <el-icon><User /></el-icon> 去除个人信息
            </el-button>
            <div class="placeholder-box">
              选择下方表格某列进行处理，如Input或Output列。
            </div>
             <!-- 修改功能：暂时通过使表格可编辑实现 -->
            <el-button @click="toggleEditMode" :disabled="isTableLoading">
              <el-icon><EditPen /></el-icon> {{ isEditing ? '完成修改' : '修改数据' }}
            </el-button>
            <el-button type="success" @click="saveData" :disabled="isTableLoading || !hasChanges">
              <el-icon><DocumentChecked /></el-icon> 保存
            </el-button>
          </div>
          
          <!-- 列选择器 -->
          <div class="column-selector" v-if="tableData.length > 0">
            <el-form inline>
              <el-form-item label="选择操作列(敏感词/PII):">
                <el-select v-model="selectedColumnForProcessing" placeholder="选择列" style="width: 220px;">
                  <el-option v-for="col in availableColumns" :key="col.prop" :label="col.label" :value="col.prop"></el-option>
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="tableData" v-loading="isTableLoading" stripe style="width: 100%;" border height="calc(100vh - 350px)">
            <el-table-column
              v-for="column in tableColumns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :min-width="column.minWidth"
              :width="column.width"
            >
              <template #default="scope">
                <div v-if="isEditing && column.editable">
                  <el-input v-model="scope.row[column.prop]" size="small" @input="markChanges" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }"/>
                </div>
                <div v-else>
                  <div v-if="scope.row[column.prop + 'Value']" class="output-value-bar"> <!-- For value bars like '1 value' -->
                    <span>{{ scope.row[column.prop + 'Value'] }}</span>
                  </div>
                  <pre v-if="isJsonString(scope.row[column.prop])" class="json-display">{{ formatJson(scope.row[column.prop]) }}</pre>
                  <pre v-else class="text-display">{{ scope.row[column.prop] }}</pre>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <div class="right-sidebar">
        <el-card class="file-stats-card">
          <h3>文件统计:</h3>
          <p>数据条目: {{ fileStats.entries }}</p>
          <p>最长字段长度: {{ fileStats.maxLength }}</p>
          <p>文件大小: {{ fileStats.size }}</p>
          <p>......</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { UploadFilled, Refresh, HomeFilled, Delete, User, EditPen, DocumentChecked, Loading } from '@element-plus/icons-vue';
import axios from 'axios';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'; // ElLoading for full screen

// API Base URLs (确保这些指向你正在运行的Flask服务)
const API_BASE_URL_SENSITIVE = 'http://localhost:5002/api';
const API_BASE_URL_PII = 'http://localhost:5001/api';
// 假设有一个保存数据的API
const API_BASE_URL_DATA_STORAGE = 'http://localhost:5003/api'; // Placeholder

export default {
  name: 'DataIntegrationPage',
  components: { UploadFilled, Refresh, HomeFilled, Delete, User, EditPen, DocumentChecked, Loading },
  data() {
    return {
      currentTime: new Date().toLocaleTimeString(),
      rawKeywordInput: '',
      tableData: [],
      originalTableDataForDiff: null, // For tracking changes
      isEditing: false,
      hasChanges: false,
      tableColumns: [ // 定义表格列，方便动态渲染和编辑控制
        { prop: 'instruction', label: 'Instruction', minWidth: '220', editable: true },
        { prop: 'input', label: 'Input', minWidth: '220', editable: true },
        { prop: 'context', label: 'Context', minWidth: '220', editable: true },
        { prop: 'output', label: 'Output', minWidth: '220', editable: true },
      ],
      selectedColumnForProcessing: 'output', // 默认处理 output 列

      fileStats: { entries: 0, maxLength: 0, size: "0KB" },
      isLoadingSensitive: false,
      isLoadingPII: false,
      isLoadingKeywords: false,
      isTableLoading: false, // 用于表格数据的整体加载状态
      loadingInstance: null, // For full-screen loading
    };
  },
  computed: {
    availableColumns() {
      // 提供可选的列进行处理，通常是包含文本的列
      return this.tableColumns.filter(col => col.editable); // Example: only editable columns
    }
  },
  methods: {
    showFullScreenLoading(text = '处理中...') {
      this.loadingInstance = ElLoading.service({
        lock: true,
        text: text,
        background: 'rgba(0, 0, 0, 0.7)',
      });
    },
    hideFullScreenLoading() {
      if (this.loadingInstance) {
        this.loadingInstance.close();
      }
    },
    isJsonString(str) {
      if (typeof str !== 'string') return false;
      try {
        const obj = JSON.parse(str);
        return typeof obj === 'object' && obj !== null;
      } catch (e) {
        return false;
      }
    },
    formatJson(str) {
      try {
        return JSON.stringify(JSON.parse(str), null, 2);
      } catch (e) {
        return str; // if not valid JSON, return original
      }
    },
    refreshPage() { location.reload(); },
    goHome() { this.$router.push('/'); },

    async handleFileUpload(uploadFile) {
      this.isTableLoading = true;
      this.showFullScreenLoading('正在加载和解析文件...');
      try {
        const fileContent = await this.readFileContent(uploadFile.raw);
        const jsonData = JSON.parse(fileContent); // 假设上传的是JSON数组
        if (Array.isArray(jsonData)) {
          this.tableData = jsonData.map(item => {
            // 如果原始数据中的 input 是对象，将其字符串化以便于显示和编辑
            if (typeof item.input === 'object' && item.input !== null) {
              item.input = JSON.stringify(item.input, null, 2);
            }
            return item;
          });
          this.fileStats = {
            entries: this.tableData.length,
            // maxLength and size would require more complex calculation or server-side info
            maxLength: 'N/A',
            size: `${(uploadFile.size / 1024).toFixed(2)}KB`
          };
          this.originalTableDataForDiff = JSON.stringify(this.tableData); // Store for change detection
          this.hasChanges = false;
          ElMessage.success(`文件 ${uploadFile.name} 加载成功!`);
        } else {
          ElMessage.error('上传的文件不是有效的JSON数组格式。');
          this.tableData = [];
        }
      } catch (error) {
        console.error('File processing error:', error);
        ElMessage.error('文件处理失败: ' + error.message);
        this.tableData = [];
      } finally {
        this.isTableLoading = false;
        this.hideFullScreenLoading();
      }
    },
    readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file); // Read as text for JSON
      });
    },

    async processDataWithApi(apiEndpoint, payload, loadingFlagSetter, successMessage) {
      if (this.tableData.length === 0) {
        ElMessage.warning('表格中没有数据可以处理。');
        return;
      }
      if (!this.selectedColumnForProcessing) {
        ElMessage.warning('请选择要操作的列。');
        return;
      }

      loadingFlagSetter(true);
      this.isTableLoading = true; // Also set general table loading
      this.showFullScreenLoading();

      try {
        const requestPayload = {
          data: JSON.parse(JSON.stringify(this.tableData)), // Send a deep copy
          text_column: this.selectedColumnForProcessing
        };
        const response = await axios.post(apiEndpoint, requestPayload);
        this.tableData = response.data.processed_data.map(item => {
            // Ensure input remains stringified if it was
            if (this.isJsonString(item.input)) {
              // No specific action needed if API returns it as string
            } else if (typeof item.input === 'object' && item.input !== null) {
              item.input = JSON.stringify(item.input, null, 2);
            }
            return item;
        });
        this.markChanges(); // Data has changed
        ElMessage.success(response.data.message || successMessage);
      } catch (error) {
        console.error(`Error during API call ${apiEndpoint}:`, error);
        ElMessage.error('操作失败: ' + (error.response?.data?.error || error.message));
      } finally {
        loadingFlagSetter(false);
        this.isTableLoading = false;
        this.hideFullScreenLoading();
      }
    },

    // 敏感词过滤（本地脚本参数通过前端传递）
    async triggerRemoveSensitiveWords() {
      if (this.tableData.length === 0) {
        ElMessage.warning('表格中没有数据可以处理。');
        return;
      }
      if (!this.selectedColumnForProcessing) {
        ElMessage.warning('请选择要操作的列。');
        return;
      }
      this.isLoadingSensitive = true;
      this.isTableLoading = true;
      this.showFullScreenLoading('正在去除敏感词...');
      try {
        // 前端将数据保存为临时文件，传递 input_path/output_path/text_column
        const inputData = this.tableData;
        const inputPath = 'temp_input.json';
        const outputPath = 'temp_output.json';
        // 假设后端提供 /filter_sensitive 接口，参数与脚本一致
        const response = await axios.post(`${API_BASE_URL_SENSITIVE}/filter_sensitive`, {
          input_path: inputPath,
          output_path: outputPath,
          text_column: this.selectedColumnForProcessing,
          data: inputData // 直接传递数据，后端可落盘
        });
        if (response.data && response.data.processed_data) {
          this.tableData = response.data.processed_data;
          this.markChanges();
          ElMessage.success(response.data.message || '敏感词过滤完成！');
        } else {
          ElMessage.error('敏感词过滤失败：无返回数据');
        }
      } catch (error) {
        ElMessage.error('敏感词过滤失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isLoadingSensitive = false;
        this.isTableLoading = false;
        this.hideFullScreenLoading();
      }
    },

    // 去除个人信息（本地脚本参数通过前端传递）
    async triggerRemovePersonalInfo() {
      if (this.tableData.length === 0) {
        ElMessage.warning('表格中没有数据可以处理。');
        return;
      }
      if (!this.selectedColumnForProcessing) {
        ElMessage.warning('请选择要操作的列。');
        return;
      }
      this.isLoadingPII = true;
      this.isTableLoading = true;
      this.showFullScreenLoading('正在去除个人信息...');
      try {
        // 前端将数据保存为临时文件，传递 input_path/output_path/text_column
        const inputData = this.tableData;
        const inputPath = 'temp_input.json';
        const outputPath = 'temp_output.json';
        // 假设后端提供 /remove_pii 接口，参数与脚本一致
        const response = await axios.post(`${API_BASE_URL_PII}/remove_pii`, {
          input_path: inputPath,
          output_path: outputPath,
          text_column: this.selectedColumnForProcessing,
          data: inputData // 直接传递数据，后端可落盘
        });
        if (response.data && response.data.processed_data) {
          this.tableData = response.data.processed_data;
          this.markChanges();
          ElMessage.success(response.data.message || '个人信息去除完成！');
        } else {
          ElMessage.error('个人信息去除失败：无返回数据');
        }
      } catch (error) {
        ElMessage.error('个人信息去除失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isLoadingPII = false;
        this.isTableLoading = false;
        this.hideFullScreenLoading();
      }
    },

    async triggerAddSensitiveKeyword() {
      if (!this.rawKeywordInput.trim()) {
        ElMessage.warning('请输入要添加的敏感词。');
        return;
      }
      this.isLoadingKeywords = true;
      this.showFullScreenLoading('正在添加敏感词...');
      try {
        const payload = {
          raw_keyword_input: this.rawKeywordInput.trim() // Python API expects this key
        };
        const response = await axios.post(`${API_BASE_URL_SENSITIVE}/generate_sensitive_keyword`, payload);
        ElMessage.success(response.data.message || `关键词 "${this.rawKeywordInput.trim()}" 已添加。`);
        this.rawKeywordInput = '';
        // Optionally, inform user they might want to re-filter
        ElMessage.info('敏感词列表已更新，您可能需要重新执行“去除敏感词”操作。');
      } catch (error) {
        console.error('Error adding sensitive keyword:', error);
        ElMessage.error('添加敏感词失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isLoadingKeywords = false;
        this.hideFullScreenLoading();
      }
    },

    toggleEditMode() {
      this.isEditing = !this.isEditing;
      if (this.isEditing) {
        // Store a snapshot of data when entering edit mode to compare for changes
        this.originalTableDataForDiff = JSON.stringify(this.tableData);
        this.hasChanges = false; // Reset hasChanges when entering edit mode
        ElMessage.info('数据修改模式已开启。完成后请点击“完成修改”。');
      } else {
        // Exiting edit mode
        this.markChanges(); // Check if any changes were made
        ElMessage.success('数据修改模式已关闭。');
      }
    },
    markChanges() {
        // Call this whenever an input in edit mode changes
        if (this.isEditing) {
             this.hasChanges = JSON.stringify(this.tableData) !== this.originalTableDataForDiff;
        }
    },

    async saveData() {
      if (!this.hasChanges && !this.isEditing) { // Check if any changes were made or if still in edit mode
          ElMessage.info('数据未发生更改，无需保存。');
          return;
      }
      if (this.isEditing) {
          ElMessage.warning('请先点击“完成修改”退出编辑模式，再保存数据。');
          return;
      }

      this.showFullScreenLoading('正在保存数据...');
      this.isTableLoading = true;
      try {
        // Simulate saving data to a backend. Replace with actual API call.
        // const response = await axios.post(`${API_BASE_URL_DATA_STORAGE}/save_data`, this.tableData);
        // ElMessage.success(response.data.message || '数据保存成功！');

        // Frontend simulation:
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        console.log("Data to save:", JSON.parse(JSON.stringify(this.tableData)));
        localStorage.setItem('integratedData', JSON.stringify(this.tableData)); // Example: save to localStorage
        this.originalTableDataForDiff = JSON.stringify(this.tableData); // Update baseline
        this.hasChanges = false;
        ElMessage.success('数据已“保存”（模拟到localStorage）！');

      } catch (error) {
        console.error('Error saving data:', error);
        ElMessage.error('数据保存失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isTableLoading = false;
        this.hideFullScreenLoading();
      }
    },
  },
  mounted() {
    this.timer = setInterval(() => { this.currentTime = new Date().toLocaleTimeString(); }, 1000);
    // Optionally load data from localStorage on mount
    const savedData = localStorage.getItem('integratedData');
    if (savedData) {
      try {
        this.tableData = JSON.parse(savedData);
        this.originalTableDataForDiff = JSON.stringify(this.tableData);
        this.fileStats.entries = this.tableData.length;
         ElMessage.info('已从本地存储加载之前保存的数据。');
      } catch (e) {
        localStorage.removeItem('integratedData'); // Clear corrupted data
      }
    } else {
        // Populate with initial sample data if nothing in localStorage
        this.tableData = [
            { input: JSON.stringify({ role: "user", content: "Polar bears like unique arrays - that is, arrays without repeated..." }, null, 2), output: "<think> Okay, I need to solve this problem where I have to...", outputValue: "1 value", category: "code", categoryValue: "1 value", license: "cc-by-4.0", licenseValue: "1 value", reasoning: "on", reasoningValue: "1 value" },
            { input: JSON.stringify({ role: "user", content: "Furlo and Rublo play a game. The table has n piles of coins lying..." }, null, 2), output: "<think> Okay, I need to solve this problem where two players...", outputValue: "968", category: "code", categoryValue: "143k", license: "cc-by-4.0", reasoning: "on" },
        ];
        this.originalTableDataForDiff = JSON.stringify(this.tableData);
        this.fileStats.entries = this.tableData.length;
    }
  },
  beforeUnmount() {
    clearInterval(this.timer);
    if (this.loadingInstance) {
      this.loadingInstance.close();
    }
  }
};
</script>

<style scoped>
/* ... (styles from previous answer, with adjustments if needed) ... */
.data-integration-page-wrapper {
  padding: 20px; box-sizing: border-box; height: calc(100vh - 12px);
  display: flex; flex-direction: column; overflow: hidden;
}
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 15px; /* Reduced margin */
}
.page-title { font-size: 24px; font-weight: bold; color: #303133; margin: 0; }
.top-right-icons-container { display: flex; align-items: center; }
.icon-button { font-size: 24px; /* Slightly smaller */ color: #409EFF; background-color: transparent; border: none; padding: 5px; }
.icon-button .el-icon { font-size: inherit; }
.current-time { font-size: 20px; /* Slightly smaller */ color: purple; font-weight: bold; margin-left: 12px; }

.content-layout { display: flex; flex-grow: 1; gap: 15px; overflow: hidden; }
.main-content-area { flex-grow: 1; display: flex; flex-direction: column; min-width: 0; }
.main-card { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
.main-card :deep(.el-card__body) { display: flex; flex-direction: column; height: 100%; padding: 12px; }

.actions-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  margin-bottom: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 6px;
}
.actions-toolbar > .el-button,
.actions-toolbar > .upload-area-small,
.actions-toolbar > .ai-keyword-gen,
.actions-toolbar > .placeholder-box { margin-bottom: 4px; }

.column-selector {
  margin-bottom: 10px;
  padding: 5px;
  background-color: #f0f2f5;
  border-radius: 4px;
}
.column-selector .el-form-item {
  margin-bottom: 0; /* Remove default bottom margin for inline form item */
}


.upload-area-small { width: 180px; }
.upload-area-small :deep(.el-upload-dragger) { padding: 6px; height: auto; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.upload-area-small :deep(.el-icon--upload) { font-size: 24px; margin-bottom: 3px; }
.upload-area-small :deep(.el-upload__text) { font-size: 10px; }

.ai-keyword-gen { display: flex; align-items: center; background-color: #e9ecef; padding: 5px 8px; border-radius: 6px; font-size: 12px; }
.ai-keyword-gen .el-input { height: 28px; }
.ai-keyword-gen .el-button { height: 28px; padding: 0 8px; }

.placeholder-box { background-color: #6c757d; /* Darker gray */ color: white; padding: 6px 10px; border-radius: 6px; font-size: 11px; text-align: center; min-width: 150px; line-height: 1.2; }

.el-table { flex-grow: 1; min-height: 250px; } /* Ensure table grows */
.el-table :deep(th .cell), .el-table :deep(td .cell) {
    word-break: break-word; /* Allow long words to break */
}
.el-table :deep(td .el-textarea__inner) { /* Style for textarea in edit mode */
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.8em;
    padding: 4px;
}


.json-display, .text-display {
  background-color: #f8f9fa; padding: 6px; border-radius: 4px;
  font-family: 'Courier New', Courier, monospace; font-size: 0.8em;
  white-space: pre-wrap; word-break: break-all; max-height: 100px; overflow-y: auto;
  display: block; /* Ensure pre takes block display */
  text-align: left; /* Ensure text inside pre is left-aligned */
}
.text-display { background-color: transparent; padding: 0; max-height: none; } /* Simpler display for non-JSON */

.output-value-bar { background-color: #e0e0e0; padding: 1px 4px; border-radius: 3px; font-size: 0.75em; margin-bottom: 4px; display: inline-block; }

.right-sidebar { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: calc(100vh - 20px - 20px - 30px); /* vp - pad*2 - header_approx */ }
.loading-placeholder { background-color: #aedcfc; color: #004085; text-align: center; padding: 12px; }
.loading-placeholder .el-icon { font-size: 24px; margin-bottom: 6px; }
.file-stats-card { background-color: #fefefe; padding: 10px; }
.file-stats-card h3 { margin-top: 0; margin-bottom: 6px; font-size: 14px; color: #333; }
.file-stats-card p { font-size: 12px; margin: 3px 0; color: #555; }

/* Floating particles and rainbow stripes (same as before) */
.floating-particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -2; }
@keyframes float { 0% { transform: translateY(0) translateX(0); opacity: 0.5; } 50% { opacity: 1; } 100% { transform: translateY(-200px) translateX(80px); opacity: 0; } }
.floating-particles::before, .floating-particles::after { content: ''; position: absolute; top: 100%; left: 50%; width: 10px; height: 10px; background-color: #a3bffa; border-radius: 50%; animation: float 4s infinite linear; opacity: 0.5; }
.floating-particles::after { width: 15px; height: 15px; background-color: #9f7aea; animation-duration: 6s; animation-delay: 2s; }
.rainbow-stripes { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, #f7d1d1, #f9e1b2, #f3f9b6, #d1f3e1, #b8d3f3, #d0bdf0, #f0b8f6); background-size: 400% 400%; animation: rainbowMove 10s linear infinite; pointer-events: none; z-index: -3; }
@keyframes rainbowMove { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
</style>