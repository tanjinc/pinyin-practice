<template>
  <div class="typing-practice-page">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="timer">
        <span class="timer-icon">⏱️</span>
        <span class="timer-text">{{ formatTime(timeLeft) }}</span>
      </div>
      <div class="stats">
        <span class="stat-item">
          <span class="stat-label">正确:</span>
          <span class="stat-value correct">{{ correctCount }}</span>
        </span>
        <span class="stat-item">
          <span class="stat-label">错误:</span>
          <span class="stat-value incorrect">{{ incorrectCount }}</span>
        </span>
      </div>
    </div>

    <!-- 拼音网格练习区域 -->
    <div class="practice-area">
      <div class="pinyin-grid">
        <div
          v-for="(item, index) in gridItems"
          :key="index"
          class="pinyin-item"
          :class="{
            'current': index === currentIndex,
            'correct': completedIndices.includes(index),
            'incorrect': errorIndices.includes(index)
          }"
        >
          <div class="pinyin-text">{{ item.pinyin }}</div>
          <div class="character-text">{{ item.character }}</div>
          <!-- <div class="word-hint" v-if="item.character.length > 1">{{ item.character.length }}个字</div> -->
        </div>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="input-section">
      <input
        ref="inputRef"
        v-model="userInput"
        @input="handleInput"
        @focus="handleInputFocus"
        @keydown.enter.prevent="submitAnswer"
        class="pinyin-input"
        :class="{
          'input-correct': inputStatus === 'correct',
          'input-error': inputStatus === 'error'
        }"
        placeholder="输入当前高亮的拼音..."
        :disabled="isFinished || isPaused"
        autocomplete="off"
      />
      <div class="input-hint" v-if="inputStatus">
        <span v-if="inputStatus === 'correct'" class="hint-correct">✓ 正确！</span>
        <span v-else-if="inputStatus === 'error'" class="hint-error">
          ✗ 错误，正确答案是: {{ currentItem?.pinyin }}
        </span>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button @click="pausePractice" class="action-btn pause-btn" v-if="!isPaused && !isFinished">
        暂停
      </button>
      <button @click="resumePractice" class="action-btn resume-btn" v-if="isPaused && !isFinished">
        继续
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
import typingData from '../data/typingData.json'
import { speechService } from '../services/speechService'
import { audioService } from '../services/audioService'

// 数据类型定义
interface TypingQuestion {
  id: number
  text: string
  pinyin: string
}

interface GridItem {
  pinyin: string
  character: string
  originalText: string
  originalIndex: number
}

// Props
const props = defineProps<{
  duration: number
  questionCount?: number
  speechEnabled?: boolean
  autoPlay?: boolean
}>()

// Events
const emit = defineEmits<{
  finish: [result: {
    totalItems: number
    correctCount: number
    incorrectCount: number
    accuracy: number
    timeUsed: number
    itemsPerMinute: number
  }]
  back: []
}>()

// 状态管理
const gridItems = ref<GridItem[]>([])
const currentIndex = ref(0)
const userInput = ref('')
const timeLeft = ref(props.duration)
const correctCount = ref(0)
const incorrectCount = ref(0)
const completedIndices = ref<number[]>([])
const errorIndices = ref<number[]>([])
const inputStatus = ref<'correct' | 'error' | null>(null)
const isPaused = ref(false)
const isFinished = ref(false)
const startTime = ref(Date.now())
const inputRef = ref<HTMLInputElement>()
const originalViewportHeight = ref(0)

// 语音设置
const speechEnabled = computed(() => props.speechEnabled ?? false)

// 计算属性
const currentItem = computed(() => gridItems.value[currentIndex.value])

// 定时器
let timer: number | null = null

// 将词语作为整体保留，不拆分
const splitTextToItems = (questions: TypingQuestion[]): GridItem[] => {
  const items: GridItem[] = []
  
  questions.forEach((q, qIndex) => {
    // 保持词语完整，不拆分单个字
    items.push({
      pinyin: q.pinyin,
      character: q.text,
      originalText: q.text,
      originalIndex: qIndex
    })
  })
  
  return items
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

// 处理输入框获得焦点（移动端优化）
const handleInputFocus = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
  
  if (!isMobile) return
  
  if (originalViewportHeight.value === 0) {
    originalViewportHeight.value = window.innerHeight
  }
}

// 标准化拼音（移除声调和空格）
const normalizePinyin = (pinyin: string): string => {
  return pinyin
    .toLowerCase()
    .replace(/[áàāǎă]/g, 'a')
    .replace(/[éèēě]/g, 'e')
    .replace(/[íìīǐ]/g, 'i')
    .replace(/[óòōǒ]/g, 'o')
    .replace(/[úùūǔ]/g, 'u')
    .replace(/[ǘǜǚǖ]/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/[ńň]/g, 'n')
    .replace(/[ǹ]/g, 'n')
    .replace(/\s+/g, '')
    .trim()
}

// 处理输入
const handleInput = () => {
  if (!currentItem.value || isFinished.value || isPaused.value) return
  
  inputStatus.value = null
  
  // 按键音效
  audioService.playSfx('type')
  
  const userNormalized = normalizePinyin(userInput.value)
  const correctNormalized = normalizePinyin(currentItem.value.pinyin)
  
  // 实时检查答案
  if (userNormalized.length > 0) {
    if (userNormalized === correctNormalized) {
      inputStatus.value = 'correct'
      // 延迟一下再提交，让用户看到正确反馈
      setTimeout(() => {
        submitAnswer(true)
      }, 300)
    } else if (userNormalized.length >= correctNormalized.length) {
      // 输入长度够了但不对
      inputStatus.value = 'error'
      audioService.playSfx('error')
    }
  }
}

// 提交答案
const submitAnswer = (autoSubmit = false) => {
  if (!currentItem.value || isFinished.value || isPaused.value) return

  const userNormalized = normalizePinyin(userInput.value)
  const correctNormalized = normalizePinyin(currentItem.value.pinyin)
  const isCorrect = userNormalized === correctNormalized

  if (isCorrect) {
    correctCount.value++
    if (!completedIndices.value.includes(currentIndex.value)) {
      completedIndices.value.push(currentIndex.value)
    }
    // 从错误列表中移除
    const errorIdx = errorIndices.value.indexOf(currentIndex.value)
    if (errorIdx > -1) {
      errorIndices.value.splice(errorIdx, 1)
    }
    
    // 播放正确音效
    audioService.playSfx('type')
  } else {
    incorrectCount.value++
    if (!errorIndices.value.includes(currentIndex.value)) {
      errorIndices.value.push(currentIndex.value)
    }
    audioService.playSfx('error')
  }

  // 移动到下一个
  if (isCorrect || autoSubmit) {
    currentIndex.value++
    userInput.value = ''
    inputStatus.value = null
    
    // 检查是否完成
    if (currentIndex.value >= gridItems.value.length) {
      finishPractice()
    } else {
      // 聚焦输入框
      nextTick(() => {
        inputRef.value?.focus()
        // 滚动到当前项目
        scrollToCurrentItem()
      })
    }
  }
}

// 滚动到当前项目
const scrollToCurrentItem = () => {
  nextTick(() => {
    const currentElement = document.querySelector('.pinyin-item.current')
    if (currentElement) {
      currentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
    }
  })
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

// 结束练习
const endPractice = () => {
  if (!isFinished.value) {
    finishPractice()
  } else {
    emit('back')
  }
}

// 完成练习
const finishPractice = () => {
  isFinished.value = true
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  const totalItems = gridItems.value.length
  const accuracy = totalItems > 0 ? (correctCount.value / totalItems) * 100 : 0
  const timeUsed = props.duration - timeLeft.value
  const itemsPerMinute = timeUsed > 0 ? (totalItems / timeUsed) * 60 : 0

  emit('finish', {
    totalItems,
    correctCount: correctCount.value,
    incorrectCount: incorrectCount.value,
    accuracy,
    timeUsed,
    itemsPerMinute
  })
}

// 初始化数据
const initializeData = () => {
  const allQuestions = typingData as TypingQuestion[]
  const count = props.questionCount || 14 // 默认14个词语，可以填满两行
  
  // 随机选择题目
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, allQuestions.length))
  
  // 转换为网格项目
  gridItems.value = splitTextToItems(selected)
}

// 生命周期
onMounted(() => {
  initializeData()
  startTimer()
  nextTick(() => {
    inputRef.value?.focus()
    scrollToCurrentItem()
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
.typing-practice-page {
  min-height: 100vh;
  background: #1a1a1a;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
  position: sticky;
  top: 0;
  z-index: 20;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  color: #e74c3c;
}

.timer-icon {
  font-size: 1.2rem;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.stat-label {
  color: #b0b0b0;
}

.stat-value {
  font-weight: 600;
  font-size: 1rem;
}

.stat-value.correct {
  color: #27ae60;
}

.stat-value.incorrect {
  color: #e74c3c;
}

.practice-area {
  flex: 1;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
}

.pinyin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px 50px;
  max-width: 1200px;
  width: 100%;
}

  .pinyin-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    transition: all 0.3s ease;
    min-width: 140px;
  }

  .pinyin-text {
    font-family: 'Courier New', monospace;
    font-size: 1.4rem;
    font-weight: 500;
    color: #e0e0e0;
    text-align: center;
    padding: 8px 12px;
    border-radius: 4px;
    background: transparent;
    transition: all 0.3s ease;
    word-break: break-all;
    line-height: 1.3;
  }

.character-text {
  font-size: 2rem;
  font-weight: 500;
  color: #e0e0e0;
  text-align: center;
  word-break: keep-all;
  white-space: nowrap;
}

.word-hint {
  font-size: 0.7rem;
  color: #888;
  margin-top: 4px;
  opacity: 0.6;
}

.pinyin-item.current .pinyin-text {
  background: #4a4a4a;
  border-bottom: 3px solid #ff6b9d;
}

.pinyin-item.correct .pinyin-text {
  color: #27ae60;
}

.pinyin-item.correct .character-text {
  color: #27ae60;
}

.pinyin-item.incorrect .pinyin-text {
  color: #e74c3c;
}

.pinyin-item.incorrect .character-text {
  color: #e74c3c;
  text-decoration: line-through;
}

.input-section {
  padding: 20px 30px;
  background: #2a2a2a;
  border-top: 1px solid #3a3a3a;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.pinyin-input {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: block;
  padding: 14px 20px;
  font-size: 1.3rem;
  font-family: 'Courier New', monospace;
  text-align: center;
  background: #1a1a1a;
  border: 2px solid #4a4a4a;
  border-radius: 8px;
  color: #e0e0e0;
  outline: none;
  transition: all 0.3s ease;
}

.pinyin-input:focus {
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.pinyin-input.input-correct {
  border-color: #27ae60;
  background: #1a2e1a;
}

.pinyin-input.input-error {
  border-color: #e74c3c;
  background: #2e1a1a;
}

.input-hint {
  margin-top: 12px;
  text-align: center;
  min-height: 24px;
  font-size: 0.95rem;
}

.hint-correct {
  color: #27ae60;
  font-weight: 600;
}

.hint-error {
  color: #e74c3c;
  font-weight: 600;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background: #2a2a2a;
  border-top: 1px solid #3a3a3a;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.pause-btn,
.resume-btn {
  background: #f39c12;
}

.restart-btn {
  background: #3498db;
}

.end-btn {
  background: #e74c3c;
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
  background: #2a2a2a;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.pause-content h3 {
  margin: 0 0 15px 0;
  color: #e0e0e0;
  font-size: 1.5rem;
}

.pause-content p {
  margin: 0;
  color: #b0b0b0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .pinyin-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 15px 20px;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }

  .stats {
    gap: 15px;
  }

  .practice-area {
    padding: 20px 15px;
  }

  .pinyin-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
  }

  .pinyin-item {
    min-width: auto;
    padding: 10px;
  }

  .pinyin-text {
    font-size: 1.2rem;
    padding: 6px 10px;
  }

  .character-text {
    font-size: 1.6rem;
  }

  .input-section {
    padding: 15px 20px;
  }

  .pinyin-input {
    font-size: 1.1rem;
    padding: 12px 16px;
  }

  .bottom-actions {
    flex-wrap: wrap;
    gap: 10px;
  }

  .action-btn {
    flex: 1;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .pinyin-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .pinyin-item {
    padding: 8px;
  }

  .pinyin-text {
    font-size: 1rem;
    padding: 5px 8px;
  }

  .character-text {
    font-size: 1.4rem;
  }

  .input-section {
    padding: 12px 15px;
  }

  .pinyin-input {
    font-size: 1rem;
    padding: 10px 14px;
  }

  @supports (-webkit-touch-callout: none) {
    .practice-area {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}
</style>
