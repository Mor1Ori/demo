<template>
  <div class="chat-page-wrapper">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>

    <!-- Top Bar: Title, Model Info, Icons -->
    <div class="top-bar">
      <h1 class="page-title">🤖 智能问答</h1>
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
        <div class="model-api-info model-api-info-blue" style="min-height:38px;display:flex;align-items:center;justify-content:center;">
          <template v-if="isModelApiLoading">
            <span class="model-api-loading-spinner"></span>
            <span style="margin-left:10px;">正在连接模型/API，请稍候...</span>
          </template>
          <template v-else>
            当前已加载的模型/api: {{ currentModelApiInfo || '未加载' }}
          </template>
        </div>
      </div>
      <div class="top-right-actions">
        <el-button @click="refreshPage" type="text" class="icon-action-button">
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-button @click="goHome" type="text" class="icon-action-button">
          <el-icon><HomeFilled /></el-icon>
        </el-button>
        <span class="current-time-display">{{ currentTime }}</span>
      </div>
    </div>

    <div class="chat-main-layout">
      <!-- 左侧对话记录栏 -->
      <div class="conversation-sidebar">
        <div class="sidebar-header">
          <h3>🗨️ 对话记录</h3>
          <el-button @click="createNewConversation" type="primary" size="small" class="new-conversation-btn">
            <el-icon><Plus /></el-icon> 新建对话
          </el-button>
        </div>
        <div class="conversation-list-container">
          <ul v-if="conversations.length > 0">
            <li
              v-for="(conv, index) in conversations"
              :key="conv.id || index"
              :class="{'active-conversation': index === activeConversationIndex}"
              @click="fetchMessagesForConversation(index)"
            >
              <span class="conv-name">{{ conv.name }}</span>
              <div class="conv-actions">
                <el-button size="small" type="text" @click.stop="renameConversation(index)" class="action-btn rename-btn">修改名称</el-button>
                <el-button size="small" type="text" @click.stop="deleteConversation(index)" class="action-btn delete-btn">🗑️</el-button>
              </div>
            </li>
          </ul>
          <div v-else class="empty-conversations">
            <br/> 点击“新建对话”开始。
          </div>
        </div>
      </div>

      <!-- 中间聊天框 -->
      <div class="chat-area">
        <div class="chat-window-wrapper">
          <div class="chat-window" ref="chatWindow">
            <div v-if="!activeConversationMessages || activeConversationMessages.length === 0" class="empty-chat-placeholder">
            </div>
            <div v-for="message in activeConversationMessages" :key="message.id" :class="message.sender === 'user' ? 'user-message' : 'ai-message'">
              <div class="message-bubble">
                <span v-if="message.sender === 'ai'" class="sender-avatar">AI</span>
                <span v-if="message.sender === 'user'" class="sender-avatar">You</span>
                <div class="message-text">{{ message.text }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <el-input
            v-model="userInput"
            @keyup.enter="sendMessage"
            placeholder="输入消息..."
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            resize="none"
            class="chat-input-field"
          />
          <el-button @click="sendMessage" type="primary" class="send-button" :disabled="!userInput.trim()">
            <el-icon><Promotion /></el-icon> 发送
          </el-button>
        </div>
        <div class="bottom-controls">
          <el-form inline size="small">
            <el-form-item label="启用历史对话:">
              <el-switch v-model="enableHistory" />
            </el-form-item>
            <el-form-item label="显示模型思考:">
              <el-switch v-model="showModelThinking" />
            </el-form-item>
            <el-form-item label="显示RAG参考:">
              <el-switch v-model="showRagReference" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <div class="config-panel">
        <el-card shadow="never" class="config-card">
          <template #header><div>模型与API配置</div></template>
          <div class="config-item">
            <label>选择模型</label>
            <el-select v-model="selectedRemoteModel" placeholder="下拉选择模型" style="width:100%;">
              <el-option label="DeepSeek R1" value="deepseek-r1:8b"></el-option>
              <el-option label="llama3.2" value="llama3.2:latest"></el-option>
            </el-select>
            <el-button type="success" size="small" @click="loadRemoteModel" class="config-button">加载模型</el-button>
          </div>
          <div class="config-item">
            <label>输入API</label>
            <el-input v-model="apiEndpoint" placeholder="输入API端点"></el-input>
            <el-button type="success" size="small" @click="loadApi" class="config-button">加载API</el-button>
          </div>
          <div class="config-item">
            <label>选择本地safetensors格式模型</label>
            <el-button type="primary" @click="selectLocalModelPath" style="width:100%;" class="config-button">
              选择模型文件夹路径
            </el-button>
            <div v-if="localModelPath" class="path-display">路径: {{ localModelPath }}</div>
          </div>
        </el-card>
        <el-card shadow="never" class="config-card">
           <template #header><div>对话操作</div></template>
          <el-button type="warning" @click="exportConversationHistory" style="width:100%;" class="config-button">
            导出对话历史为JSON
          </el-button>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { Refresh, HomeFilled, Promotion, Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000';

export default {
  name: 'ChatPage',
  components: {
    Refresh, HomeFilled, Promotion, Plus, Edit, Delete
  },
  data() {
    return {
      userInput: '',
      conversations: [], // [{ id: string, name: string, messages: [{ id, sender, text, timestamp, think?, sources? }] }]
      activeConversationIndex: -1,
      currentTime: new Date().toLocaleTimeString(),
      currentModelApiInfo: '',
      selectedRemoteModel: '',
      model_name: '',
      apiEndpoint: '',
      localModelPath: '',
      enableHistory: true,
      showModelThinking: false,
      showRagReference: false,
      isModelApiLoading: false,
    };
  },
  computed: {
    activeConversationMessages() {
      if (this.activeConversationIndex >= 0 && this.conversations[this.activeConversationIndex]) {
        return this.conversations[this.activeConversationIndex].messages;
      }
      return [];
    }
  },
  methods: {
    // Utility to generate UUID for temporary chatId
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    // Fetch conversation list (3.1: GET /chat)
    async fetchConversations() {
      currentModelApiInfo="";
      try {
        const response = await axios.get(`${API_BASE_URL}/chat`);
        const { success, chats } = response.data;

        if (!success) {
          throw new Error('获取对话列表失败');
        }

        this.conversations = chats.map(chat => ({
          id: chat.chatId,
          name: chat.title,
          messages: []
        }));

        if (this.conversations.length > 0) {
          this.activeConversationIndex = 0;
          // 批量获取所有历史消息
          await Promise.all(this.conversations.map((_, idx) => this.fetchMessagesForConversation(idx)));
        } else {
          this.activeConversationIndex = -1;
        }

        this.saveConversationsToStorage();
      } catch (error) {
        ElMessage.error(`获取对话列表失败: ${error.message}`);
        const storedConversations = localStorage.getItem('chat_conversations_v2');
        if (storedConversations) {
          this.conversations = JSON.parse(storedConversations);
          if (this.conversations.length > 0) {
            this.activeConversationIndex = 0;
            // 批量获取所有历史消息（本地恢复时也一致）
            await Promise.all(this.conversations.map((_, idx) => this.fetchMessagesForConversation(idx)));
          }
        } else {
          this.conversations = [];
          this.activeConversationIndex = -1;
        }
      }
    },

    // Fetch conversation history (3.4: GET /chat/history)
    async fetchMessagesForConversation(convIndex) {
      if (convIndex < 0 || !this.conversations[convIndex]) return;
      // 切换高亮
      this.activeConversationIndex = convIndex;
      try {
        const conv = this.conversations[convIndex];
        const response = await axios.get(`${API_BASE_URL}/chat/history`, {
          params: {
            chatId: conv.id,
            title: conv.name
          }
        });
        const { success, history } = response.data;

        if (!success) {
          throw new Error('获取对话历史失败');
        }

        this.conversations[convIndex].messages = history.flatMap(item => [
          {
            id: item.id,
            sender: 'user',
            text: item.question,
            timestamp: item.timestamp
          },
          {
            id: `${item.id}_ai`,
            sender: 'ai',
            text: item.answer,
            timestamp: item.timestamp
          }
        ]);

        this.saveConversationsToStorage();
        ElMessage.success(`已加载对话 "${conv.name}" 的历史消息`);
        this.scrollToBottom();
      } catch (error) {
        ElMessage.error(`加载对话历史失败: ${error.message}`);
        this.conversations[convIndex].messages = [];
      }
    },

    // Create new conversation (3.2: POST /chat/create)
    async createNewConversation() {
      try {
        const { value } = await ElMessageBox.prompt('请输入对话名称:', '新建对话', {
          confirmButtonText: '创建',
          cancelButtonText: '取消',
          inputValue: `新对话 ${this.conversations.length + 1}`,
          inputValidator: (val) => val && val.trim() !== '' ? true : '对话名称不能为空',
        });

        const newConvTitle = value.trim();
        const tempChatId = this.generateUUID();

        const response = await axios.post(`${API_BASE_URL}/chat/create`, {
          chatId: tempChatId,
          title: newConvTitle
        });

        const { success, chatId, message } = response.data;
        if (!success) {
          throw new Error(message || '创建对话失败');
        }

        const newConv = {
          id: chatId,
          name: newConvTitle,
          messages: []
        };

        this.conversations.push(newConv);
        this.activeConversationIndex = this.conversations.length - 1;
        this.saveConversationsToStorage();
        ElMessage.success(`已创建对话 "${newConvTitle}"`);
        this.userInput = '';
        this.scrollToBottom();
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(`创建对话失败: ${error.message}`);
        }
      }
    },

    // Rename conversation (3.5: PATCH /chat/update)
    async renameConversation(index) {
      const conversation = this.conversations[index];
      try {
        const { value } = await ElMessageBox.prompt('请输入新的对话名称:', '修改名称', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: conversation.name,
          inputValidator: (val) => val && val.trim() !== '' ? true : '名称不能为空',
        });

        const newName = value.trim();
        if (newName !== conversation.name) {
          const response = await axios.patch(`${API_BASE_URL}/chat/update`, {
            chatId: conversation.id,
            title: newName
          });

          const { success, message } = response.data;
          if (!success) {
            throw new Error(message || '修改对话名称失败');
          }

          this.conversations[index].name = newName;
          this.saveConversationsToStorage();
          ElMessage.success('对话名称已修改!');
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(`修改对话名称失败: ${error.message}`);
        }
      }
    },

    // Delete conversation (3.3: DELETE /chat/delete)
    async deleteConversation(index) {
      const conversation = this.conversations[index];
      try {
        await ElMessageBox.confirm(`确定要删除对话 "${conversation.name}" 吗?`, '确认删除', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
        });

        const response = await axios.delete(`${API_BASE_URL}/chat/delete`, {
          data: {
            chatId: conversation.id,
            title: conversation.name
          }
        });

        const { success, message } = response.data;
        if (!success) {
          throw new Error(message || '删除对话失败');
        }

        this.conversations.splice(index, 1);
        if (this.activeConversationIndex === index) {
          this.activeConversationIndex = this.conversations.length > 0 ? 0 : -1;
          if (this.activeConversationIndex !== -1) {
            await this.fetchMessagesForConversation(this.activeConversationIndex);
          }
        } else if (this.activeConversationIndex > index) {
          this.activeConversationIndex--;
        }

        this.saveConversationsToStorage();
        ElMessage.success('对话已删除!');
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(`删除对话失败: ${error.message}`);
        }
      }
    },

    // Send message (3.7: POST /chat/send)
    async sendMessage() {
      if (!this.userInput.trim() || this.activeConversationIndex < 0) {
        ElMessage.warning('请先选择一个对话或输入消息');
        return;
      }

      const userMessageText = this.userInput.trim();
      const currentConv = this.conversations[this.activeConversationIndex];

      const userMessage = {
        id: `msg_${Date.now()}_user`,
        sender: 'user',
        text: userMessageText,
        timestamp: new Date().toISOString()
      };
      currentConv.messages.push(userMessage);
      this.userInput = '';
      this.scrollToBottom();

      try {
        const response = await axios.post(`${API_BASE_URL}/chat/send`, {
          chatId: currentConv.id,
          title: currentConv.name,
          use_conversation_history: this.enableHistory,
          question: userMessageText,
          is_think: this.showModelThinking,
          show_sources: this.showRagReference
        });

        const { success, response: aiResponseText, think, sources } = response.data;
        if (!success) {
          throw new Error('消息发送失败');
        }

        // 处理换行，将\n或\r\n替换为<br>
        function formatWithBr(str) {
          if (!str) return '';
          return String(str).replace(/\r?\n/g, '<br>');
        }

        const aiMessage = {
          id: `msg_${Date.now()}_ai`,
          sender: 'ai',
          // 用v-html渲染时，内容中换行转为<br>
          text:
            (this.showModelThinking && think ? `【模型思考】${formatWithBr(think)}<br>` : '') +
            `【回答内容】${formatWithBr(aiResponseText)}` +
            (this.showRagReference && sources ? `<br>【RAG参考】${formatWithBr(Array.isArray(sources) ? sources.join(', ') : sources)}` : ''),
          timestamp: new Date().toISOString(),
          think: this.showModelThinking ? think : null,
          sources: this.showRagReference ? sources : null
        };
        currentConv.messages.push(aiMessage);

        this.saveConversationsToStorage();
        this.scrollToBottom();
      } catch (error) {
        ElMessage.error(`消息发送失败: ${error.message}`);
        // Remove the user message if the API call fails
        currentConv.messages.pop();
        this.scrollToBottom();
      }
    },

    // Load remote model (3.6: POST /chat/load_model with model_type: ollama)
    async loadRemoteModel() {
      if (!this.selectedRemoteModel) {
        ElMessage.warning('请先选择一个模型');
        return;
      }
      this.isModelApiLoading = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/chat/load_model`, {
          model_type: 'ollama',
          model_name: this.selectedRemoteModel, 
          model_path: '',
          api: ''
        });
        const { success, message } = response.data;
        if (!success) {
          throw new Error(message || '模型加载失败');
        }
        this.currentModelApiInfo = `模型: ${this.selectedRemoteModel} (已加载)`;
        localStorage.setItem('currentModelApiInfo', this.currentModelApiInfo);
        ElMessage.success('模型加载成功!');
      } catch (error) {
        ElMessage.error(`模型加载失败: ${error.message}`);
      } finally {
        this.isModelApiLoading = false;
      }
    },

    // Load API (3.6: POST /chat/load_model with model_type: api)
    async loadApi() {
      if (!this.apiEndpoint.trim()) {
        ElMessage.warning('请输入API端点');
        return;
      }
      this.isModelApiLoading = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/chat/load_model`, {
          model_type: 'api',
          model_name: '',
          model_path: '',
          api: this.apiEndpoint
        });
        const { success, message } = response.data;
        if (!success) {
          throw new Error(message || 'API加载失败');
        }
        this.currentModelApiInfo = `API: ${this.apiEndpoint} (已加载)`;
        localStorage.setItem('currentModelApiInfo', this.currentModelApiInfo);
        ElMessage.success('API加载成功!');
      } catch (error) {
        ElMessage.error(`API加载失败: ${error.message}`);
      } finally {
        this.isModelApiLoading = false;
      }
    },

    // Load local safetensors model (3.6: POST /chat/load_model with model_type: safetensors)
    async selectLocalModelPath() {
      // 打开文件夹选择框
      try {
        // 仅支持 Electron/桌面端或通过 input[type=file] 变通实现
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
        input.onchange = async (event) => {
          const files = event.target.files;
          if (!files || files.length === 0) {
            ElMessage.warning('未选择任何文件夹');
            document.body.removeChild(input);
            return;
          }
          // 获取文件夹路径（取第一个文件的路径的上级目录）
          const firstFile = files[0];
          let folderPath = '';
          if (firstFile.webkitRelativePath) {
            folderPath = firstFile.webkitRelativePath.split('/')[0];
          } else {
            folderPath = firstFile.name;
          }
          this.localModelPath = folderPath;
          document.body.removeChild(input);

          // 选择后自动加载模型
          this.isModelApiLoading = true;
          try {
            const response = await axios.post(`${API_BASE_URL}/chat/load_model`, {
              model_type: 'safetensors',
              model_name: '',
              model_path: this.localModelPath,
              api: ''
            });
            const { success, message } = response.data;
            if (!success) {
              throw new Error(message || '本地模型加载失败');
            }
            this.currentModelApiInfo = `本地模型: ${this.localModelPath} (已加载)`;
            localStorage.setItem('currentModelApiInfo', this.currentModelApiInfo);
            ElMessage.success('本地模型加载成功!');
          } catch (error) {
            ElMessage.error(`本地模型加载失败: ${error.message}`);
          } finally {
            this.isModelApiLoading = false;
          }
        };
      } catch (error) {
        ElMessage.error(`文件夹选择失败: ${error.message}`);
      }
    },

    // Export conversation history (3.8)
    async exportConversationHistory() {
      if (this.activeConversationIndex < 0 || !this.conversations[this.activeConversationIndex]) {
        ElMessage.warning('没有活动的对话可以导出。');
        return;
      }
      const conversationToExp = this.conversations[this.activeConversationIndex];
      try {
        // 先请求后端获取标准 history
        const response = await axios.get(`${API_BASE_URL}/chat/history`, {
          params: {
            chatId: conversationToExp.id,
            title: conversationToExp.name
          }
        });
        const { success, history } = response.data;
        if (!success) throw new Error('获取对话历史失败');
        // 导出为标准 QA 结构
        const qaArray = history.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          timestamp: item.timestamp
        }));
        const jsonData = JSON.stringify(qaArray, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversationToExp.name || 'conversation'}_history.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ElMessage.success('对话历史已导出为JSON!');
      } catch (error) {
        ElMessage.error(`导出对话历史失败: ${error.message}`);
      }
    },

    // Scroll to bottom of chat window
    scrollToBottom() {
      this.$nextTick(() => {
        const chatWindow = this.$refs.chatWindow;
        if (chatWindow) {
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      });
    },

    // Save conversations to local storage
    saveConversationsToStorage() {
      localStorage.setItem('chat_conversations_v2', JSON.stringify(this.conversations));
    },

    // Navigation methods
    refreshPage() { location.reload(); },
    goHome() { this.$router.push('/'); }
  },
  mounted() {
    // 页面首次打开时，只有本地存储有currentModelApiInfo才恢复（且需非空），否则显示未加载
    const savedModelApiInfo = localStorage.getItem('currentModelApiInfo');
    if (savedModelApiInfo && savedModelApiInfo !== '未加载') {
      this.currentModelApiInfo = savedModelApiInfo;
    } else {
      this.currentModelApiInfo = '';
    }
    this.isModelApiLoading = false;
    this.fetchConversations();
    this.timerInterval = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timerInterval);
  }
};
</script>

<style scoped>
.message-think {
  font-size: 12px;
  color: #555;
  margin-top: 4px;
  font-style: italic;
}

.message-sources {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

.message-timestamp {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

.chat-page-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 12px); /* Assuming -6px margin from App.vue */
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden; /* Prevent wrapper from scrolling */
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px 10px 10px; /* Adjust padding */
  border-bottom: 1px solid #e0e0e0;
  background-color: rgba(245, 245, 245, 0.8); /* Slight background for top bar */
  backdrop-filter: blur(5px); /* Optional: frosted glass effect */
  z-index: 10; /* Ensure top bar is above chat content */
}
.page-title { font-size: 22px; margin: 0; color: #333; }
.model-api-info {
  font-size: 14px;
  color: #555;
  background-color: #e9f5ff; /* Light blueish background */
  padding: 5px 10px;
  border-radius: 15px;
  border: 1px solid #cce7ff;
}
.top-right-actions { display: flex; align-items: center; gap: 5px; }
.icon-action-button {
  font-size: 28px; color: #409EFF; background: transparent; border: none; padding: 0;
}
.icon-action-button .el-icon { font-size: inherit; vertical-align: middle;}
.current-time-display { font-size: 22px; color: purple; font-weight: bold; margin-left: 10px; }

.chat-main-layout {
  display: flex;
  flex-grow: 1; /* Takes remaining vertical space */
  margin-top: 10px;
  gap: 15px;
  overflow: hidden; /* Key for nested scrollable areas */
}

.conversation-sidebar {
  width: 260px; /* Slightly wider */
  flex-shrink: 0;
  background-color: #f8f9fa;
  padding: 15px;
  border-right: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.sidebar-header h3 { font-size: 20px; margin: 0; color: #4A5568; } /* Tailwind-ish color */
.new-conversation-btn {
  background-color: #4CAF50; /* Green */
  border-color: #4CAF50;
  color: white;
}
.new-conversation-btn:hover {
  background-color: #45a049;
  border-color: #45a049;
}

.conversation-list-container {
  flex-grow: 1;
  overflow-y: auto;
}
.conversation-list-container ul { list-style: none; padding: 0; margin: 0; }
.conversation-list-container li {
  padding: 10px 12px; margin-bottom: 8px; background-color: #fff;
  border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between;
  align-items: center; transition: background-color 0.2s, box-shadow 0.2s;
  border: 1px solid #e2e8f0; /* Light border */
}
.conversation-list-container li:hover { background-color: #edf2f7; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
.conversation-list-container li.active-conversation {
  background-color: #4299e1; /* Blue */
  color: white;
  border-color: #4299e1;
  box-shadow: 0 4px 8px rgba(66, 153, 225, 0.3);
}
.conv-name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 5px;
}
.conv-actions { display: flex; gap: 5px; }
.action-btn { padding: 2px 5px !important; font-size: 12px !important; min-height: auto !important; }
.action-btn.rename-btn { color: #3182ce; }
.action-btn.rename-btn:hover { color: #2c5282; }
.action-btn.delete-btn { color: #e53e3e; }
.action-btn.delete-btn:hover { color: #c53030; }
.active-conversation .action-btn { color: white !important; } /* Ensure buttons visible on active */
.active-conversation .action-btn:hover { opacity:0.8; }


.empty-conversations {
  text-align: center; color: #718096; font-size: 13px;
  padding-top: 20px; line-height: 1.6;
}


.chat-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff; /* White background for chat area */
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  padding: 15px;
  min-width: 0; /* Allow shrinking */
}
.chat-window-wrapper {
  flex-grow: 1;
  overflow: hidden; /* This is important for the inner scroll */
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.chat-window {
  height: 100%; /* Make it take full height of wrapper */
  overflow-y: auto;
  padding: 15px;
}
.empty-chat-placeholder {
  display: flex; align-items: center; justify-content: center;
  height: 100%; color: #a0aec0; font-size: 14px; text-align: center;
  padding: 20px; line-height: 1.7;
}

.user-message, .ai-message { display: flex; margin-bottom: 12px; font-size: 15px; }
.user-message { justify-content: flex-end; }
.ai-message { justify-content: flex-start; }

.message-bubble {
  padding: 10px 15px; border-radius: 18px; max-width: 75%;
  word-wrap: break-word; line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column; /* Stack avatar and text */
}
.sender-avatar {
  font-size: 0.75em;
  color: #718096; /* Gray for avatar text */
  margin-bottom: 4px;
}
.user-message .message-bubble {
  background-color: #4A90E2; /* User message blue */
  color: white;
  border-bottom-right-radius: 5px;
}
.user-message .sender-avatar { align-self: flex-end; }
.ai-message .message-bubble {
  background-color: #E9EEF4; /* AI message light gray */
  color: #2D3748;
  border-bottom-left-radius: 5px;
}
.ai-message .sender-avatar { align-self: flex-start; }


.chat-input-area { display: flex; gap: 10px; align-items: flex-end; margin-bottom:10px; }
.chat-input-field :deep(.el-textarea__inner) {
  border-radius: 20px; padding: 10px 15px; font-size: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05) inset;
}
.send-button {
  height: auto; /* Adjust height based on input */
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 15px;
}

.bottom-controls {
  padding-top: 10px; border-top: 1px solid #e0e0e0;
  display: flex; justify-content: center; /* Center the form */
}
.bottom-controls .el-form-item { margin-bottom: 0 !important; }


.config-panel {
  width: 280px; /* Wider config panel */
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: hidden; /* Allow scrolling if content overflows */
}
.config-card {
  border: 1px solid #e0e0e0;
  background-color: #fdfdff; /* Very light background */
}
.config-card :deep(.el-card__header) {
  background-color: #f0f5fa;
  padding: 10px 15px;
  font-weight: 600;
  font-size: 15px;
}
.config-item { margin-bottom: 18px; }
.config-item label { display: block; margin-bottom: 6px; font-size: 14px; color: #4A5568; font-weight:500; }
.config-button { margin-top: 8px; width: 100%; }
.path-display {
  font-size: 12px; color: #718096; margin-top: 5px;
  word-break: break-all; background-color: #f0f2f5; padding: 5px; border-radius: 4px;
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

.model-api-loading-spinner {
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 3px solid #90caf9;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 2px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Floating particles and rainbow stripes (same as before, ensure z-index is low) */
.floating-particles { z-index: -2; /* ... */ }
.rainbow-stripes { z-index: -3; /* ... */ }
/* (Keep the keyframes and full definitions for floating-particles and rainbow-stripes) */
.floating-particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -2; }
@keyframes float { 0% { transform: translateY(0) translateX(0); opacity: 0.5; } 50% { opacity: 1; } 100% { transform: translateY(-200px) translateX(80px); opacity: 0; } }
.floating-particles::before, .floating-particles::after { content: ''; position: absolute; top: 100%; left: 50%; width: 10px; height: 10px; background-color: #a3bffa; border-radius: 50%; animation: float 4s infinite linear; opacity: 0.5; }
.floating-particles::after { width: 15px; height: 15px; background-color: #9f7aea; animation-duration: 6s; animation-delay: 2s; }
.rainbow-stripes { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, #f7d1d1, #f9e1b2, #f3f9b6, #d1f3e1, #b8d3f3, #d0bdf0, #f0b8f6); background-size: 400% 400%; animation: rainbowMove 10s linear infinite; pointer-events: none; z-index: -3; }
@keyframes rainbowMove { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
</style>