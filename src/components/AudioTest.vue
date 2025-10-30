<template>
  <div class="audio-test">
    <div class="container">
      <h1 class="title">音频文件测试</h1>
      <p class="subtitle">测试预录音频文件是否能正常播放</p>
      
      <div class="test-section">
        <h2 class="section-title">基础音频测试</h2>
        <div class="test-grid">
          <div 
            v-for="audio in testAudios" 
            :key="audio.path"
            class="test-item"
            @click="testAudio(audio.path)"
            :class="{ 'playing': currentPlaying === audio.path }"
          >
            <div class="audio-name">{{ audio.name }}</div>
            <div class="audio-path">{{ audio.path }}</div>
            <div class="status" :class="audio.status">
              {{ getStatusText(audio.status) }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="controls">
        <button @click="testAllAudios" class="test-all-btn" :disabled="isTesting">
          {{ isTesting ? '正在测试...' : '测试所有音频' }}
        </button>
        <button @click="checkAudioFiles" class="check-btn">
          检查音频文件
        </button>
        <button @click="goBack" class="back-btn">
          返回首页
        </button>
      </div>
      
      <div class="log-section" v-if="logs.length > 0">
        <h3 class="log-title">测试日志</h3>
        <div class="log-list">
          <div 
            v-for="(log, index) in logs" 
            :key="index"
            class="log-item"
            :class="log.type"
          >
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { audioService } from '../services/audioService'

// Events
const emit = defineEmits<{
  back: []
}>()

// 测试音频列表
const testAudios = ref([
  { name: 'a1', path: '/mp3/a1.mp3', status: 'pending' },
  { name: 'ba1', path: '/mp3/ba1.mp3', status: 'pending' },
  { name: 'ma1', path: '/mp3/ma1.mp3', status: 'pending' },
  { name: 'yi1', path: '/mp3/yi1.mp3', status: 'pending' },
  { name: 'wu1', path: '/mp3/wu1.mp3', status: 'pending' },
  { name: 'ai1', path: '/mp3/ai1.mp3', status: 'pending' },
  { name: 'zha1', path: '/mp3/zha1.mp3', status: 'pending' },
  { name: 'cha1', path: '/mp3/cha1.mp3', status: 'pending' },
])

const currentPlaying = ref<string | null>(null)
const isTesting = ref(false)
const logs = ref<Array<{ message: string; type: 'info' | 'success' | 'error' }>>([])

// 添加日志
const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  logs.value.push({ message: `[${new Date().toLocaleTimeString()}] ${message}`, type })
  // 保持最新的20条日志
  if (logs.value.length > 20) {
    logs.value.shift()
  }
}

// 获取状态文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return '待测试'
    case 'playing': return '播放中'
    case 'success': return '成功'
    case 'error': return '失败'
    default: return '未知'
  }
}

// 测试单个音频
const testAudio = async (audioPath: string) => {
  if (currentPlaying.value) return
  
  const audioItem = testAudios.value.find(item => item.path === audioPath)
  if (!audioItem) return
  
  currentPlaying.value = audioPath
  audioItem.status = 'playing'
  
  addLog(`开始播放: ${audioPath}`, 'info')
  
  try {
    const audio = new Audio(audioPath)
    
    await new Promise((resolve, reject) => {
      audio.oncanplaythrough = () => {
        addLog(`音频文件加载成功: ${audioPath}`, 'success')
        audio.play().then(resolve).catch(reject)
      }
      
      audio.onerror = () => {
        reject(new Error(`音频文件加载失败: ${audioPath}`))
      }
      
      audio.onended = () => {
        resolve(undefined)
      }
      
      audio.load()
    })
    
    audioItem.status = 'success'
    addLog(`播放完成: ${audioPath}`, 'success')
  } catch (error) {
    audioItem.status = 'error'
    addLog(`播放失败: ${audioPath} - ${error}`, 'error')
  } finally {
    currentPlaying.value = null
  }
}

// 测试所有音频
const testAllAudios = async () => {
  if (isTesting.value) return
  
  isTesting.value = true
  addLog('开始测试所有音频文件', 'info')
  
  for (const audioItem of testAudios.value) {
    await testAudio(audioItem.path)
    // 每个音频之间间隔0.5秒
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  isTesting.value = false
  addLog('所有音频测试完成', 'info')
}

// 检查音频文件
const checkAudioFiles = async () => {
  addLog('开始检查音频文件是否存在', 'info')
  
  for (const audioItem of testAudios.value) {
    try {
      const exists = await audioService.checkAudioExists(audioItem.path)
      if (exists) {
        addLog(`音频文件存在: ${audioItem.path}`, 'success')
      } else {
        addLog(`音频文件不存在: ${audioItem.path}`, 'error')
      }
    } catch (error) {
      addLog(`检查音频文件失败: ${audioItem.path} - ${error}`, 'error')
    }
  }
  
  addLog('音频文件检查完成', 'info')
}

// 返回首页
const goBack = () => {
  audioService.stop()
  emit('back')
}

// 组件挂载时的初始化
onMounted(() => {
  addLog('音频测试页面已加载', 'info')
})
</script>

<style scoped>
.audio-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 10px;
}

.subtitle {
  text-align: center;
  font-size: 1.1rem;
  color: #718096;
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
  text-align: center;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.test-item {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-item:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.test-item.playing {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
  transform: scale(1.02);
}

.audio-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.audio-path {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 10px;
  font-family: 'Courier New', monospace;
}

.status {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.status.pending {
  background: #e2e8f0;
  color: #718096;
}

.status.playing {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.status.success {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.status.error {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.test-all-btn,
.check-btn,
.back-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-all-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.check-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.back-btn {
  background: #718096;
  color: white;
}

.test-all-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-all-btn:hover:not(:disabled),
.check-btn:hover,
.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.log-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 30px;
}

.log-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 15px;
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
}

.log-item {
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  margin-bottom: 5px;
  padding: 2px 0;
}

.log-item.info {
  color: #4a5568;
}

.log-item.success {
  color: #38a169;
}

.log-item.error {
  color: #e53e3e;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .test-grid {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .test-all-btn,
  .check-btn,
  .back-btn {
    width: 200px;
  }
}
</style>
