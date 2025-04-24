<template>
  <div class="chat-page">
    <div class="floating-particles"></div>
    <div class="rainbow-stripes"></div>
    <div class="top-right-icons">
    <h1 style="margin-left:20px;">🤖 智能问答</h1>
    <div style="display: flex; align-items: right;">
        <el-button @click="refreshPage" type="text" style="width: 60px;background-color: transparent; border: none;"><el-icon style="font-size: 33px;color:#409EFF"><Refresh /></el-icon></el-button>
    <el-button @click="goHome" type="text" style="width: 60px; background-color: transparent; border: none;"><el-icon style="font-size: 30px;color:#409EFF"><HomeFilled /></el-icon></el-button>
    <span style="font-size: 24px; color: purple; font-weight: bold; padding-left: 20px;">{{ currentTime }}</span>
    </div>
    
  </div>
    <!-- 左侧对话记录栏 -->
    <div class="conversation-list">
      <h3 style="font-size:22px">🗨️ 对话记录</h3>
      <ul>
        <li 
          v-for="(conv, index) in conversations" 
          :key="index"
          :class="{'active-conversation': index === activeConversationIndex}"
          @click="switchConversation(index)"
        >
          {{ conv.name }}
          <button class="delete-button" @click.stop="deleteConversation(index)">🗑️</button>
        </li>
      </ul>
      <button @click="createNewConversation" class="new-conversation-button">➕ 新建对话</button>
    </div>

    <!-- 右侧聊天框 -->
    <div class="chat-container">
      <div class="chat-window">
        <div v-for="message in conversations[activeConversationIndex]?.messages || []" :key="message.id" :class="message.sender === 'user' ? 'user-message' : 'ai-message'">
          <div class="message-bubble">{{ message.text }}</div>
        </div>
      </div>

      <div class="input-section">
        <input v-model="userInput" @keyup.enter="sendMessage" placeholder="输入消息..." />
        <button @click="sendMessage"><el-icon style="font-size:20px;"><Promotion /></el-icon>&nbsp;发送</button>
      </div>
    </div>
  </div>
</template>

<script>
import { UploadFilled, DeleteFilled, Search, House, Refresh, RemoveFilled, HomeFilled, Promotion } from '@element-plus/icons-vue';

export default {
  components: {
    UploadFilled, DeleteFilled, Search, HomeFilled, Refresh, RemoveFilled, Promotion
  },
  data() {
    return {
      userInput: '',
      conversations: JSON.parse(localStorage.getItem('conversations') || '[]'),
      activeConversationIndex: 0,
      currentTime: new Date().toLocaleTimeString(),
      // 模拟的三条对话
      aiResponses: [
        '该事件欺诈风险等级为中等，其违反了《中华人民共和国公司法》第一百零五条关于“召开股东大会，应当将会议审议的事项于会议召开三十日以前通知各股东”的规定。违反了《股票发行与交易管理暂行条例》第十条第二款关于增资时间“距前一次公开发行股票的时间不少于十二个月”的规定。',
        '该事件欺诈风险等级为高，其违反了《上市公司信息披露管理办法》第三条第一款的规定,未按照《上市公司信息披露管理办法》第四条、第五十一条第一款、第三款的规定,违反了《上市公司监管指引第5号——上市公司内幕信息知情人登记管理制度》第六条第一款、第七条第一款、第十条第一款的规定。',
        '该事件欺诈风险等级为高，该行为不符合《关于企业公开发行股票报送材料要求的通知》(中国证监会证监发字〔1993〕39号)中有关规定。'
      ],
      userQuestions: [
        '请判断并分析下列事件欺诈风险：经查实，广西柳工公司于一九九三年十月十三日公布其招股说明书，一九九四年九月二十九日在报刊上刊登其董事会有关公司配股的决议，其中称“本公司将于近期召开股东大会”，然后该公司在没有公告会议时间、地点的情况下于当天下午召开股东大会表决通过了配股方案。此外，该公司于九月三十日在《深圳时报》公布了其配股说明书。',
        '请判断并分析下列事件欺诈风险：经查,永泰运化工物流股份有限公司(以下简称永泰运或公司)存在以下问题:一、财务报告信息披露不准确。公司于2024年4月10日和2024年8月28日先后2次披露《关于前期会计差错更正及追溯调整的公告》,将2023年度开展的部分贸易业务收入确认方式由总额法更正为净额法。两次会计差错更正合计调减2023年第一季度报告、半年度报告、第三季度报告营业收入金额分别为-47,216,381.95元、-161,277,519.76元、-257,296,692.64元。二、未按规定执行内幕信息知情人登记管理制度。公司未就2022年度业绩预告事项填写和报送内幕信息知情人档案、重大事项进程备忘录.',
        '请判断并分析下列事件欺诈风险：在编制利润预测时，没有合理地分析公司生产经营条件和财务状况，对1996年利润增长作出不切实际的预测'
      ]
    };
  },
  methods: {
    refreshPage() {
      location.reload();
    },
    goHome() {
      this.$router.push('/');
    },
    sendMessage() {
      if (!this.userInput.trim()) return;

      // 用户消息
      const message = { id: Date.now(), sender: 'user', text: this.userInput };
      this.conversations[this.activeConversationIndex].messages.push(message);

      // AI 回复
      const aiReply = { id: Date.now() + 1, sender: 'ai', text: this.aiResponses[this.conversations[this.activeConversationIndex].messages.length - 1] };
      this.conversations[this.activeConversationIndex].messages.push(aiReply);

      this.userInput = '';
      this.saveConversations();
    },
    saveConversations() {
      localStorage.setItem('conversations', JSON.stringify(this.conversations));
    },
    createNewConversation() {
      const newConv = { name: `对话 ${this.conversations.length + 1}`, messages: [] };
      this.conversations.push(newConv);
      this.activeConversationIndex = this.conversations.length - 1;
      this.saveConversations();
      
      // 在创建新对话后模拟三轮对话
      this.simulateConversation();
    },
    switchConversation(index) {
      this.activeConversationIndex = index;
      this.saveConversations();
    },
    deleteConversation(index) {
      this.conversations.splice(index, 1);
      if (this.activeConversationIndex >= index) {
        this.activeConversationIndex = Math.max(0, this.activeConversationIndex - 1);
      }
      this.saveConversations();
    },
    simulateConversation() {
      // 模拟用户输入和AI回复
      for (let i = 0; i < this.userQuestions.length; i++) {
        // 模拟用户提问
        const userMessage = { id: Date.now() + i, sender: 'user', text: this.userQuestions[i] };
        this.conversations[this.activeConversationIndex].messages.push(userMessage);

        // 模拟AI回复
        const aiMessage = { id: Date.now() + i + 1, sender: 'ai', text: this.aiResponses[i] };
        this.conversations[this.activeConversationIndex].messages.push(aiMessage);
      }
      this.saveConversations();
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
.chat-page {
  display: flex;
  height: 94vh;
}

.conversation-list {
  width: 220px;
  background-color: #f0f4f8;
  padding: 15px;
  border-right: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top:60px;
  font-size:17px;
}

.conversation-list h2 {
  margin-bottom: 10px;
}

.conversation-list ul {
  list-style: none;
  padding: 0;
}

.conversation-list li {
  padding: 8px;
  margin-bottom: 6px;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.conversation-list li.active-conversation {
    background-color: #cbd5e0;
    color: #333333;
}

.conversation-list li:hover {
  background-color: #dbe8f4;
}

.delete-button {
  padding:8px 12px;
  background: none;
  border: none;
  cursor: pointer;
}

.new-conversation-button {
  margin-top: 10px;
  width: 100%;
  padding: 6px;
  background-color: #388E3C;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.new-conversation-button:hover {
  background-color: #FFCDD2;
  color:black;
}

.chat-container {
  flex-grow: 1;
  flex-basis: 70%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 12px;
  margin-left: 30px;
  margin-right:60px;
  margin-top:60px;
}

.chat-window {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: white;
  border-radius: 12px;
  margin-bottom: 10px;
  height: 500px;
}

.user-message {
    text-align: left;  /* 让文字左对齐 */
  margin: 5px 0;
  font-size: 15px;
  display: flex;  /* 使用flex布局 */
  justify-content: flex-end;  /* 让消息框右对齐 */
}

.ai-message {
  text-align: left;
  margin: 5px 0;
  font-size:15px;
}

.message-bubble {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 86%;
  white-space: pre-wrap;
}

.user-message .message-bubble {
  background-color: #d1ecf1;
  border-radius: 12px 12px 0 12px;
}

.ai-message .message-bubble {
  background-color: #f8d7da;
  border-radius: 12px 12px 12px 0;
}

.input-section {
  display: flex;
  gap: 8px;
}

input {
  flex-grow: 1;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size:16px;
}

button {
  padding: 10px 38px;
  background-color: #007bff;
  font-size:18px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
.top-right-icons {
  position: absolute;
  top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width:82%;
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
</style>
