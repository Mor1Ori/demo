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
    <div style="display:flex;justify-content: space-between;height: 50px;">

    <div style="display: flex;">
          <!-- 添加文件按钮 -->
    <el-upload
      action=""
      multiple
      :auto-upload="false"
      @change="addDocument">
      <el-button type="primary" style="margin-left: 10px;"><el-icon><UploadFilled /></el-icon>&nbsp;上传文档</el-button>
    </el-upload>

    <el-upload
      action=""
      multiple
      :auto-upload="false"
      @change="addDocument">
      <el-button type="primary" style="margin-left: 10px;"><el-icon><UploadFilled /></el-icon>&nbsp;上传数据库文件</el-button>
    </el-upload>
    </div>


    <div style="height: 50px; margin-right: 90px;">
     <!-- 搜索框 -->
     <el-input
      v-model="searchQuery"
      placeholder="输入文件名搜索"
      clearable
      style="padding-right: 20px; width: 250px;height: 40px;"
    />
    <el-button
      type="primary"
      @click="searchDocuments"
      style=" padding-left: 20px;"
    >
    <el-icon><Search /></el-icon>&nbsp;搜索
    </el-button>
  </div>
  </div>
    <!-- 文件列表表格 -->
    <el-card class="table-container" style="margin-top: 20px;">
      <!-- 清空所有文件按钮，放置在表格右上角 -->
      <el-button
        type="danger"
        style="position: absolute; bottom: 40px; right: 120px;"
        @click="clearAllDocuments"
      >
        <el-icon><DeleteFilled /></el-icon>&nbsp;清空所有文件
      </el-button>

      <el-table :data="paginatedDocuments" style="width: 100%;font-size: 17px;" size="large">
        <el-table-column prop="name" label="文件名" width="300" header-align="center" align="center" sortable></el-table-column>
        <el-table-column prop="type" label="文件类型" width="200" header-align="center" align="center" sortable></el-table-column>
        <el-table-column prop="date" label="添加时间" width="250" header-align="center" align="center" sortable></el-table-column>
        <el-table-column prop="note" label="文件备注" width="250" header-align="center" align="center" sortable></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button
              @click="deleteDocument(scope.$index)"
               class="delete-button"
              size="medium"
            >
            <el-icon><RemoveFilled /></el-icon>&nbsp;删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 文件总数显示 -->
      <div style="margin-top: 10px; text-align: left;">
        <span>总文件数：{{ documents.length }}</span>
      </div>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="documents.length"
          :page-size="5"
          v-model:current-page="currentPage"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElCard, ElUpload, ElButton, ElTable, ElTableColumn, ElPagination, ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled, DeleteFilled, Search,House,Refresh,RemoveFilled, HomeFilled} from '@element-plus/icons-vue';

export default {
  name: 'RAGManagement',
  components: {
    ElCard, ElUpload, ElButton, ElTable, ElTableColumn, ElPagination, UploadFilled, DeleteFilled,Search,HomeFilled,Refresh,RemoveFilled
  },
  data() {
    return {
      documents: [
      { name: '财报分析.pdf', type: 'pdf', date: '2025-03-19 10:30:45' ,note: 'A'},
        { name: '公司年报.docx', type: 'docx', date: '2025-03-18 14:22:31', note: 'A'},
        { name: '市场调研.csv', type: 'csv', date: '2025-03-17 09:10:12' , note: 'A'},
        { name: '投资方案.txt', type: 'txt', date: '2025-03-16 16:55:00' , note: 'A'},
        { name: '法律合规.pdf', type: 'pdf', date: '2025-03-15 08:30:00' , note: 'A'},
        { name: '客户反馈.xlsx', type: 'xlsx', date: '2025-03-14 12:00:00' , note: 'A'},
        { name: '行业趋势分析.pdf', type: 'pdf', date: '2025-03-13 10:00:00' , note: 'A'},
        { name: '年度预算报告.docx', type: 'docx', date: '2025-03-12 14:22:31' , note: 'A'},
        { name: '竞争对手分析.csv', type: 'csv', date: '2025-03-11 09:30:12' , note: 'A'},
        { name: '市场定位方案.txt', type: 'txt', date: '2025-03-10 16:55:00' , note: 'A'},
        { name: '财务报表.pdf', type: 'pdf', date: '2025-03-09 08:30:00' , note: 'A'},
        { name: '客户满意度调查.xlsx', type: 'xlsx', date: '2025-03-08 12:00:00' , note: 'A'},
        // 更多文档...
      ],
      currentPage: 1,
      searchQuery: '',
      currentTime: new Date().toLocaleTimeString()
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
      const start = (this.currentPage - 1) * 5;
      const end = start + 5;
      return this.documents.slice(start, end);
    }
  },
  methods: {
    refreshPage() {
      location.reload();
    },
    goHome() {
      this.$router.push('/');
    },
    addDocument(file) {
      const newDoc = {
        name: file.name,
        type: file.name.split('.').pop(),
        date: new Date().toLocaleString(),
        note: 'A'
      };
      this.documents.push(newDoc);
      ElMessage.success(`文件已添加：${file.name}`);
    },
    deleteDocument(index) {
      ElMessageBox.confirm(
        '你确定要删除这个文件吗？',
        '确认删除',
        {
          type: 'warning'
        }
      ).then(() => {
        this.documents.splice(index, 1);
        ElMessage.success('文件已删除');
      }).catch(() => {
        ElMessage.info('操作已取消');
      });
    },
    clearAllDocuments() {
      ElMessageBox.confirm(
        '你确定要清空所有文件吗？',
        '确认清空',
        {
          type: 'warning'
        }
      ).then(() => {
        this.documents = [];
        ElMessage.success('所有文件已清空');
      }).catch(() => {
        ElMessage.info('操作已取消');
      });
    }
  },
  mounted() {
    setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }
};
</script>

<style scoped>

.table-container {
  background-color: #f3f5f7;
  border-radius: 10px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  position: relative; /* 让按钮能定位到表格的右上角 */
  margin-right:20px ;
}

.el-table {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 10px;
}

.el-table__header th {
  background-color: #f5f7fa;
  color: #333;
}

.el-table__body tr:hover {
  background-color: #f2f6fc;
}

.el-button {
  font-size: 16px;
  height: 40px;
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
.delete-button {
  background-color: #F8D7DA;
  color: #721c24;
  border: none;
  transition: background-color 0.3s, color 0.3s;
}

.delete-button:hover {
  background-color: #f28b82; /* 鼠标悬停时更红 */
  color: white;
}
</style>
