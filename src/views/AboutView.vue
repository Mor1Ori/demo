<template>
  <div class="app">
    <h1 class="text-3xl font-bold mb-6">数据转化系统</h1>
    <div class="grid grid-cols-2 gap-4">
      <!-- 上传模块 -->
      <UploadModule />

      <!-- 场景选择模块 -->
      <SceneSelectionModule />
    </div>

    <!-- RAG管理模块 -->
    <RAGManagementModule />

    <!-- 数据转化触发按钮 -->
    <div class="mt-6">
      <button @click="startDataConversion" class="bg-blue-500 text-white py-2 px-4 rounded-lg">开始转化</button>
    </div>
  </div>
</template>

<script>
import UploadModule from '../components/RAGManagement.vue';
import SceneSelectionModule from '../components/SceneSelectionModule.vue';
import RAGManagementModule from '../components/RAGManagement.vue';

export default {
  name: 'DataConversionSystem',
  methods: {
    startDataConversion() {
      alert('数据转化已启动！');
    }
  }
};
</script>

<style scoped>
.app {
  padding: 20px;
}
</style>
