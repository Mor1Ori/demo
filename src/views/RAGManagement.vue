<template>
  <div style="padding-left: 20px;width: 100%;padding-top: 10px;overflow: hidden;" >
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>
    <div class="top-right-icons">
      <el-button @click="refreshPage" type="text" style="width: 60px;"><el-icon style="font-size: 33px;"><Refresh /></el-icon></el-button>
      <el-button @click="goHome" type="text" style="width: 60px;"><el-icon style="font-size: 30px;"><HomeFilled /></el-icon></el-button>
      <span style="font-size: 24px; color: purple; font-weight: bold; padding-left: 20px;">{{ currentTime }}</span>
    </div>
    <h1 style="font-size: 24px; margin-bottom: 20px;">📁 RAG 模块管理</h1>
    
    <div style="display:flex; justify-content: space-between; align-items: center; height: 50px; margin-bottom: 20px;">
      <div style="display: flex;">
        <!-- Button 1: 上传向量化检索文档 -->
        <el-upload
          action=""
          :multiple="true"
          :auto-upload="false"
          @change="handleVectorUpload"
          :show-file-list="false">
          <el-button class="yellow-action-btn">上传向量化检索文档</el-button>
        </el-upload>

        <!-- Button 2: 上传数据库文件 -->
        <el-upload
          action=""
          :multiple="true"
          :auto-upload="false"
          @change="handleDatabaseUpload"
          :show-file-list="false">
          <el-button type="primary" style="margin-left: 10px;"><el-icon><Coin /></el-icon> 上传数据库文件</el-button>
        </el-upload>

        <!-- Button 3: 上传整个文件夹 -->
        <el-button class="yellow-action-btn" style="margin-left: 10px;" @click="uploadFolder">上传整个文件夹</el-button>
      </div>

      <div style="height: 50px; margin-right: 20px;">
        <el-input
          v-model="searchQuery"
          placeholder="输入文件名搜索"
          clearable
          style="padding-right: 10px; width: 250px;height: 40px;"
        />
        <el-button
          type="primary"
          @click="searchDocuments"
          style=" padding-left: 10px;"
        >
          <el-icon><Search /></el-icon> 搜索
        </el-button>
      </div>
    </div>

    <el-card class="table-container">
      <div class="info-header-grid">
        <span class="info-header-label first-label">数据库文件显示：</span>
        <span class="info-header-col-title">数据库表名</span>
        <span class="info-header-col-title">excel文件名</span>
        <span class="info-header-col-title">添加时间</span>
        <span class="info-header-col-title">原excel表名</span>
        <span class="info-header-label first-label">向量搜索文件显示：</span>
        <!-- These are actual column headers in the table below, this is just a label -->
      </div>
      
      <div style="display: flex; margin-top: 5px;">
        <el-table :data="paginatedDocuments" style="width: 100%; font-size: 16px; flex-grow: 1;" size="default" :header-row-style="{height:'45px'}">
          <el-table-column prop="name" label="文件名 (路径)" width="280" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
          <el-table-column prop="doc_type_display" label="文档块数" width="150" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
          <el-table-column prop="date" label="添加时间" width="230" :header-cell-style="blueHeaderStyle" sortable align="center">
            <template #header>
              添加时间 <el-icon style="vertical-align: middle;"><Bottom /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="size_display" label="文件大小" width="150" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                @click="deleteDocument(scope.row.id, scope.row.name)"
                class="custom-delete-btn"
                size="small"
              >
                <el-icon><RemoveFilled /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="right-action-buttons">
          <el-button class="yellow-side-btn">按文件大小排序</el-button>
          <el-button class="yellow-side-btn">按上传时间排序</el-button>
          <el-button class="yellow-side-btn">查看向量储存文件</el-button>
          <el-button class="yellow-side-btn">查看数据库文件</el-button>
        </div>
      </div>

      <div class="footer-stats-container">
        <div class="stats-column">
            <div>
                <span>向量储存文件显示：</span>
                <span class="stat-item">总分块数: {{ vectorStats.totalChunks }}</span>
                <span class="stat-item">总文件数: {{ vectorStats.totalFiles }}</span>
            </div>
            <div style="margin-top: 5px;">
                <span class="stat-item indented">pdf文件: {{ vectorStats.pdfCount }}</span>
                <span class="stat-item">txt文件: {{ vectorStats.txtCount }}</span>
                <span class="stat-item">docx文件: {{ vectorStats.docxCount }}</span>
                <span class="stat-item">csv文件: {{ vectorStats.csvCount }}</span>
            </div>
             <div style="margin-top: 15px;">
                <span>数据库文件显示：</span>
                <span class="stat-item">总表数: {{ databaseStats.totalTables }}</span>
            </div>
        </div>
        <el-button class="custom-clear-all-btn" @click="clearAllDocuments">
            <el-icon><DeleteFilled /></el-icon> 清空所有文件
        </el-button>
      </div>
      
      <div style="margin-top: 15px; text-align: left;">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="filteredDocuments.length"
          :page-size="itemsPerPage"
          v-model:current-page="currentPage"
          :pager-count="5" 
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElCard, ElUpload, ElButton, ElTable, ElTableColumn, ElPagination, ElMessage, ElMessageBox, ElLoading, ElInput, ElIcon } from 'element-plus';
import { UploadFilled, DeleteFilled, Search, Refresh, RemoveFilled, HomeFilled, Coin, Bottom, CaretTop, SortUp, SortDown } from '@element-plus/icons-vue';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // placeholder

export default {
  name: 'RAGManagement',
  components: {
    ElCard, ElUpload, ElButton, ElTable, ElTableColumn, ElPagination, ElInput, ElIcon,
    UploadFilled, DeleteFilled, Search, HomeFilled, Refresh, RemoveFilled, Coin, Bottom, CaretTop, SortUp, SortDown
  },
  data() {
    return {
      documents: [
        { id: '1', name: '参考文件1.pdf', doc_type_display: 'pdf', date: '2025-03-19 10:30:45', size_display: 'A' },
        { id: '2', name: '参考文件2.docx', doc_type_display: 'docx', date: '2025-03-18 14:22:31', size_display: 'A' },
        { id: '3', name: '参考文件3.csv', doc_type_display: 'csv', date: '2025-03-17 09:10:12', size_display: 'A' },
        { id: '4', name: '参考文件4.txt', doc_type_display: 'txt', date: '2025-03-16 16:55:00', size_display: 'A' },
      ],
      vectorStats: {
        totalChunks: 120,
        totalFiles: 4,
        pdfCount: 1,
        txtCount: 1,
        docxCount: 1,
        csvCount: 1,
      },
      databaseStats: {
        totalTables: 12,
      },
      currentPage: 1,
      itemsPerPage: 4,
      searchQuery: '',
      isLoadingTable: false,
      currentTime: new Date().toLocaleTimeString(),
      blueHeaderStyle: { background: '#3B82F6', color: 'white', fontWeight: 'normal', fontSize: '15px' },
    };
  },
  computed: {
    filteredDocuments() {
      if (!this.searchQuery) {
        return this.documents;
      }
      return this.documents.filter(doc =>
        doc.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
    paginatedDocuments() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredDocuments.slice(start, end);
    }
  },
  methods: {
    refreshPage() {
      location.reload();
    },
    goHome() {
      // Assuming you have a router setup
      // this.$router.push('/');
      ElMessage.info('返回首页功能待实现');
    },
    handleFileUpload(uploadFile, type) {
        if (!uploadFile || !uploadFile.raw) {
            ElMessage.error('无效的文件对象');
            return;
        }
        this.addDocument(uploadFile.raw, type);
    },
    handleVectorUpload(uploadFile) {
        this.handleFileUpload(uploadFile, 'vector');
    },
    handleDatabaseUpload(uploadFile) {
        this.handleFileUpload(uploadFile, 'database');
    },
    uploadFolder() {
      ElMessage.info('上传整个文件夹功能待实现');
      // For actual implementation:
      // this.$refs.folderUploadInput.click(); // Trigger hidden input
    },
    // handleFolderFiles(event) {
    //   const files = event.target.files;
    //   // Process folder files
    // },
    async addDocument(rawFile, type = 'vector') {
      this.isLoadingTable = true;
      const loadingInstance = ElLoading.service({ text: '正在上传文件...' });
      try {
        const formData = new FormData();
        formData.append('file', rawFile);
        // formData.append('type', type); // Send type to backend if needed

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        
        const newDoc = {
          id: String(Date.now()), // Simple unique ID
          name: rawFile.name,
          doc_type_display: rawFile.name.split('.').pop() || 'unknown',
          date: new Date().toLocaleString('sv-SE').replace('T', ' '), // Swedish locale for YYYY-MM-DD HH:MM:SS
          size_display: 'B' // Placeholder
        };
        this.documents.unshift(newDoc); // Add to the beginning
        this.vectorStats.totalFiles +=1;
        // Update specific file type count if needed
        
        ElMessage.success(`"${rawFile.name}" 上传成功 (${type})`);
        // this.searchDocuments(''); // Refresh list
      } catch (error) {
        ElMessage.error('文件上传请求失败: ' + error.message);
      } finally {
        this.isLoadingTable = false;
        loadingInstance.close();
      }
    },
    searchDocuments() {
      // Frontend filtering is already handled by computed property `filteredDocuments`
      // If backend search is needed:
      ElMessage.info(`搜索 "${this.searchQuery}"... (前端筛选)`);
      this.currentPage = 1; // Reset to first page after search
    },
    async deleteDocument(fileId, fileName) {
      try {
        await ElMessageBox.confirm(`你确定要删除文件 "${fileName}" 吗？`, '确认删除', { type: 'warning' });
        this.isLoadingTable = true;
        const loadingInstance = ElLoading.service({ text: '正在删除...' });
        try {
          // Mock API Call
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.documents = this.documents.filter(doc => doc.id !== fileId);
          this.vectorStats.totalFiles -=1; // Adjust stats
          // Adjust specific file type counts if necessary
          ElMessage.success(`文件 "${fileName}" 删除成功`);
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      } catch (e) {
        if (e !== 'cancel' && e !== undefined) ElMessage.info('操作已取消');
      }
    },
    async clearAllDocuments() {
      try {
        await ElMessageBox.confirm('你确定要清空所有文件吗？这将无法恢复！', '确认清空', { type: 'warning' });
        this.isLoadingTable = true;
        const loadingInstance = ElLoading.service({ text: '正在清空...' });
        try {
          // Mock API Call
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.documents = [];
          this.vectorStats = { totalChunks: 0, totalFiles: 0, pdfCount: 0, txtCount: 0, docxCount: 0, csvCount: 0 };
          // this.databaseStats = { totalTables: 0 }; // Reset if needed
          ElMessage.success('所有文件已清空');
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      } catch (e) {
        if (e !== 'cancel' && e !== undefined) ElMessage.info('操作已取消');
      }
    },
    // 获取RAG文档列表及统计（2.1）
    async fetchRagManagementData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/rag-management`);
        const data = response.data;
        // 更新统计
        this.vectorStats.totalChunks = data.document_count;
        this.vectorStats.totalFiles = data.file_count;
        this.vectorStats.pdfCount = data.file_type_counts?.pdf || 0;
        this.vectorStats.txtCount = data.file_type_counts?.txt || 0;
        this.vectorStats.docxCount = data.file_type_counts?.docx || 0;
        this.vectorStats.csvCount = data.file_type_counts?.csv || 0;
        // 默认显示 recent_files
        this.documents = (data.recent_files || []).map(f => ({
          id: f.path,
          name: f.path,
          doc_type_display: f.path.split('.').pop() || 'unknown',
          date: f.last_processed?.replace('T', ' ') || '',
          size_display: f.size_bytes ? (f.size_bytes / 1024 / 1024).toFixed(2) + ' MB' : '',
          chunk_count: f.chunk_count
        }));
      } catch (error) {
        ElMessage.error('获取RAG文档列表失败: ' + error.message);
      }
    },

    // 按文件大小排序（2.2）
    async sortByFileSize() {
      try {
        const response = await axios.get(`${API_BASE_URL}/rag-management`);
        const data = response.data;
        this.documents = (data.largest_files || []).map(f => ({
          id: f.path,
          name: f.path,
          doc_type_display: f.path.split('.').pop() || 'unknown',
          date: f.last_processed?.replace('T', ' ') || '',
          size_display: f.size_bytes ? (f.size_bytes / 1024 / 1024).toFixed(2) + ' MB' : '',
          chunk_count: f.chunk_count
        }));
      } catch (error) {
        ElMessage.error('按文件大小排序失败: ' + error.message);
      }
    },

    // 按时间排序（2.2）
    async sortByTime() {
      try {
        const response = await axios.get(`${API_BASE_URL}/rag-management`);
        const data = response.data;
        this.documents = (data.recent_files || []).map(f => ({
          id: f.path,
          name: f.path,
          doc_type_display: f.path.split('.').pop() || 'unknown',
          date: f.last_processed?.replace('T', ' ') || '',
          size_display: f.size_bytes ? (f.size_bytes / 1024 / 1024).toFixed(2) + ' MB' : '',
          chunk_count: f.chunk_count
        }));
      } catch (error) {
        ElMessage.error('按时间排序失败: ' + error.message);
      }
    },

    // 查看数据库文件（2.4）
    async fetchDatabaseTables() {
      try {
        const response = await axios.get(`${API_BASE_URL}/rag-management/database`);
        const data = response.data;
        this.databaseStats.totalTables = data.table_count;
        // recent_tables 可用于表格展示
        // data.recent_tables
      } catch (error) {
        ElMessage.error('获取数据库表失败: ' + error.message);
      }
    },

    // 上传单个文本文件（2.6）
    async uploadSingleDocument(filePath, forceReprocess) {
      try {
        const response = await axios.post(`${API_BASE_URL}/rag-management/upload-document`, {
          file_path: filePath,
          force_reprocess: forceReprocess
        });
        const data = response.data;
        if (data.success) {
          ElMessage.success(data.message);
        } else {
          ElMessage.error(data.message || '上传文档失败');
        }
      } catch (error) {
        ElMessage.error('上传文档请求失败: ' + error.message);
      }
    },

    // 上传整个文件夹（2.7）
    async uploadFolderDocuments(directoryPath, recursive, forceReprocess) {
      try {
        const response = await axios.post(`${API_BASE_URL}/rag-management/upload-documents`, {
          directory_path: directoryPath,
          recursive: recursive,
          force_reprocess: forceReprocess
        });
        const data = response.data;
        if (data.success) {
          ElMessage.success(data.message);
        } else {
          ElMessage.error(data.message || '文件夹上传失败');
        }
      } catch (error) {
        ElMessage.error('文件夹上传请求失败: ' + error.message);
      }
    },

    // 上传单个数据库文件（2.8）
    async uploadDatabaseFile(excelFilePath, forceReprocess) {
      try {
        const response = await axios.post(`${API_BASE_URL}/rag-management/upload-database`, {
          excel_file_path: excelFilePath,
          force_reprocess: forceReprocess
        });
        const data = response.data;
        if (data.success) {
          ElMessage.success(data.message);
        } else {
          ElMessage.error(data.message || '数据库文件上传失败');
        }
      } catch (error) {
        ElMessage.error('数据库文件上传请求失败: ' + error.message);
      }
    },

    // 删除单个向量检索文件（2.9）
    async deleteDocumentByPath(filePath) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-file`, {
          data: { file_path: filePath }
        });
        const data = response.data;
        if (data.success) {
          ElMessage.success('文件删除成功');
        } else {
          ElMessage.error('文件删除失败: ' + (data.result?.details?.[0]?.message || ''));
        }
      } catch (error) {
        ElMessage.error('文件删除请求失败: ' + error.message);
      }
    },

    // 删除全部向量检索文件（2.10）
    async deleteAllVectorFiles() {
      try {
        const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-all-file`);
        const data = response.data;
        if (data.success) {
          ElMessage.success(data.message);
        } else {
          ElMessage.error('清空向量检索文件失败');
        }
      } catch (error) {
        ElMessage.error('清空向量检索文件请求失败: ' + error.message);
      }
    },

    // 删除单个数据库表（2.11）
    async deleteDatabaseTable(tableName) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-database`, {
          data: { table_name: tableName }
        });
        const data = response.data;
        if (data.success) {
          ElMessage.success(data.message);
        } else {
          ElMessage.error(data.message || '数据库表删除失败');
        }
      } catch (error) {
        ElMessage.error('数据库表删除请求失败: ' + error.message);
      }
    },

    // 删除全部数据库表（2.12）
    async deleteAllDatabaseTables() {
      try {
        const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-all-database`);
        const data = response.data;
        if (data.success) {
          ElMessage.success('全部数据库表已删除');
        } else {
          ElMessage.error('全部数据库表删除失败');
        }
      } catch (error) {
        ElMessage.error('全部数据库表删除请求失败: ' + error.message);
      }
    },
  },
  mounted() {
    // this.searchDocuments(''); // Initial load if fetching from backend
    setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }, 1000);
  }
};
</script>

<style scoped>
.table-container {
  background-color: #f8f9fa; /* Lighter grey, closer to image */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-right: 20px;
}

.el-table {
  border-radius: 6px;
  overflow: hidden; /* Ensures border-radius is applied to table corners */
}

.el-table th, .el-table td {
  padding: 10px 0; /* Adjusted padding */
}

.el-button {
  font-size: 14px; /* Slightly smaller base font for buttons */
  height: 36px; /* Adjusted height */
}

.top-right-icons {
  position: absolute;
  top: 20px;
  right: 40px;
  display: flex;
  align-items: center;
}
.top-right-icons span {
  margin-left: 10px;
}

.floating-particles, .rainbow-stripes { /* Keep original effects */
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;
}
.rainbow-stripes {
  background: linear-gradient(45deg, #f7d1d1, #f9e1b2, #f3f9b6, #d1f3e1, #b8d3f3, #d0bdf0, #f0b8f6);
  background-size: 400% 400%; animation: rainbowMove 10s linear infinite;
}
@keyframes rainbowMove { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }


.yellow-action-btn {
  background-color: #FFFBEB; /* Light yellow as in image */
  border: 1px solid #FEEFC7;
  color: #B8860B; /* Darker yellow/brown text */
  font-weight: 500;
}
.yellow-action-btn:hover, .yellow-action-btn:focus {
  background-color: #FEF7DC;
  border-color: #FCECC5;
  color: #A0740A;
}

.custom-delete-btn {
  background-color: #FEE2E2; /* Light pinkish-red */
  border: 1px solid #FECACA;
  color: #DC2626; /* Red text */
  padding: 6px 10px;
}
.custom-delete-btn:hover, .custom-delete-btn:focus {
  background-color: #FCD9D9;
  border-color: #FBBFBF;
  color: #B91C1C;
}

.info-header-grid {
  display: grid;
  grid-template-columns: auto 1fr 1fr 1fr 1fr; /* First column auto for label, rest equal */
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #555;
}
.info-header-grid .first-label {
  font-weight: bold;
  grid-column: 1 / -1; /* Span full width for these main labels */
  margin-top: 8px;
}
.info-header-grid .info-header-col-title {
    padding: 5px;
    text-align: center;
    color: #666;
    font-size: 14px;
}
/* Adjust specific column title for "数据库文件显示" based on the image positioning */
.info-header-grid > span:nth-child(1) { /* "数据库文件显示：" */
    grid-column: 1 / -1; /* Span all columns for this label */
    margin-bottom: -5px; /* Pulls the titles below it slightly up */
}
.info-header-grid > span:nth-child(2) { grid-column: 2 / 3; margin-left: -80px;} /* 数据库表名 */
.info-header-grid > span:nth-child(3) { grid-column: 3 / 4; margin-left: -50px;} /* excel文件名 */
.info-header-grid > span:nth-child(4) { grid-column: 4 / 5; margin-left: -20px;} /* 添加时间 */
.info-header-grid > span:nth-child(5) { grid-column: 5 / 6; margin-left: 0px;} /* 原excel表名 */

.info-header-grid > span:nth-child(6) { /* "向量搜索文件显示：" */
    grid-column: 1 / -1; /* Span all columns for this label */
    margin-top: 10px; /* Add some space above this label */
}


.right-action-buttons {
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  width: 180px; /* Fixed width for this column */
}
.yellow-side-btn {
  background-color: #FFFBEB;
  border: 1px solid #FEEFC7;
  color: #B8860B;
  width: 100%;
  margin-bottom: 10px;
  font-weight: 500;
}
.yellow-side-btn:last-child {
  margin-bottom: 0;
}
.yellow-side-btn:hover, .yellow-side-btn:focus {
  background-color: #FEF7DC;
  border-color: #FCECC5;
  color: #A0740A;
}

.footer-stats-container {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Align items to the top */
  font-size: 14px;
  color: #333;
}
.stats-column {
    display: flex;
    flex-direction: column;
}
.stats-column > div { /* Each line of stats */
    margin-bottom: 5px;
}
.stat-item {
  margin-right: 15px;
}
.stat-item.indented {
    margin-left: 125px; /* Indent to align under "向量储存文件显示：" */
}


.custom-clear-all-btn {
  background-color: #FEE2E2;
  border: 1px solid #FECACA;
  color: #DC2626;
}
.custom-clear-all-btn:hover, .custom-clear-all-btn:focus {
  background-color: #FCD9D9;
  border-color: #FBBFBF;
  color: #B91C1C;
}

.el-pagination {
  padding: 0; /* Remove default pagination padding if any */
}
.el-table .el-icon {
    vertical-align: middle;
}
</style>