<template>
  <div class="component-practice-page">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="status-items">
        <div class="status-item">
          <span class="status-icon">🔄</span>
          <span class="status-text">重打</span>
        </div>
        <div class="status-item">
          <span class="status-icon">👁️</span>
          <span class="status-text">跟读已开</span>
        </div>
        <div class="status-item">
          <span class="status-icon">✋</span>
          <span class="status-text">指法已关</span>
        </div>
      </div>
      
      <div class="practice-title">
        {{ practiceTitle }}
      </div>
      
      <div class="timer-display">
        <span class="timer-text">{{ formatTime(timeLeft) }}</span>
      </div>
    </div>

    <!-- 主练习区域 -->
    <div class="practice-area">
      <!-- 拼音组件网格显示 -->
      <div class="component-grid">
        <div 
          v-for="(component, index) in displayComponents" 
          :key="component"
          class="component-item"
          :class="{
            'current': index === currentIndex,
            'correct': completedComponents.includes(component) && !errorComponents.includes(component),
            'error': errorComponents.includes(component),
            'completed': completedComponents.includes(component)
          }"
        >
          {{ component }}
        </div>
      </div>

      <!-- 当前练习信息 -->
      <div class="current-info" v-if="currentComponent">
        <div class="current-component-container">
          <div class="current-component">{{ currentComponent.component }}</div>
          <button 
            v-if="speechEnabled && currentComponent"
            @click="playComponentSound"
            class="component-sound-button"
            :disabled="isPlaying"
            title="播放拼音组件发音"
          >
            🔊
          </button>
        </div>
        <div class="examples">
          <div class="pronunciation-info">
            <span class="pronunciation-label">发音：</span>
            <span class="pronunciation-text">{{ getPronunciation(currentComponent.component) }}</span>
          </div>
          <div class="examples-info">
            <span class="examples-label">示例：</span>
            <span 
              v-for="(example, index) in currentComponent.examples.slice(0, 3)" 
              :key="example"
              class="example-char"
            >
              {{ example }}{{ index < 2 ? '、' : '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-section">
        <input
          ref="inputRef"
          v-model="userInput"
          @input="handleInput"
          @keydown.enter="submitAnswer"
          @keydown.space.prevent="submitAnswer"
          class="component-input"
          :class="{ 
            'input-correct': inputStatus === 'correct',
            'input-error': inputStatus === 'error'
          }"
          placeholder="输入拼音组件..."
          :disabled="isFinished || isPaused"
        />
        
        <div class="input-hint">
          <span v-if="inputStatus === 'correct'" class="hint-correct">
            ✓ 正确！
            <button 
              v-if="speechEnabled && currentComponent"
              @click="playComponentSound"
              class="hint-sound-button"
              :disabled="isPlaying"
              title="播放拼音组件发音"
            >
              🔊
            </button>
          </span>
          <span v-else-if="inputStatus === 'error'" class="hint-error">
            ✗ 错误，正确答案是：{{ currentComponent?.component }}
            <button 
              v-if="speechEnabled && currentComponent"
              @click="playComponentSound"
              class="hint-sound-button"
              :disabled="isPlaying"
              title="播放正确拼音组件发音"
            >
              🔊
            </button>
          </span>
          <span v-else class="hint-normal">
            请输入当前高亮的拼音组件
          </span>
        </div>
      </div>

      <!-- 进度信息 -->
      <div class="progress-info">
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-label">进度:</span>
            <span class="stat-value">{{ currentIndex + 1 }} / {{ displayComponents.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">正确:</span>
            <span class="stat-value correct">{{ correctCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">错误:</span>
            <span class="stat-value error">{{ errorCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">准确率:</span>
            <span class="stat-value">{{ accuracy.toFixed(1) }}%</span>
          </div>
        </div>
        
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${((currentIndex + 1) / displayComponents.length) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button @click="pausePractice" class="action-btn pause-btn" v-if="!isPaused && !isFinished">
        暂停练习
      </button>
      <button @click="resumePractice" class="action-btn resume-btn" v-if="isPaused && !isFinished">
        继续练习
      </button>
      <button @click="restartPractice" class="action-btn restart-btn">
        重新开始
      </button>
      <button @click="endPractice" class="action-btn end-btn">
        结束练习
      </button>
    </div>

    <!-- 暂停遮罩 -->
    <div v-if="isPaused" class="pause-overlay">
      <div class="pause-content">
        <h3>练习已暂停</h3>
        <p>点击继续按钮恢复练习</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { getAllInitials, getAllFinals, getAllOverallSyllables, type PinyinComponent } from '../data/pinyinData'
import { speechService, pinyinPronunciationMap } from '../services/speechService'
import { audioService } from '../services/audioService'

// Props
const props = defineProps<{
  practiceMode: 'initial' | 'final' | 'overall'
  duration: number
  speechEnabled?: boolean
  autoPlay?: boolean
  randomize?: boolean
}>()

// Events
const emit = defineEmits<{
  finish: [result: {
    mode: 'initial' | 'final' | 'overall'
    totalComponents: number
    correctCount: number
    errorCount: number
    accuracy: number
    timeUsed: number
    componentsPerMinute: number
    completedComponents: string[]
    errorComponents: string[]
  }]
  back: []
}>()

// 状态管理
const currentIndex = ref(0)
const userInput = ref('')
const timeLeft = ref(props.duration)
const correctCount = ref(0)
const errorCount = ref(0)
const completedComponents = ref<string[]>([])
const errorComponents = ref<string[]>([])
const inputStatus = ref<'correct' | 'error' | null>(null)
const isPaused = ref(false)
const isFinished = ref(false)
const startTime = ref(Date.now())
const inputRef = ref<HTMLInputElement>()
const isPlaying = ref(false)

// 语音设置
const speechEnabled = computed(() => props.speechEnabled ?? false)
const autoPlay = computed(() => props.autoPlay ?? false)

// 标题与组件列表
const practiceTitle = computed(() => {
  if (props.practiceMode === 'initial') return '声母练习'
  if (props.practiceMode === 'final') return '韵母练习'
  return '整体认读音节练习'
})

// 获取显示的组件列表
const displayComponents = computed(() => {
    return components.value.map(item => item.component)
})

const components = computed(() => {
  let base: PinyinComponent[]
  if (props.practiceMode === 'initial') {
    base = getAllInitials()
  } else if (props.practiceMode === 'final') {
    base = getAllFinals()
  } else {
    base = getAllOverallSyllables()
  }
  if (props.randomize) {
    const arr: PinyinComponent[] = [...base]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const t = arr[i]!
      arr[i] = arr[j]!
      arr[j] = t
    }
    return arr;
  }
  return base
})

// 当前组件
const currentComponent = computed(() => {
  const component = components.value[currentIndex.value]
  if (!component) return null
  
  return {
    component: component.component,
    type: props.practiceMode,
    examples: component.examples || []
  }
})

// 准确率
const accuracy = computed(() => {
  const total = correctCount.value + errorCount.value
  return total > 0 ? (correctCount.value / total) * 100 : 0
})

// 定时器
let timer: number | null = null

// 播放拼音组件发音
const playComponentSound = async () => {
  if (!currentComponent.value || isPlaying.value) return
  
  isPlaying.value = true
  try {
    await speechService.speakComponent(currentComponent.value.component)
  } finally {
    isPlaying.value = false
  }
}

// 获取拼音组件的发音
const getPronunciation = (component: string): string => {
  return pinyinPronunciationMap[component] || component
}

// 自动播放新组件
const autoPlayNewComponent = async () => {
  if (autoPlay.value && currentComponent.value && !isPaused.value && !isFinished.value) {
    // 延迟一点时间再播放，让用户有时间看到新组件
    setTimeout(async () => {
      if (currentComponent.value && !isPaused.value && !isFinished.value) {
        await playComponentSound()
      }
    }, 500)
  }
}

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 开始计时器
const startTimer = () => {
  timer = window.setInterval(() => {
    if (!isPaused.value && !isFinished.value) {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        finishPractice()
      }
    }
  }, 1000)
}

// 处理输入
const handleInput = () => {
  inputStatus.value = null
  // 按键音效
  audioService.playSfx('type')

  if (userInput.value && currentComponent.value) {
    let correct = userInput.value.toLowerCase().trim() === currentComponent.value.component.toLowerCase()

    // 当输入长度匹配时进行检查
    if (userInput.value.length >= currentComponent.value.component.length) {
        if (currentComponent.value.component.toLowerCase().includes('ü')) {
            correct = userInput.value.toLowerCase().trim().startsWith('v');
        }
      if (correct) {
        inputStatus.value = 'correct'
        setTimeout(() => {
          submitAnswer()
        }, 300)
      } else {
        inputStatus.value = 'error'
        // 错误音效
        audioService.playSfx('error')
      }
    }
  }
}

// 提交答案
const submitAnswer = () => {
  if (!currentComponent.value || isFinished.value) return

  let isCorrect = userInput.value.toLowerCase().trim() === currentComponent.value.component.toLowerCase()
  if (currentComponent.value.component.toLowerCase() === 'ü') {
    isCorrect = userInput.value.toLowerCase().trim() === 'v'
  }
  const component = currentComponent.value.component

  // 记录结果
  if (isCorrect) {
    correctCount.value++
    if (!completedComponents.value.includes(component)) {
      completedComponents.value.push(component)
    }
    // 从错误列表中移除（如果之前错过）
    const errorIndex = errorComponents.value.indexOf(component)
    if (errorIndex > -1) {
      errorComponents.value.splice(errorIndex, 1)
    }
  } else {
    errorCount.value++
    if (!errorComponents.value.includes(component)) {
      errorComponents.value.push(component)
    }
  }

  // 移动到下一个组件
  currentIndex.value++
  userInput.value = ''
  inputStatus.value = null

  // 检查是否完成所有组件
  if (currentIndex.value >= displayComponents.value.length) {
    finishPractice()
  } else {
    // 聚焦输入框
    nextTick(() => {
      inputRef.value?.focus()
    })
    // 自动播放新组件
    autoPlayNewComponent()
  }
}

// 暂停练习
const pausePractice = () => {
  isPaused.value = true
}

// 恢复练习
const resumePractice = () => {
  isPaused.value = false
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 重新开始练习
const restartPractice = () => {
  currentIndex.value = 0
  userInput.value = ''
  timeLeft.value = props.duration
  correctCount.value = 0
  errorCount.value = 0
  completedComponents.value = []
  errorComponents.value = []
  inputStatus.value = null
  isPaused.value = false
  isFinished.value = false
  startTime.value = Date.now()
  
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 结束练习
const endPractice = () => {
  emit('back')
}

// 完成练习
const finishPractice = () => {
  isFinished.value = true
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  const timeUsed = props.duration - timeLeft.value
  const componentsPerMinute = timeUsed > 0 ? (completedComponents.value.length / timeUsed) * 60 : 0

  emit('finish', {
    mode: props.practiceMode,
    totalComponents: displayComponents.value.length,
    correctCount: correctCount.value,
    errorCount: errorCount.value,
    accuracy: accuracy.value,
    timeUsed,
    componentsPerMinute,
    completedComponents: completedComponents.value,
    errorComponents: errorComponents.value
  })
}

// 监听当前组件变化，自动播放
watch(currentComponent, () => {
  if (currentComponent.value && autoPlay.value) {
    autoPlayNewComponent()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  startTimer()
  nextTick(() => {
    inputRef.value?.focus()
  })
  
  // 设置语音服务
  speechService.setEnabled(speechEnabled.value)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.component-practice-page {
  min-height: 100vh;
  background: #2c3e50;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: #34495e;
  border-bottom: 1px solid #4a5f7a;
}

.status-items {
  display: flex;
  gap: 25px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #bdc3c7;
}

.status-icon {
  font-size: 1rem;
}

.practice-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #3498db;
}

.timer-display {
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: #e74c3c;
}

.practice-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 40px;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 20px;
  max-width: 800px;
  width: 100%;
  justify-items: center;
}

.component-item {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  background: #34495e;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.component-item.current {
  background: #f39c12;
  color: #2c3e50;
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(243, 156, 18, 0.4);
}

.component-item.correct {
  background: #27ae60;
  color: white;
}

.component-item.error {
  background: #34495e;
  border-bottom: 3px solid #e74c3c;
  color: #e74c3c;
}

.component-item.completed {
  opacity: 0.7;
}

.current-info {
  text-align: center;
  margin: 20px 0;
}

.current-component-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 15px;
}

.current-component {
  font-size: 4rem;
  font-weight: 700;
  color: #f39c12;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.component-sound-button {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.component-sound-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(243, 156, 18, 0.4);
}

.component-sound-button:active:not(:disabled) {
  transform: translateY(0);
}

.component-sound-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 1.1rem;
  color: #bdc3c7;
}

.pronunciation-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pronunciation-label {
  color: #95a5a6;
  font-size: 1rem;
}

.pronunciation-text {
  color: #f39c12;
  font-weight: 600;
  font-size: 1.2rem;
  background: rgba(243, 156, 18, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(243, 156, 18, 0.3);
}

.examples-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.examples-label {
  color: #95a5a6;
  font-size: 1rem;
}

.example-char {
  color: #3498db;
  font-weight: 500;
}

.input-section {
  text-align: center;
  width: 100%;
  max-width: 400px;
}

.component-input {
  width: 100%;
  padding: 15px 20px;
  font-size: 1.5rem;
  text-align: center;
  background: #34495e;
  border: 2px solid #4a5f7a;
  border-radius: 12px;
  color: #ecf0f1;
  outline: none;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
}

.component-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.component-input.input-correct {
  border-color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
}

.component-input.input-error {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.input-hint {
  margin-top: 15px;
  min-height: 30px;
  font-size: 1rem;
}

.hint-correct {
  color: #27ae60;
  font-weight: 600;
}

.hint-error {
  color: #e74c3c;
  font-weight: 600;
}

.hint-normal {
  color: #bdc3c7;
}

.hint-sound-button {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  margin-left: 8px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: inherit;
}

.hint-sound-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.hint-sound-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-info {
  width: 100%;
  max-width: 600px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #95a5a6;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ecf0f1;
}

.stat-value.correct {
  color: #27ae60;
}

.stat-value.error {
  color: #e74c3c;
}

.progress-bar {
  height: 8px;
  background: #4a5f7a;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background: #34495e;
  border-top: 1px solid #4a5f7a;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pause-btn, .resume-btn {
  background: #f39c12;
  color: white;
}

.restart-btn {
  background: #3498db;
  color: white;
}

.end-btn {
  background: #e74c3c;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.pause-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pause-content {
  background: #34495e;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.pause-content h3 {
  margin: 0 0 15px 0;
  color: #ecf0f1;
  font-size: 1.5rem;
}

.pause-content p {
  margin: 0;
  color: #bdc3c7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }
  
  .status-items {
    gap: 15px;
  }
  
  .component-grid {
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 15px;
  }
  
  .component-item {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .current-component {
    font-size: 3rem;
  }
  
  .component-input {
    font-size: 1.2rem;
    padding: 12px 16px;
  }
  
  .progress-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .bottom-actions {
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    min-width: 120px;
  }
}

@media (max-width: 480px) {
  .component-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .component-item {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
  
  .current-component {
    font-size: 2.5rem;
  }
  
  .progress-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
