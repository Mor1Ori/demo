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
    
    <el-card class="table-container">
      <!-- 大表格：数据库文件显示区 -->
      <div style="display: flex; align-items: center; margin-bottom:4px;">
        <span style="font-weight:bold;">数据库文件显示：</span>
      </div>
      <div style="display: flex; margin-top: 5px; margin-bottom: 10px;">
        <el-table :data="recentTables" border style="width: 100%; margin-bottom: 10px; font-size: 16px; flex-grow: 1;" size="default" :header-row-style="{height:'45px'}">
          <el-table-column prop="table_name" label="数据库表名" :min-width="getColWidth(0, 5)" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
          <el-table-column prop="source_file" label="excel文件名" :min-width="getColWidth(1, 5)" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
          <el-table-column prop="import_time" label="添加时间" :min-width="getColWidth(2, 5)" :header-cell-style="blueHeaderStyle" sortable align="center">
            <template #header>
              添加时间 <el-icon style="vertical-align: middle;"><Bottom /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="sheet_name" label="原excel表名" :min-width="getColWidth(3, 5)" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
          <el-table-column label="操作" :min-width="getColWidth(4, 5)" align="center">
            <template #default="scope">
              <el-button size="small" class="custom-delete-btn" @click="deleteDatabaseTable(scope.row.table_name)">
                <el-icon><RemoveFilled /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- 小表格：数据库统计 -->
      <div style="font-weight:bold;margin-bottom:4px;">数据库文件显示：</div>
      <div style="position: relative; display: flex; margin-top: 5px; margin-bottom: 40px;">
        <el-table :data="[databaseStats]" border style="width: 100%; margin-bottom: 10px;">
          <el-table-column prop="totalTables" label="总表数" width="120" align="center" />
        </el-table>
        <!-- 数据库按钮区，绝对定位在表格右下角 -->
        <div class="table-footer-btns db-btns">
          <el-button type="primary" @click="uploadDatabaseFile"><el-icon><Coin /></el-icon> 上传数据库文件</el-button>
          <el-button class="custom-clear-all-btn" @click="deleteAllDatabaseTables" style="margin-left: 10px;">
            <el-icon><DeleteFilled /></el-icon> 清空所有数据库文件
          </el-button>
        </div>
      </div>

      <!-- 向量搜索文件显示区 -->
      <div style="display: flex; align-items: center; margin-bottom:4px; margin-top: 60px;">
        <span style="font-weight:bold;">向量搜索文件显示：</span>
        <div style="display: flex; align-items: center; margin-left: 10px;">
          <el-input
            v-model="searchQuery"
            placeholder="输入文件名搜索"
            clearable
            style="width: 220px; height: 40px; margin-right: 8px; background: #fff; color: #222; border-radius: 4px; border: 1.5px solid #3B82F6; box-shadow: none;"
            input-style="background: #fff; color: #222; border-radius: 4px; border: none;"
          />
          <!-- <el-button
            type="primary"
            @click="searchDocuments"
            style="height: 40px;"
          >
            <el-icon><Search /></el-icon> 搜索
          </el-button> -->
        </div>
      </div>
      <div style="display: flex; margin-top: 5px; margin-bottom: 10px;">
        <template v-if="!showVectorFiles">
          <el-table :data="recentTables" border style="width: 100%; margin-bottom: 10px;">
            <el-table-column prop="table_name" label="数据库表名" :min-width="getColWidth(0, 5)" align="center" />
            <el-table-column prop="source_file" label="excel文件名" :min-width="getColWidth(1, 5)" align="center" />
            <el-table-column prop="import_time" label="添加时间" :min-width="getColWidth(2, 5)" align="center" />
            <el-table-column prop="sheet_name" label="原excel表名" :min-width="getColWidth(3, 5)" align="center" />
            <el-table-column label="操作" :min-width="getColWidth(4, 5)" align="center">
              <template #default="scope">
                <el-button size="small" class="custom-delete-btn" @click="deleteDatabaseTable(scope.row.table_name)">
                  <el-icon><RemoveFilled /></el-icon> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else>
          <el-table :data="paginatedDocuments" style="width: 100%; font-size: 16px; flex-grow: 1;" size="default" :header-row-style="{height:'45px'}">
            <el-table-column prop="name" label="文件名 (路径)" :min-width="getColWidth(0, 5)" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
            <el-table-column prop="doc_type_display" label="文档块数" :min-width="getColWidth(1, 5)" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
            <el-table-column prop="date" label="添加时间" :min-width="getColWidth(2, 5)" :header-cell-style="blueHeaderStyle" sortable align="center">
              <template #header>
                添加时间 <el-icon style="vertical-align: middle;"><Bottom /></el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="size_display" label="文件大小" :min-width="getColWidth(3, 5)" :header-cell-style="blueHeaderStyle" align="center"></el-table-column>
            <el-table-column label="操作" :min-width="getColWidth(4, 5)" align="center">
              <template #default="scope">
                <el-button size="small" class="custom-delete-btn" @click="deleteDocument(scope.row.id, scope.row.name)">
                  <el-icon><RemoveFilled /></el-icon> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>

       <!-- 向量储存文件显示区 -->
      <div style="font-weight:bold;margin-bottom:4px;">向量储存文件显示：</div>
      <div style="position: relative; display: flex; margin-top: 5px; margin-bottom: 40px;">
        <el-table :data="[vectorStats]" border style="width: 100%; margin-bottom: 10px;">
          <el-table-column prop="totalChunks" label="总分块数" width="100" align="center" />
          <el-table-column prop="totalFiles" label="总文件数" width="100" align="center" />
          <el-table-column prop="pdfCount" label="pdf文件" width="100" align="center" />
          <el-table-column prop="txtCount" label="txt文件" width="100" align="center" />
          <el-table-column prop="docxCount" label="docx文件" width="100" align="center" />
          <el-table-column prop="csvCount" label="csv文件" width="100" align="center" />
        </el-table>
        <!-- 向量按钮区，绝对定位在表格右下角 -->
        <div class="table-footer-btns vector-btns">
          <el-button type="primary" @click="uploadSingleDocument">上传向量化检索文档</el-button>
          <el-button class="yellow-action-btn" style="margin-left: 10px;" @click="uploadFolderDocuments">上传整个文件夹</el-button>
          <el-button class="yellow-side-btn" @click="sortByFileSize" style="margin-left: 10px;">按文件大小排序</el-button>
          <el-button class="yellow-side-btn" @click="sortByTime" style="margin-left: 10px;">按上传时间排序</el-button>
          <el-button class="custom-clear-all-btn" @click="deleteAllVectorFiles" style="margin-left: 10px;">
            <el-icon><DeleteFilled /></el-icon> 清空所有向量文件
          </el-button>
        </div>
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
      recentTables: [
        
       ], // 新增：数据库 recent_tables
      databaseStats: {
      
      },
      documents: [

      ],
      vectorStats: {
       
      },
      currentPage: 1,
      itemsPerPage: 4,
      searchQuery: '',
      isLoadingTable: false,
      currentTime: new Date().toLocaleTimeString(),
      blueHeaderStyle: { background: '#3B82F6', color: 'white', fontWeight: 'normal', fontSize: '15px' },
      showVectorFiles: true, // 默认显示向量文件
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
  mounted() {
    // 页面加载时自动获取向量文件列表
    this.loadRagData();
    setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }, 1000);
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
          // 实际API调用
          const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-file`, {
            data: { file_id: fileId, file_name: fileName }
          });
          const data = response.data;
          if (data.success) {
            ElMessage.success(`文件 "${fileName}" 删除成功`);
            // 删除后自动刷新RAG数据
            await this.fetchRagManagementData && this.fetchRagManagementData();
          } else {
            ElMessage.error(data.message || '文件删除失败');
          }
        } catch (error) {
          ElMessage.error('文件删除请求失败: ' + error.message);
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
          // 实际API调用
          const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-all-file`);
          const data = response.data;
          if (data.success) {
            ElMessage.success('所有文件已清空');
            await this.fetchRagManagementData && this.fetchRagManagementData();
          } else {
            ElMessage.error(data.message || '清空文件失败');
          }
        } catch (error) {
          ElMessage.error('清空文件请求失败: ' + error.message);
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      } catch (e) {
        if (e !== 'cancel' && e !== undefined) ElMessage.info('操作已取消');
      }
    },
    // 默认加载向量文件（2.1/2.3）
    async loadRagData() {
      this.showVectorFiles = true; // 只在这里切换
      await this.fetchDatabaseTables();
      await this.fetchRagManagementData();
    },
    // 获取RAG文档列表及统计（2.1）
    async fetchRagManagementData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/rag-management`);
        const data = response.data;
        // 适配新接口结构
        const ragStatus = data.rag_status || {};
        this.vectorStats.totalChunks = ragStatus.document_count;
        this.vectorStats.totalFiles = ragStatus.file_count;
        // 兼容 file_type_counts 字段带点和不带点的情况
        const typeCounts = ragStatus.file_type_counts || {};
        this.vectorStats.pdfCount = typeCounts[".pdf"] ?? typeCounts["pdf"] ?? 0;
        this.vectorStats.txtCount = typeCounts[".txt"] ?? typeCounts["txt"] ?? 0;
        this.vectorStats.docxCount = typeCounts[".docx"] ?? typeCounts["docx"] ?? 0;
        this.vectorStats.csvCount = typeCounts[".csv"] ?? typeCounts["csv"] ?? 0;
        // recent_files 默认显示
        this.documents = (ragStatus.recent_files || []).map(f => ({
          id: f.path || f.name || f.file_name || '',
          name: f.path || f.name || f.file_name || '',
          doc_type_display: f.chunk_count || f.type || '', // 文档块数
          date: f.last_processed?.replace('T', ' ') || f.date || '',
          size_display: f.size_bytes ? (f.size_bytes / 1024 / 1024).toFixed(2) + ' MB' : (f.size || ''),
          chunk_count: f.chunk_count
        }));
        // 修复：每次拉取数据后重置搜索和分页，确保表格能正确显示
        this.searchQuery = '';
        this.currentPage = 1;
      } catch (error) {
        ElMessage.error('获取RAG文档列表失败: ' + error.message);
      }
    },
    // 获取数据库表信息（改为从 /rag-management 获取 json 数据）
    async fetchDatabaseTables() {
      // 不再切换 showVectorFiles，只负责 recentTables 赋值
      try {
        const response = await axios.get(`${API_BASE_URL}/rag-management`);
        const data = response.data;
        // 兼容后端返回结构，优先 database_status
        const dbStatus = data.database_status || data;
        // recentTables 兼容多种字段
        const tables = dbStatus.tables || dbStatus.recent_tables || [];
        const table_count = dbStatus.table_count || dbStatus.totalTables || tables.length || 0;
        this.databaseStats.totalTables = table_count;
        this.recentTables = tables.map(t => ({
          table_name: t.table_name || t.name || t.tableName || '',
          source_file: t.source_file || t.excel_file_name || t.file_name || '',
          import_time: t.import_time || t.added_time || t.create_time || '',
          sheet_name: t.sheet_name || t.original_excel_name || ''
        }));
      } catch (error) {
        ElMessage.error('获取数据库表失败: ' + error.message);
      }
    },
    // 按文件大小排序（2.2）
    async sortByFileSize() {
      try {
        // 刷新页面并按 largest_files 顺序展示
        const response = await axios.get(`${API_BASE_URL}/rag-management`);
        const data = response.data;
        // 兼容后端返回结构：largest_files 可能在 data.largest_files 或 data.rag_status.largest_files
        const files = (data.largest_files || data.rag_status?.largest_files || []);
        this.documents = files.map(f => ({
          id: f.path || f.name || f.file_name || '',
          name: f.path || f.name || f.file_name || '',
          doc_type_display: f.chunk_count || f.type || '',
          date: f.last_processed?.replace('T', ' ') || f.date || '',
          size_display: f.size_bytes ? (f.size_bytes / 1024 / 1024).toFixed(2) + ' MB' : (f.size || ''),
          chunk_count: f.chunk_count
        }));
        this.showVectorFiles = true;
        this.searchQuery = '';
        this.currentPage = 1;
        // 同步刷新统计信息，兼容带点和不带点
        const ragStatus = data.rag_status || {};
        this.vectorStats.totalChunks = ragStatus.document_count;
        this.vectorStats.totalFiles = ragStatus.file_count;
        const typeCounts = ragStatus.file_type_counts || {};
        this.vectorStats.pdfCount = typeCounts[".pdf"] ?? typeCounts["pdf"] ?? 0;
        this.vectorStats.txtCount = typeCounts[".txt"] ?? typeCounts["txt"] ?? 0;
        this.vectorStats.docxCount = typeCounts[".docx"] ?? typeCounts["docx"] ?? 0;
        this.vectorStats.csvCount = typeCounts[".csv"] ?? typeCounts["csv"] ?? 0;
        // 强制刷新表格
        this.$forceUpdate && this.$forceUpdate();
      } catch (error) {
        ElMessage.error('按文件大小排序失败: ' + error.message);
      }
    },

    // 按时间排序（2.2）
    async sortByTime() {
      try {
        // 刷新页面并按 recent_files 顺序展示
        const response = await axios.get(`${API_BASE_URL}/rag-management`);
        const data = response.data;
        // 兼容后端返回结构：recent_files 可能在 data.recent_files 或 data.rag_status.recent_files
        const files = (data.recent_files || data.rag_status?.recent_files || []);
        this.documents = files.map(f => ({
          id: f.path || f.name || f.file_name || '',
          name: f.path || f.name || f.file_name || '',
          doc_type_display: f.chunk_count || f.type || '',
          date: f.last_processed?.replace('T', ' ') || f.date || '',
          size_display: f.size_bytes ? (f.size_bytes / 1024 / 1024).toFixed(2) + ' MB' : (f.size || ''),
          chunk_count: f.chunk_count
        }));
        this.showVectorFiles = true;
        this.searchQuery = '';
        this.currentPage = 1;
        // 同步刷新统计信息，兼容带点和不带点
        const ragStatus = data.rag_status || {};
        this.vectorStats.totalChunks = ragStatus.document_count;
        this.vectorStats.totalFiles = ragStatus.file_count;
        const typeCounts = ragStatus.file_type_counts || {};
        this.vectorStats.pdfCount = typeCounts[".pdf"] ?? typeCounts["pdf"] ?? 0;
        this.vectorStats.txtCount = typeCounts[".txt"] ?? typeCounts["txt"] ?? 0;
        this.vectorStats.docxCount = typeCounts[".docx"] ?? typeCounts["docx"] ?? 0;
        this.vectorStats.csvCount = typeCounts[".csv"] ?? typeCounts["csv"] ?? 0;
        // 强制刷新表格
        this.$forceUpdate && this.$forceUpdate();
      } catch (error) {
        ElMessage.error('按时间排序失败: ' + error.message);
      }
    },

    // // 查看数据库文件（2.4）
    // async fetchDatabaseTables() {
    //   try {
    //     const response = await axios.get(`${API_BASE_URL}/rag-management`);
    //     const data = response.data;
    //     this.databaseStats.totalTables = data.table_count;
    //     // recent_tables 可用于表格展示
    //     // data.recent_tables
    //   } catch (error) {
    //     ElMessage.error('获取数据库表失败: ' + error.message);
    //   }
    // },

    // 上传单个文本文件（2.6）
    async uploadSingleDocument() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.docx,.txt,.csv';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        // 只取文件名+后缀
        const fileName = file.name;
        // 不再弹窗，force_reprocess 默认 false
        const forceReprocess = false;
        this.isLoadingTable = true;
        const loadingInstance = this.$loading ? this.$loading({ text: '正在上传文件...' }) : ElLoading.service({ text: '正在上传文件...' });
        try {
          const payload = {
            file_path: fileName,
            force_reprocess: forceReprocess
          };
          const response = await axios.post(`${API_BASE_URL}/rag-management/upload-document`, payload);
          const data = response.data;
          if (data.success) {
            ElMessage.success(data.message || '文件上传成功');
            this.fetchRagManagementData && this.fetchRagManagementData();
          } else {
            ElMessage.error(data.message || '上传文档失败');
          }
        } catch (error) {
          ElMessage.error('文件上传请求失败: ' + error.message);
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      };
      input.click();
    },
    async uploadFolderDocuments() {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.onchange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        // 获取文件夹名（取第一个文件的webkitRelativePath的第一个目录）
        let folderName = '';
        if (files[0] && files[0].webkitRelativePath) {
          const parts = files[0].webkitRelativePath.split('/');
          if (parts.length > 1) folderName = parts[0];
        }
        if (!folderName) {
          ElMessage.error('请选择有效的文件夹');
          return;
        }
        // 弹窗询问 recursive
        let recursive = false;
        try {
          await this.$confirm(
            `是否递归处理子文件夹？<br><span style='color:#888'>(选择“确定”递归处理，选择“取消”只处理当前文件夹)</span>`,
            '文件夹上传选项',
            {
              confirmButtonText: '递归处理',
              cancelButtonText: '只处理当前文件夹',
              dangerouslyUseHTMLString: true,
              type: 'info',
            }
          );
          recursive = true;
        } catch (e) {
          recursive = false;
        }
        // 弹窗询问 force_reprocess
        let forceReprocess = false;
        try {
          await this.$confirm(
            `是否强制重新处理同名文件？<br><span style='color:#888'>(选择“确定”将强制处理，选择“取消”则只处理新文件)</span>`,
            '文件夹上传选项',
            {
              confirmButtonText: '强制处理',
              cancelButtonText: '只处理新文件',
              dangerouslyUseHTMLString: true,
              type: 'warning',
            }
          );
          forceReprocess = true;
        } catch (e) {
          forceReprocess = false;
        }
        this.isLoadingTable = true;
        const loadingInstance = this.$loading ? this.$loading({ text: '正在上传文件夹...' }) : ElLoading.service({ text: '正在上传文件夹...' });
        try {
          const payload = {
            directory_path: folderName,
            recursive: recursive,
            force_reprocess: forceReprocess
          };
          const response = await axios.post(`${API_BASE_URL}/rag-management/upload-documents`, payload);
          const data = response.data;
          if (data.success) {
            let msg = `${data.message || '文件夹上传成功'}<br>`;
            msg += `总文件数: ${data.total_files_found ?? '-'}<br>`;
            msg += `成功: ${data.processed_successfully ?? '-'}，失败: ${data.failed ?? '-'}，跳过: ${data.skipped ?? '-'}<br>`;
            if (data.files_by_type) {
              msg += '各类型文件数：';
              for (const [type, count] of Object.entries(data.files_by_type)) {
                msg += `${type}: ${count} `;
              }
              msg += '<br>';
            }
            if (data.failures && data.failures.length > 0) {
              msg += '<span style="color:#c00">失败文件：</span><br>';
              data.failures.forEach(f => {
                msg += `${f.file}: ${f.error}<br>`;
              });
            }
            ElMessageBox.alert(msg, '上传结果', { dangerouslyUseHTMLString: true });
            this.fetchRagManagementData && this.fetchRagManagementData();
          } else {
            ElMessage.error(data.message || '文件夹上传失败');
          }
        } catch (error) {
          ElMessage.error('文件夹上传请求失败: ' + error.message);
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      };
      input.click();
    },
    async uploadDatabaseFile() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xls,.xlsx,.csv';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        // 获取文件夹名（单文件时取webkitRelativePath的第一个目录，否则为空）
        let folderName = '';
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) folderName = parts[0];
        }
        this.isLoadingTable = true;
        const loadingInstance = this.$loading ? this.$loading({ text: '正在上传数据库文件...' }) : ElLoading.service({ text: '正在上传数据库文件...' });
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('relative_path', file.name);
          if (folderName) formData.append('folder_name', folderName);
          const response = await axios.post(`${API_BASE_URL}/rag-management/upload-database`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const data = response.data;
          if (data.success) {
            ElMessage.success('数据库文件上传成功');
            this.fetchDatabaseTables && this.fetchDatabaseTables();
          } else {
            ElMessage.error(data.message || '数据库文件上传失败');
          }
        } catch (error) {
          ElMessage.error('数据库文件上传请求失败: ' + error.message);
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      };
      input.click();
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
        await this.$confirm('你确定要清空所有向量检索文件吗？这将无法恢复！', '确认清空', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        this.isLoadingTable = true;
        const loadingInstance = this.$loading ? this.$loading({ text: '正在清空向量文件...' }) : ElLoading.service({ text: '正在清空向量文件...' });
        try {
          const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-all-file`);
          const data = response.data;
          if (data.success) {
            ElMessage.success(data.message || '所有向量文件已清空');
            await this.fetchRagManagementData && this.fetchRagManagementData();
          } else {
            ElMessage.error(data.message || '清空向量文件失败');
          }
        } catch (error) {
          ElMessage.error('清空向量文件请求失败: ' + error.message);
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      } catch (e) {
        if (e !== 'cancel' && e !== undefined) ElMessage.info('操作已取消');
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
          // 删除后自动刷新数据库表格和RAG文档表格
          await this.fetchDatabaseTables && this.fetchDatabaseTables();
          await this.fetchRagManagementData && this.fetchRagManagementData();
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
        await this.$confirm('你确定要清空所有数据库表吗？这将无法恢复！', '确认清空', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        this.isLoadingTable = true;
        const loadingInstance = this.$loading ? this.$loading({ text: '正在清空数据库表...' }) : ElLoading.service({ text: '正在清空数据库表...' });
        try {
          const response = await axios.delete(`${API_BASE_URL}/rag-management/delete-all-database`);
          const data = response.data;
          if (data.success) {
            ElMessage.success('全部数据库表已删除');
            await this.fetchDatabaseTables && this.fetchDatabaseTables();
            await this.fetchRagManagementData && this.fetchRagManagementData();
          } else {
            ElMessage.error(data.message || '全部数据库表删除失败');
          }
        } catch (error) {
          ElMessage.error('全部数据库表删除请求失败: ' + error.message);
        } finally {
          this.isLoadingTable = false;
          loadingInstance.close();
        }
      } catch (e) {
        if (e !== 'cancel' && e !== undefined) ElMessage.info('操作已取消');
      }
    },
    getColWidth(index, total) {
      // 动态分配列宽，保证表格占满整行
      // index: 当前列索引，total: 总列数
      // 例如5列，每列平均分配20%，最后一列略宽
      if (index === total - 1) return `${Math.round(100 / total) + 5}%`;
      return `${Math.floor(100 / total)}%`;
    },
  },
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

.footer-stats-container {
  margin-top: 20px;
  padding-top: 15px;
  /* border-top: 1px solid #e9ecef; */ /* 移除横线 */
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.table-footer-btns {
  position: absolute;
  right: 0;
  bottom: -50px;
  display: flex;
  gap: 10px;
  z-index: 2;
}
</style>