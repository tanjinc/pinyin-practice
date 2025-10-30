<template>
  <div class="home-page">
    <div class="container">
      <div class="header">
        <h1 class="title">拼音打字练习</h1>
        <p class="subtitle">提升你的拼音输入速度和准确率</p>
      </div>
      
      <div class="content">
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">⌨️</div>
            <div class="feature-text">实时拼音检测</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⏱️</div>
            <div class="feature-text">60秒计时挑战</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <div class="feature-text">详细成绩统计</div>
          </div>
        </div>
        
        <div class="settings">
          <div class="setting-item">
            <label for="practiceMode">练习模式:</label>
            <select id="practiceMode" v-model="selectedMode" class="mode-select">
              <option value="character">汉字拼音</option>
              <option value="initial">声母练习</option>
              <option value="final">韵母练习</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label for="duration">练习时长:</label>
            <select id="duration" v-model="selectedDuration" class="duration-select">
              <option value="30">30秒</option>
              <option value="60">60秒</option>
              <option value="120">2分钟</option>
            </select>
          </div>
          
          <div class="setting-item" v-if="selectedMode === 'character'">
            <label for="questionCount">题目数量:</label>
            <select id="questionCount" v-model="selectedQuestionCount" class="question-select">
              <option value="10">10题</option>
              <option value="20">20题</option>
              <option value="30">30题</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label class="speech-label">
              <input 
                type="checkbox" 
                v-model="speechEnabled" 
                class="speech-checkbox"
              />
              <span class="speech-text">启用发音 🔊</span>
            </label>
          </div>
          
          <div class="setting-item" v-if="speechEnabled">
            <label class="speech-label">
              <input 
                type="checkbox" 
                v-model="autoPlay" 
                class="speech-checkbox"
              />
              <span class="speech-text">自动发音</span>
            </label>
          </div>
        </div>
        
        <div class="button-group">
          <button class="start-button" @click="startPractice">
            开始练习
          </button>
          <button class="test-button" @click="testPronunciation" v-if="speechEnabled">
            🔊 发音测试
          </button>
          <button class="audio-test-button" @click="testAudio" v-if="speechEnabled">
            🎵 音频测试
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PracticeMode } from '../data/pinyinData'
import { speechService } from '../services/speechService'

// 定义事件
const emit = defineEmits<{
  startPractice: [settings: { 
    mode: PracticeMode
    duration: number
    questionCount: number
    speechEnabled: boolean
    autoPlay: boolean
  }]
  testPronunciation: []
  testAudio: []
}>()

// 设置选项
const selectedMode = ref<PracticeMode>('character')
const selectedDuration = ref(60)
const selectedQuestionCount = ref(20)
const speechEnabled = ref(true)
const autoPlay = ref(false)

// 检查语音支持
onMounted(() => {
  if (!speechService.isSupported()) {
    speechEnabled.value = false
  }
})

// 开始练习
const startPractice = () => {
  emit('startPractice', {
    mode: selectedMode.value,
    duration: selectedDuration.value,
    questionCount: selectedQuestionCount.value,
    speechEnabled: speechEnabled.value,
    autoPlay: autoPlay.value
  })
}

// 发音测试
const testPronunciation = () => {
  emit('testPronunciation')
}

// 音频测试
const testAudio = () => {
  emit('testAudio')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.header {
  margin-bottom: 40px;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 10px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 5px;
}

.feature-text {
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #f7fafc;
  border-radius: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.setting-item label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.95rem;
}

.mode-select,
.duration-select,
.question-select {
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.mode-select:focus,
.duration-select:focus,
.question-select:focus {
  outline: none;
  border-color: #667eea;
}

.speech-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.95rem;
}

.speech-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.speech-text {
  user-select: none;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.start-button,
.test-button,
.audio-test-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.test-button {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  font-size: 1rem;
  padding: 12px 24px;
}

.audio-test-button {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  font-size: 1rem;
  padding: 12px 24px;
}

.start-button:hover,
.test-button:hover,
.audio-test-button:hover {
  transform: translateY(-2px);
}

.start-button:hover {
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.test-button:hover {
  box-shadow: 0 8px 25px rgba(79, 172, 254, 0.6);
}

.audio-test-button:hover {
  box-shadow: 0 8px 25px rgba(250, 112, 154, 0.6);
}

.start-button:active,
.test-button:active,
.audio-test-button:active {
  transform: translateY(0);
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
  
  .feature-list {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .settings {
    padding: 15px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .setting-item label {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .start-button,
  .test-button,
  .audio-test-button {
    padding: 14px 28px;
    font-size: 1.1rem;
    width: 200px;
  }
}
</style>
