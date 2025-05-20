<template>
  <div class="chat-page-wrapper">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>

    <!-- Top Bar: Title, Model Info, Icons -->
    <div class="top-bar">
      <h1 class="page-title">🤖 智能问答</h1>
      <div class="model-api-info">
        当前已加载的模型/api: {{ currentModelApiInfo || '未加载' }}
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
              @click="switchConversation(index)"
            >
              <span class="conv-name">{{ conv.name }}</span>
              <div class="conv-actions">
                <el-button size="small" type="text" @click.stop="renameConversation(index)" class="action-btn rename-btn">修改名称</el-button>
                <el-button size="small" type="text" @click.stop="deleteConversation(index)" class="action-btn delete-btn">🗑️</el-button>
              </div>
            </li>
          </ul>
          <div v-else class="empty-conversations">
            (这里显示许多对话组，在访问该页面/chat/的时候就获取到每个对话组的id和title)
            <br/> 点击“新建对话”开始。
          </div>
        </div>
      </div>

      <!-- 中间聊天框 -->
      <div class="chat-area">
        <div class="chat-window-wrapper">
          <div class="chat-window" ref="chatWindow">
            <div v-if="!activeConversationMessages || activeConversationMessages.length === 0" class="empty-chat-placeholder">
              (在点击左侧某个对话组之后，向后端获取到该对话组里的历史对话内容，以GPT页面那种对话的形式显示在这里)
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
              <el-option label="模型A (DeepSeek V2)" value="model_a"></el-option>
              <el-option label="模型B (GPT-4)" value="model_b"></el-option>
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
import { Refresh, HomeFilled, Promotion, Plus, Edit, Delete } from '@element-plus/icons-vue'; // Added Plus, Edit, Delete
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'ChatPage',
  components: {
    Refresh, HomeFilled, Promotion, Plus, Edit, Delete
  },
  data() {
    return {
      userInput: '',
      conversations: [], // Will be loaded from localStorage or API
      activeConversationIndex: -1, // No active conversation initially
      currentTime: new Date().toLocaleTimeString(),
      currentModelApiInfo: 'DeepSeek API v1.0', // Example
      
      // Right panel config
      selectedRemoteModel: '',
      apiEndpoint: '',
      localModelPath: '',

      // Bottom controls
      enableHistory: true,
      showModelThinking: false,
      showRagReference: false,

      // Mock data (will be replaced by actual API calls)
      mockAiResponses: [ /* ... your existing mock responses ... */ ],
      mockUserQuestions: [ /* ... your existing mock user questions ... */ ],
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
    refreshPage() { location.reload(); },
    goHome() { this.$router.push('/'); },

    async fetchConversations() {
      // TODO: Replace with API call to fetch conversation list (id, name/title)
      // For now, load from localStorage or initialize
      const storedConversations = localStorage.getItem('chat_conversations_v2');
      if (storedConversations) {
        this.conversations = JSON.parse(storedConversations);
        if (this.conversations.length > 0) {
          this.activeConversationIndex = 0; // Select first one by default
          // TODO: Optionally fetch messages for the first active conversation here
        }
      } else {
        // Initialize with a sample if none found
        this.conversations = [
          // { id: 'conv1', name: '对话一', messages: [] },
          // { id: 'conv2', name: '对话二', messages: [] }
        ];
        this.activeConversationIndex = -1;
      }
      // Simulate fetching current model/api info
      // this.currentModelApiInfo = await fetchModelInfoFromApi();
    },

    async fetchMessagesForConversation(convIndex) {
      // TODO: API call to fetch messages for conversations[convIndex].id
      // For now, if messages are already part of the conv object (e.g., from localStorage)
      // this function might just ensure the UI updates or handle lazy loading.
      ElMessage.info(`加载对话 "${this.conversations[convIndex].name}" 的消息... (模拟)`);
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 300));
      // If messages were not pre-loaded, you'd populate them here.
      // Example: this.conversations[convIndex].messages = await fetchMessagesApi(this.conversations[convIndex].id);
      this.scrollToBottom();
    },

    saveConversationsToStorage() {
      localStorage.setItem('chat_conversations_v2', JSON.stringify(this.conversations));
    },

    createNewConversation() {
      // TODO: API call to create a new conversation on the backend, get its ID
      const newConvId = `conv_${Date.now()}`; // Temporary local ID
      const newConvName = `新对话 ${this.conversations.length + 1}`;
      const newConv = { id: newConvId, name: newConvName, messages: [] };
      
      this.conversations.push(newConv);
      this.activeConversationIndex = this.conversations.length - 1;
      this.saveConversationsToStorage();
      ElMessage.success(`已创建 "${newConvName}"`);
      // this.simulateInitialChat(newConvId); // Optionally simulate some initial messages
      this.userInput = ''; // Clear input for new chat
      this.scrollToBottom();
    },

    async renameConversation(index) {
      const conversation = this.conversations[index];
      try {
        const { value } = await ElMessageBox.prompt('请输入新的对话名称:', '修改名称', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: conversation.name,
          inputValidator: (val) => val && val.trim() !== '' ? true : '名称不能为空',
        });
        if (value && value.trim() !== conversation.name) {
          // TODO: API call to update conversation name on backend
          // await updateConversationNameApi(conversation.id, value.trim());
          this.conversations[index].name = value.trim();
          this.saveConversationsToStorage();
          ElMessage.success('对话名称已修改!');
        }
      } catch (e) {
        if (e !== 'cancel') ElMessage.error('修改名称失败: ' + e);
      }
    },

    async deleteConversation(index) {
      const conversation = this.conversations[index];
      try {
        await ElMessageBox.confirm(`确定要删除对话 "${conversation.name}" 吗?`, '确认删除', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
        });
        // TODO: API call to delete conversation on backend
        // await deleteConversationApi(conversation.id);
        this.conversations.splice(index, 1);
        if (this.activeConversationIndex === index) {
            this.activeConversationIndex = this.conversations.length > 0 ? 0 : -1;
            if (this.activeConversationIndex !== -1) {
                this.fetchMessagesForConversation(this.activeConversationIndex);
            }
        } else if (this.activeConversationIndex > index) {
            this.activeConversationIndex--;
        }
        this.saveConversationsToStorage();
        ElMessage.success('对话已删除!');
      } catch (e) {
        if (e !== 'cancel') ElMessage.error('删除失败: ' + e);
      }
    },

    switchConversation(index) {
      if (this.activeConversationIndex !== index) {
        this.activeConversationIndex = index;
        this.fetchMessagesForConversation(index); // Fetch/display messages for the new active conversation
      }
    },

    async sendMessage() {
      if (!this.userInput.trim() || this.activeConversationIndex < 0) return;

      const userMessageText = this.userInput.trim();
      const currentConv = this.conversations[this.activeConversationIndex];

      const userMessage = { id: `msg_${Date.now()}_user`, sender: 'user', text: userMessageText };
      currentConv.messages.push(userMessage);
      this.userInput = '';
      this.scrollToBottom();

      // TODO: API call to send message to backend and get AI response
      // const aiResponseText = await getAiReplyFromApi(currentConv.id, userMessageText, this.enableHistory);
      // Simulate AI response
      const aiResponseText = `模拟回复针对："${userMessageText}". 当前启用历史: ${this.enableHistory}, 显示思考: ${this.showModelThinking}, RAG参考: ${this.showRagReference}.`;
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000)); // Simulate network delay

      const aiMessage = { id: `msg_${Date.now()}_ai`, sender: 'ai', text: aiResponseText };
      currentConv.messages.push(aiMessage);
      
      this.saveConversationsToStorage();
      this.scrollToBottom();
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const chatWindow = this.$refs.chatWindow;
        if (chatWindow) {
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      });
    },

    // Right panel methods (mostly placeholders)
    loadRemoteModel() {
      if (!this.selectedRemoteModel) {
        ElMessage.warning('请先选择一个模型');
        return;
      }
      // TODO: API call to load this.selectedRemoteModel
      ElMessage.info(`正在加载模型: ${this.selectedRemoteModel}... (模拟)`);
      this.currentModelApiInfo = `模型: ${this.selectedRemoteModel} (模拟加载)`;
    },
    loadApi() {
      if (!this.apiEndpoint.trim()) {
        ElMessage.warning('请输入API端点');
        return;
      }
      // TODO: Logic to validate and use this.apiEndpoint
      ElMessage.info(`尝试加载API: ${this.apiEndpoint}... (模拟)`);
      this.currentModelApiInfo = `API: ${this.apiEndpoint} (模拟加载)`;
    },
    selectLocalModelPath() {
      // This requires either a native file dialog (e.g., via Electron)
      // or a server-side file browser if running in a web context with server access.
      // For a pure web app, direct folder selection is not possible due to browser security.
      // You might use <input type="file" webkitdirectory directory multiple /> but support varies.
      ElMessage.info('选择本地模型文件夹功能需要特定环境支持 (如Electron或服务器端配合)。');
      // Simulate path selection for UI
      this.localModelPath = "/path/to/your/safetensors/model (模拟)";
    },
    exportConversationHistory() {
      if (this.activeConversationIndex < 0 || !this.conversations[this.activeConversationIndex]) {
        ElMessage.warning('没有活动的对话可以导出。');
        return;
      }
      const conversationToExp = this.conversations[this.activeConversationIndex];
      const jsonData = JSON.stringify(conversationToExp, null, 2);
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
    },
    
    // Simulate initial chat for new conversations (from your old code)
    // simulateInitialChat(convId) {
    //   const convIndex = this.conversations.findIndex(c => c.id === convId);
    //   if (convIndex === -1) return;
    //   for (let i = 0; i < this.mockUserQuestions.length; i++) {
    //     this.conversations[convIndex].messages.push({ id: Date.now() + i, sender: 'user', text: this.mockUserQuestions[i] });
    //     this.conversations[convIndex].messages.push({ id: Date.now() + i + 1000, sender: 'ai', text: this.mockAiResponses[i] });
    //   }
    //   this.saveConversationsToStorage();
    //   this.scrollToBottom();
    // }

  },
  mounted() {
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
  overflow-y: auto; /* Allow scrolling if content overflows */
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