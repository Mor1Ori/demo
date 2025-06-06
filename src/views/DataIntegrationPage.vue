<template>
  <div class="data-integration-page-wrapper">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>

    <div class="page-header">
      <h1 class="page-title">🚀 数据集预览</h1>
      <div class="top-right-icons-container">
        <el-button @click="refreshPage" type="text" class="icon-button"><el-icon><Refresh /></el-icon></el-button>
        <el-button @click="goHome" type="text" class="icon-button"><el-icon><HomeFilled /></el-icon></el-button>
        <span class="current-time">{{ currentTime }}</span>
      </div>
    </div>

    <div class="content-layout">
      <div class="main-content-area">
        <el-card class="main-card">
          
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
          <p>文件大小: {{ fileStats.size }}</p>
          <div v-if="fileStats.maxFieldLengths" class="max-field-lengths">
            <p class="section-title">各字段最大长度:</p>
            <div v-for="(length, field) in fileStats.maxFieldLengths" :key="field" class="field-length-item">
              <span class="field-name">{{ field }}:</span>
              <span class="field-value">{{ length }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { UploadFilled, Refresh, HomeFilled, Delete, User, EditPen, DocumentChecked, Loading } from '@element-plus/icons-vue';
import axios from 'axios';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';

// API Base URLs
const API_BASE_URL_SENSITIVE = 'http://localhost:5002/api';
const API_BASE_URL_PII = 'http://localhost:5001/api';
const API_BASE_URL_DATA_STORAGE = 'http://localhost:5003/api'; // Placeholder

export default {
  name: 'DataIntegrationPage',
  components: { UploadFilled, Refresh, HomeFilled, Delete, User, EditPen, DocumentChecked, Loading },
  data() {
    return {
      currentTime: new Date().toLocaleTimeString(),
      rawKeywordInput: '',
      tableData: [],
      originalTableDataForDiff: null,
      isEditing: false,
      hasChanges: false,
      tableColumns: [ // Defined table columns
        { prop: 'instruction', label: 'Instruction', minWidth: '220', editable: true },
        { prop: 'input', label: 'Input', minWidth: '220', editable: true },
        { prop: 'context', label: 'Context', minWidth: '220', editable: true },
        { prop: 'output', label: 'Output', minWidth: '220', editable: true },
      ],
      selectedColumnForProcessing: 'output',
      fileStats: { entries: 0, size: "0KB", maxFieldLengths: {} }, // Initialize maxFieldLengths
      isLoadingSensitive: false,
      isLoadingPII: false,
      isLoadingKeywords: false,
      isTableLoading: false,
      loadingInstance: null,
      timer: null, // Ensure timer is declared for clearInterval
    };
  },
  computed: {
    availableColumns() {
      return this.tableColumns.filter(col => col.editable);
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
        return str;
      }
    },
    refreshPage() { location.reload(); },
    goHome() { this.$router.push('/'); },

    async handleFileUpload(uploadFile) {
      this.isTableLoading = true;
      this.showFullScreenLoading('正在加载和解析文件...');
      try {
        const fileContent = await this.readFileContent(uploadFile.raw);
        const jsonData = JSON.parse(fileContent);
        if (Array.isArray(jsonData)) {
          this.tableData = jsonData.map(item => {
            const processedItem = {};
            this.tableColumns.forEach(columnDef => {
              const fieldKey = columnDef.prop;
              if (item.hasOwnProperty(fieldKey) && item[fieldKey] !== null) {
                processedItem[fieldKey] = typeof item[fieldKey] === 'object'
                  ? JSON.stringify(item[fieldKey], null, 2)
                  : String(item[fieldKey]);
              } else {
                processedItem[fieldKey] = ''; // Default to empty string
              }
            });
            return processedItem;
          });

          this.fileStats = {
            entries: this.tableData.length,
            maxLength: 'N/A', // Or calculate if needed
            size: `${(uploadFile.raw.size / 1024).toFixed(2)}KB`,
            maxFieldLengths: {} // This would need to be calculated from jsonData if required here
          };
          this.originalTableDataForDiff = JSON.stringify(this.tableData);
          this.hasChanges = false;
          ElMessage.success(`文件 ${uploadFile.name} 加载成功!`);
        } else {
          ElMessage.error('上传的文件不是有效的JSON数组格式。');
          this.tableData = [];
          this.initializeEmptyData(); // Reset stats
        }
      } catch (error) {
        console.error('File processing error:', error);
        ElMessage.error('文件处理失败: ' + error.message);
        this.tableData = [];
        this.initializeEmptyData(); // Reset stats
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
        reader.readAsText(file);
      });
    },

    // PII and Sensitive words processing (simplified, ensure your existing logic is preserved)
    async processDataWithApi(apiEndpoint, _payload, loadingFlagSetter, successMessage) {
        if (this.tableData.length === 0) {
            ElMessage.warning('表格中没有数据可以处理。');
            return;
        }
        if (!this.selectedColumnForProcessing) {
            ElMessage.warning('请选择要操作的列。');
            return;
        }

        loadingFlagSetter(true);
        this.isTableLoading = true;
        this.showFullScreenLoading();

        try {
            const requestPayload = {
                data: JSON.parse(JSON.stringify(this.tableData)),
                text_column: this.selectedColumnForProcessing
            };
            
            const response = await axios.post(apiEndpoint, requestPayload);
            if (response.data && response.data.processed_data) {
                this.tableData = response.data.processed_data.map(item => {
                    const processedItem = {};
                    this.tableColumns.forEach(columnDef => {
                        const fieldKey = columnDef.prop;
                        if (item.hasOwnProperty(fieldKey) && item[fieldKey] !== null) {
                            processedItem[fieldKey] = typeof item[fieldKey] === 'object'
                                ? JSON.stringify(item[fieldKey], null, 2)
                                : String(item[fieldKey]);
                        } else {
                            processedItem[fieldKey] = '';
                        }
                    });
                    return processedItem;
                });
                this.markChanges();
                ElMessage.success(response.data.message || successMessage);
            } else {
                 ElMessage.error('处理失败：API未返回有效数据。');
            }
        } catch (error) {
            console.error(`Error during API call ${apiEndpoint}:`, error);
            ElMessage.error('操作失败: ' + (error.response?.data?.error || error.message));
        } finally {
            loadingFlagSetter(false);
            this.isTableLoading = false;
            this.hideFullScreenLoading();
        }
    },

    async triggerRemoveSensitiveWords() {
        if (this.tableData.length === 0 || !this.selectedColumnForProcessing) {
            ElMessage.warning(!this.tableData.length ? '表格中没有数据。' : '请选择操作列。');
            return;
        }
        this.isLoadingSensitive = true;
        this.isTableLoading = true;
        this.showFullScreenLoading('正在去除敏感词...');
        try {
            const response = await axios.post(`${API_BASE_URL_SENSITIVE}/filter_sensitive`, {
                input_path: 'temp_input.json', // Backend might ignore if data is present
                output_path: 'temp_output.json',// Backend might ignore if data is present
                text_column: this.selectedColumnForProcessing,
                data: this.tableData // Send current table data
            });
            if (response.data && response.data.processed_data) {
                this.tableData = response.data.processed_data.map(item => { // Re-map to ensure structure
                    const processedItem = {};
                    this.tableColumns.forEach(columnDef => {
                        const fieldKey = columnDef.prop;
                        if (item.hasOwnProperty(fieldKey) && item[fieldKey] !== null) {
                            processedItem[fieldKey] = typeof item[fieldKey] === 'object' ? JSON.stringify(item[fieldKey], null, 2) : String(item[fieldKey]);
                        } else {
                            processedItem[fieldKey] = '';
                        }
                    });
                    return processedItem;
                });
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

    async triggerRemovePersonalInfo() {
        if (this.tableData.length === 0 || !this.selectedColumnForProcessing) {
            ElMessage.warning(!this.tableData.length ? '表格中没有数据。' : '请选择操作列。');
            return;
        }
        this.isLoadingPII = true;
        this.isTableLoading = true;
        this.showFullScreenLoading('正在去除个人信息...');
        try {
            const response = await axios.post(`${API_BASE_URL_PII}/remove_pii`, {
                input_path: 'temp_input.json', // Backend might ignore if data is present
                output_path: 'temp_output.json',// Backend might ignore if data is present
                text_column: this.selectedColumnForProcessing,
                data: this.tableData // Send current table data
            });
            if (response.data && response.data.processed_data) {
                this.tableData = response.data.processed_data.map(item => { // Re-map to ensure structure
                    const processedItem = {};
                    this.tableColumns.forEach(columnDef => {
                        const fieldKey = columnDef.prop;
                        if (item.hasOwnProperty(fieldKey) && item[fieldKey] !== null) {
                            processedItem[fieldKey] = typeof item[fieldKey] === 'object' ? JSON.stringify(item[fieldKey], null, 2) : String(item[fieldKey]);
                        } else {
                            processedItem[fieldKey] = '';
                        }
                    });
                    return processedItem;
                });
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
        const payload = { raw_keyword_input: this.rawKeywordInput.trim() };
        const response = await axios.post(`${API_BASE_URL_SENSITIVE}/generate_sensitive_keyword`, payload);
        ElMessage.success(response.data.message || `关键词 "${this.rawKeywordInput.trim()}" 已添加。`);
        this.rawKeywordInput = '';
        ElMessage.info('敏感词列表已更新，您可能需要重新执行"去除敏感词"操作。');
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
        this.originalTableDataForDiff = JSON.stringify(this.tableData);
        this.hasChanges = false;
        ElMessage.info('数据修改模式已开启。完成后请点击"完成修改"。');
      } else {
        this.markChanges();
        ElMessage.success('数据修改模式已关闭。');
      }
    },
    markChanges() {
      if (this.isEditing || this.originalTableDataForDiff !== null) { // Ensure originalTableDataForDiff is set
         this.hasChanges = JSON.stringify(this.tableData) !== this.originalTableDataForDiff;
      }
    },

    async saveData() {
      if (!this.hasChanges && !this.isEditing) {
        ElMessage.info('数据未发生更改，无需保存。');
        return;
      }
      if (this.isEditing) {
        ElMessage.warning('请先点击"完成修改"退出编辑模式，再保存数据。');
        return;
      }
      this.showFullScreenLoading('正在保存数据...');
      this.isTableLoading = true;
      try {
        // Simulate saving to localStorage
        await new Promise(resolve => setTimeout(resolve, 1000));
        localStorage.setItem('integratedData', JSON.stringify(this.tableData));
        // Potentially save fileStats as well if they are important to persist with the data
        // localStorage.setItem('integratedFileStats', JSON.stringify(this.fileStats));
        this.originalTableDataForDiff = JSON.stringify(this.tableData);
        this.hasChanges = false;
        ElMessage.success('数据已模拟保存到localStorage！');
      } catch (error) {
        console.error('Error saving data:', error);
        ElMessage.error('数据保存失败: ' + error.message);
      } finally {
        this.isTableLoading = false;
        this.hideFullScreenLoading();
      }
    },

    initializeEmptyData() {
      this.tableData = [];
      this.originalTableDataForDiff = JSON.stringify([]); // Initialize with empty array string
      this.fileStats = {
        entries: 0,
        size: '0KB',
        maxFieldLengths: {}
      };
      this.hasChanges = false;
    },
  },
  mounted() {
    this.timer = setInterval(() => { this.currentTime = new Date().toLocaleTimeString(); }, 1000);

    // --- CRITICAL CHANGE: Access history.state directly ---
    const navigationState = history.state;
    console.log("DataIntegrationPage mounted. history.state:", navigationState); // For debugging

    if (navigationState && navigationState.integratedData) {
      ElMessage.success('从路由状态 (history.state) 检测到数据!');

      // Ensure integratedData is an array before mapping
      if (Array.isArray(navigationState.integratedData)) {
        this.tableData = navigationState.integratedData.map(item => {
          const processedItem = {};
          this.tableColumns.forEach(columnDef => {
            const fieldKey = columnDef.prop;
            if (item && typeof item === 'object' && item.hasOwnProperty(fieldKey) && item[fieldKey] !== null) {
              processedItem[fieldKey] = typeof item[fieldKey] === 'object'
                ? JSON.stringify(item[fieldKey], null, 2)
                : String(item[fieldKey]);
            } else {
              processedItem[fieldKey] = ''; // Default to empty string if data is missing/null or item is not an object
            }
          });
          return processedItem;
        });
      } else {
        ElMessage.error('路由状态中的 integratedData 不是有效的数组。');
        this.initializeEmptyData();
      }
      

      if (navigationState.fileStats) {
        this.fileStats = {
          entries: navigationState.fileStats.entries,
          size: navigationState.fileStats.size, // Already formatted by sender
          maxFieldLengths: navigationState.fileStats.maxFieldLengths || {}
        };
      } else {
        ElMessage.warning('路由状态 (history.state) 中未找到 fileStats。');
        // Initialize fileStats if not found but tableData is present
        if (this.tableData.length > 0) {
            this.fileStats.entries = this.tableData.length;
            // Size and maxFieldLengths would be unknown without explicit calculation here or if not passed
        }
      }

      this.originalTableDataForDiff = JSON.stringify(this.tableData);
      this.hasChanges = false; // Reset changes flag after loading
      ElMessage.success('数据加载成功！');
      console.log("Table data populated from history.state:", JSON.parse(JSON.stringify(this.tableData)));
      console.log("File stats populated from history.state:", JSON.parse(JSON.stringify(this.fileStats)));

    } else {
      ElMessage.info('路由状态 (history.state) 中未检测到数据，尝试从localStorage加载。');
      const savedData = localStorage.getItem('integratedData');
      // const savedFileStats = localStorage.getItem('integratedFileStats'); // If you decide to save/load stats too

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (Array.isArray(parsedData)) {
            this.tableData = parsedData; // Assuming data in localStorage is already in correct stringified format
            this.originalTableDataForDiff = JSON.stringify(this.tableData);
            this.hasChanges = false;

            // if (savedFileStats) {
            //   this.fileStats = JSON.parse(savedFileStats);
            // } else
            if (this.tableData.length > 0 && this.fileStats.entries === 0) { // Basic recovery for entries
                this.fileStats.entries = this.tableData.length;
            }
            ElMessage.info('已从本地存储加载之前保存的数据。');
          } else {
            ElMessage.error('本地存储中的数据格式无效。');
            localStorage.removeItem('integratedData');
            this.initializeEmptyData();
          }
        } catch (e) {
          ElMessage.error('解析本地存储数据失败。');
          localStorage.removeItem('integratedData');
          // localStorage.removeItem('integratedFileStats');
          this.initializeEmptyData();
        }
      } else {
        this.initializeEmptyData();
        ElMessage.info('本地存储中也未找到数据，表格初始化为空。');
      }
    }
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
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
.file-stats-card {
  background-color: #fefefe;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.file-stats-card h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 8px;
}

.file-stats-card p {
  font-size: 14px;
  margin: 8px 0;
  color: #555;
  line-height: 1.4;
}

.max-field-lengths {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
}

.section-title {
  font-weight: 500;
  color: #409EFF !important;
  margin-bottom: 8px !important;
}

.field-length-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0;
  font-size: 13px;
}

.field-name {
  color: #606266;
  font-weight: 500;
}

.field-value {
  color: #67C23A;
  font-weight: 600;
}

/* Floating particles and rainbow stripes (same as before) */
.floating-particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -2; }
@keyframes float { 0% { transform: translateY(0) translateX(0); opacity: 0.5; } 50% { opacity: 1; } 100% { transform: translateY(-200px) translateX(80px); opacity: 0; } }
.floating-particles::before, .floating-particles::after { content: ''; position: absolute; top: 100%; left: 50%; width: 10px; height: 10px; background-color: #a3bffa; border-radius: 50%; animation: float 4s infinite linear; opacity: 0.5; }
.floating-particles::after { width: 15px; height: 15px; background-color: #9f7aea; animation-duration: 6s; animation-delay: 2s; }
.rainbow-stripes { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, #f7d1d1, #f9e1b2, #f3f9b6, #d1f3e1, #b8d3f3, #d0bdf0, #f0b8f6); background-size: 400% 400%; animation: rainbowMove 10s linear infinite; pointer-events: none; z-index: -3; }
@keyframes rainbowMove { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
</style>