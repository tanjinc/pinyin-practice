<template>
  <div class="home-page">
    <h1 class="main-title">拼音字母学习</h1>
    <div class="content-layout">
      <div class="cards-container">
      <div class="card" @click="selectMode('initial')">
        <svg class="book-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12 L50 12 L50 48 L10 48 Z" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="30" y1="12" x2="30" y2="48" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="20" x2="25" y2="20" stroke="currentColor" stroke-width="1.5"/>
          <line x1="15" y1="25" x2="25" y2="25" stroke="currentColor" stroke-width="1.5"/>
          <line x1="15" y1="30" x2="25" y2="30" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <div class="card-text">声母</div>
      </div>
      <div class="card" @click="selectMode('final')">
        <svg class="book-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12 L50 12 L50 48 L10 48 Z" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="30" y1="12" x2="30" y2="48" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="20" x2="25" y2="20" stroke="currentColor" stroke-width="1.5"/>
          <line x1="15" y1="25" x2="25" y2="25" stroke="currentColor" stroke-width="1.5"/>
          <line x1="15" y1="30" x2="25" y2="30" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <div class="card-text">韵母学习</div>
      </div>
      <div class="card" @click="selectMode('overall')">
        <svg class="book-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12 L50 12 L50 48 L10 48 Z" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="30" y1="12" x2="30" y2="48" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="20" x2="25" y2="20" stroke="currentColor" stroke-width="1.5"/>
          <line x1="15" y1="25" x2="25" y2="25" stroke="currentColor" stroke-width="1.5"/>
          <line x1="15" y1="30" x2="25" y2="30" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <div class="card-text">整体认读音节</div>
      </div>
      </div>
      
      <!-- 右侧设置面板（常驻显示） -->
      <div class="settings-panel">
        <div class="settings">
        <div class="setting-item" v-if="selectedMode === 'character'">
          <label for="questionCount">题目数量:</label>
          <select id="questionCount" v-model="selectedQuestionCount" class="question-select">
            <option value="10">10题</option>
            <option value="20">20题</option>
            <option value="30">30题</option>
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

        <div class="setting-item">
          <label class="speech-label">
            <input 
              type="checkbox" 
              v-model="randomize"
              class="speech-checkbox"
            />
            <span class="speech-text">随机顺序</span>
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
import { loadSettings, saveSettings } from '../services/storageService'

// 定义事件
const emit = defineEmits<{
  startPractice: [settings: { 
    mode: PracticeMode
    duration: number
    questionCount: number
    speechEnabled: boolean
    autoPlay: boolean
    randomize: boolean
  }]
  testPronunciation: []
  testAudio: []
}>()

// 设置选项
const selectedMode = ref<PracticeMode | null>(null)
const selectedDuration = ref(60)
const selectedQuestionCount = ref(20)
const speechEnabled = ref(true)
const autoPlay = ref(false)
const randomize = ref(false)

// 检查语音支持
onMounted(() => {
  if (!speechService.isSupported()) {
    speechEnabled.value = false
  }
  // 载入历史设置
  const last = loadSettings()
  if (last) {
    selectedMode.value = last.mode
    selectedDuration.value = last.duration
    selectedQuestionCount.value = last.questionCount
    speechEnabled.value = last.speechEnabled
    autoPlay.value = last.autoPlay
    randomize.value = !!last.randomize
  }
})

// 选择模式后直接进入练习
const selectMode = (mode: PracticeMode) => {
  selectedMode.value = mode
  saveSettings({
    mode,
    duration: selectedDuration.value,
    questionCount: selectedQuestionCount.value,
    speechEnabled: speechEnabled.value,
    autoPlay: autoPlay.value,
    randomize: randomize.value
  })
  emit('startPractice', {
    mode,
    duration: selectedDuration.value,
    questionCount: selectedQuestionCount.value,
    speechEnabled: speechEnabled.value,
    autoPlay: autoPlay.value,
    randomize: randomize.value
  })
}

// 返回选择（保留API，当前布局不再使用）
const goBack = () => {
  selectedMode.value = null
}

// 开始练习
const startPractice = () => {
  if (!selectedMode.value) return
  // 保存设置便于下次默认填充
  saveSettings({
    mode: selectedMode.value,
    duration: selectedDuration.value,
    questionCount: selectedQuestionCount.value,
    speechEnabled: speechEnabled.value,
    autoPlay: autoPlay.value,
    randomize: randomize.value
  })
  emit('startPractice', {
    mode: selectedMode.value,
    duration: selectedDuration.value,
    questionCount: selectedQuestionCount.value,
    speechEnabled: speechEnabled.value,
    autoPlay: autoPlay.value,
    randomize: randomize.value
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
  position: relative;
  background: #1a1f3a;
  padding: 40px 20px;
  overflow: hidden;
}

/* 星空背景效果 */
.home-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(2px 2px at 20% 30%, white, transparent),
    radial-gradient(2px 2px at 60% 70%, white, transparent),
    radial-gradient(1px 1px at 50% 50%, white, transparent),
    radial-gradient(1px 1px at 80% 10%, white, transparent),
    radial-gradient(2px 2px at 90% 40%, white, transparent),
    radial-gradient(1px 1px at 33% 60%, white, transparent),
    radial-gradient(1px 1px at 55% 25%, white, transparent),
    radial-gradient(1px 1px at 15% 80%, white, transparent),
    radial-gradient(2px 2px at 75% 85%, white, transparent),
    radial-gradient(1px 1px at 40% 15%, white, transparent),
    /* extra stars */
    radial-gradient(1px 1px at 10% 50%, white, transparent),
    radial-gradient(2px 2px at 25% 15%, white, transparent),
    radial-gradient(1px 1px at 35% 85%, white, transparent),
    radial-gradient(1px 1px at 45% 20%, white, transparent),
    radial-gradient(2px 2px at 55% 10%, white, transparent),
    radial-gradient(1px 1px at 65% 40%, white, transparent),
    radial-gradient(1px 1px at 70% 75%, white, transparent),
    radial-gradient(2px 2px at 85% 20%, white, transparent),
    radial-gradient(1px 1px at 92% 65%, white, transparent),
    radial-gradient(1px 1px at 5% 15%, white, transparent);
  background-size: 200% 200%;
  background-position: 0% 0%, 100% 0%, 50% 50%, 0% 100%, 100% 100%;
  animation: stars 20s linear infinite;
  pointer-events: none;
}

@keyframes stars {
  0% { background-position: 0% 0%, 100% 0%, 50% 50%, 0% 100%, 100% 100%; }
  100% { background-position: 200% 200%, -100% 200%, 150% 150%, 200% -100%, -100% -100%; }
}

.main-title {
  position: relative;
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin: 0;
  margin-bottom: 60px;
  padding-left: 40px;
  z-index: 1;
}

.cards-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  padding: 40px 20px;
  z-index: 1;
  flex-wrap: wrap;
}

.card {
  position: relative;
  width: 200px;
  height: 280px;
  background: #2a2f4f;
  border: 1px solid #a0a0a0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 20px;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
  border-color: #d0d0d0;
}

.book-icon {
  width: 80px;
  height: 80px;
  color: #5a9fd4;
  margin-bottom: 30px;
}

.card-text {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 24px;
  align-items: start;
}

.settings-panel {
  position: relative;
  max-width: 420px;
  margin: 40px auto 0;
  z-index: 1;
}

/* 顶部返回按钮已移除（保留样式占位，避免报错） */

.settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 30px;
  background: rgba(42, 47, 79, 0.8);
  border-radius: 12px;
  border: 1px solid #a0a0a0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.setting-item label {
  font-weight: 600;
  color: white;
  font-size: 1rem;
}

.duration-select,
.question-select {
  padding: 8px 12px;
  border: 2px solid #a0a0a0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #1a1f3a;
  color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.duration-select:focus,
.question-select:focus {
  outline: none;
  border-color: #5a9fd4;
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
  margin-top: 30px;
}

.start-button,
.test-button,
.audio-test-button,
.back-button {
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.start-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.back-button {
  background: rgba(160, 160, 160, 0.3);
  border: 1px solid #a0a0a0;
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

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.back-button:hover {
  background: rgba(160, 160, 160, 0.5);
}

.test-button:hover,
.audio-test-button:hover {
  transform: translateY(-2px);
}

.test-button:hover {
  box-shadow: 0 8px 25px rgba(79, 172, 254, 0.6);
}

.audio-test-button:hover {
  box-shadow: 0 8px 25px rgba(250, 112, 154, 0.6);
}

.start-button:active,
.test-button:active,
.audio-test-button:active,
.back-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-title {
    font-size: 2.5rem;
    padding-left: 20px;
    margin-bottom: 40px;
  }
  
  .cards-container {
    gap: 20px;
    padding: 20px;
  }
  
  .card {
    width: 160px;
    height: 220px;
  }
  
  .book-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 20px;
  }
  
  .card-text {
    font-size: 1rem;
  }
  
  .settings {
    padding: 20px;
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
  .main-title {
    font-size: 2rem;
  }
  
  .cards-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .card {
    width: 100%;
    max-width: 250px;
    height: 200px;
  }
  
  .start-button,
  .test-button,
  .audio-test-button,
  .back-button {
    width: 100%;
    max-width: 250px;
  }
}
</style>
