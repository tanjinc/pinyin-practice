<template>
  <div class="practice-page">
    <div class="container">
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="timer">
          <div class="timer-icon">⏱️</div>
          <div class="timer-text">{{ formatTime(timeLeft) }}</div>
        </div>
        <div class="progress">
          <div class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${((currentIndex + 1) / questions.length) * 100}%` }"
            ></div>
          </div>
        </div>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">正确:</span>
            <span class="stat-value correct">{{ correctCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">错误:</span>
            <span class="stat-value incorrect">{{ incorrectCount }}</span>
          </div>
        </div>
      </div>

      <!-- 主要练习区域 -->
      <div class="practice-area">
        <div class="question-display" ref="questionDisplayRef">
          <div class="character-container">
            <div class="character">{{ currentQuestion?.character }}</div>
            <button 
              v-if="speechEnabled && currentQuestion"
              @click="playCharacterSound"
              class="sound-button"
              :disabled="isPlaying"
              title="播放汉字发音"
            >
              🔊
            </button>
          </div>
          <div class="hint">请输入拼音</div>
        </div>

        <div class="input-area">
          <input
            ref="inputRef"
            v-model="userInput"
            @input="handleInput"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            @keydown.enter="submitAnswer"
            class="pinyin-input"
            :class="{ 
              'correct': inputStatus === 'correct',
              'incorrect': inputStatus === 'incorrect'
            }"
            placeholder="输入拼音..."
            :disabled="isFinished"
          />
          <div class="input-feedback" v-if="inputStatus">
            <div v-if="inputStatus === 'correct'" class="feedback correct">
              ✓ 正确！
              <button 
                v-if="speechEnabled && currentQuestion"
                @click="playPinyinSound"
                class="feedback-sound-button"
                :disabled="isPlaying"
                title="播放拼音发音"
              >
                🔊
              </button>
            </div>
            <div v-else-if="inputStatus === 'incorrect'" class="feedback incorrect">
              ✗ 错误，正确答案是: {{ currentQuestion?.pinyin }}
              <button 
                v-if="speechEnabled && currentQuestion"
                @click="playPinyinSound"
                class="feedback-sound-button"
                :disabled="isPlaying"
                title="播放正确拼音发音"
              >
                🔊
              </button>
            </div>
          </div>
        </div>

        <!-- 答案历史 -->
        <div class="answer-history" v-if="answerHistory.length > 0">
          <div class="history-title">最近答题:</div>
          <div class="history-list">
            <div 
              v-for="(answer, index) in answerHistory.slice(-5)" 
              :key="index"
              class="history-item"
              :class="{ 'correct': answer.isCorrect, 'incorrect': !answer.isCorrect }"
            >
              <span class="history-character">{{ answer.character }}</span>
              <span class="history-pinyin">{{ answer.userAnswer }}</span>
              <span class="history-result">{{ answer.isCorrect ? '✓' : '✗' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="actions">
        <button @click="pausePractice" class="action-button secondary" v-if="!isPaused && !isFinished">
          暂停
        </button>
        <button @click="resumePractice" class="action-button primary" v-if="isPaused && !isFinished">
          继续
        </button>
        <button @click="endPractice" class="action-button danger">
          结束练习
        </button>
      </div>
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
import type { PinyinQuestion } from '../data/pinyinData'
import { speechService } from '../services/speechService'
import { audioService } from '../services/audioService'

// Props
const props = defineProps<{
  questions: PinyinQuestion[]
  duration: number
  speechEnabled?: boolean
  autoPlay?: boolean
}>()

// Events
const emit = defineEmits<{
  finish: [result: {
    totalQuestions: number
    correctCount: number
    incorrectCount: number
    accuracy: number
    timeUsed: number
    answersPerMinute: number
    answerHistory: Array<{
      character: string
      correctAnswer: string
      userAnswer: string
      isCorrect: boolean
      timeSpent: number
    }>
  }]
}>()

// 状态管理
const currentIndex = ref(0)
const userInput = ref('')
const timeLeft = ref(props.duration)
const correctCount = ref(0)
const incorrectCount = ref(0)
const inputStatus = ref<'correct' | 'incorrect' | null>(null)
const isPaused = ref(false)
const isFinished = ref(false)
const startTime = ref(Date.now())
const inputRef = ref<HTMLInputElement>()
const isPlaying = ref(false)
const questionDisplayRef = ref<HTMLElement>()
const originalViewportHeight = ref(0)

// 语音设置
const speechEnabled = computed(() => props.speechEnabled ?? false)
const autoPlay = computed(() => props.autoPlay ?? false)

// 答题历史
const answerHistory = ref<Array<{
  character: string
  correctAnswer: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
}>>([])

// 计算属性
const currentQuestion = computed(() => props.questions[currentIndex.value])

// 定时器
let timer: number | null = null

// 播放汉字发音
const playCharacterSound = async () => {
  if (!currentQuestion.value || isPlaying.value) return
  
  isPlaying.value = true
  try {
    // 传递拼音和声调信息给语音服务
    await speechService.speakCharacter(
      currentQuestion.value.character,
      currentQuestion.value.pinyin,
      currentQuestion.value.tone
    )
  } finally {
    isPlaying.value = false
  }
}

// 播放拼音发音
const playPinyinSound = async () => {
  if (!currentQuestion.value || isPlaying.value) return
  
  isPlaying.value = true
  try {
    await speechService.speakPinyin(currentQuestion.value.pinyin, currentQuestion.value.tone)
  } finally {
    isPlaying.value = false
  }
}

// 自动播放新题目
const autoPlayNewQuestion = async () => {
  if (autoPlay.value && currentQuestion.value && !isPaused.value && !isFinished.value) {
    // 延迟一点时间再播放，让用户有时间看到新题目
    setTimeout(async () => {
      if (currentQuestion.value && !isPaused.value && !isFinished.value) {
        await playCharacterSound()
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

// 处理输入框获得焦点（移动端优化）
const handleInputFocus = () => {
  // 只在移动设备上执行滚动优化
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
  
  if (!isMobile) return
  
  // 保存初始视口高度
  if (originalViewportHeight.value === 0) {
    originalViewportHeight.value = window.innerHeight
  }
  
  // 延迟执行，确保键盘弹出后再调整
  setTimeout(() => {
    // 检查键盘是否弹出（视口高度是否减小）
    const currentHeight = window.innerHeight
    if (currentHeight < originalViewportHeight.value * 0.75 && questionDisplayRef.value) {
      // 使用更温和的滚动方式
      questionDisplayRef.value.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
    }
  }, 300)
}

// 处理输入框失去焦点
const handleInputBlur = () => {
  // 键盘收起后可以恢复滚动位置（如果需要）
}

// 处理输入
const handleInput = () => {
  inputStatus.value = null
  // 输入按键音效
  audioService.playSfx('type')
  
  // 实时检查答案
  if (userInput.value && currentQuestion.value) {
    const correct = userInput.value.toLowerCase().trim() === currentQuestion.value.pinyin.toLowerCase()
    if (userInput.value.length >= currentQuestion.value.pinyin.length) {
      if (correct) {
        inputStatus.value = 'correct'
        setTimeout(() => {
          submitAnswer()
        }, 500)
      } else {
        inputStatus.value = 'incorrect'
        // 错误音效
        audioService.playSfx('error')
      }
    }
  }
}

// 提交答案
const submitAnswer = () => {
  if (!currentQuestion.value || isFinished.value) return

  const isCorrect = userInput.value.toLowerCase().trim() === currentQuestion.value.pinyin.toLowerCase()
  const timeSpent = Date.now() - startTime.value

  // 记录答题历史
  answerHistory.value.push({
    character: currentQuestion.value.character,
    correctAnswer: currentQuestion.value.pinyin,
    userAnswer: userInput.value.trim(),
    isCorrect,
    timeSpent
  })

  // 更新统计
  if (isCorrect) {
    correctCount.value++
  } else {
    incorrectCount.value++
  }

  // 移动到下一题
  currentIndex.value++
  userInput.value = ''
  inputStatus.value = null
  startTime.value = Date.now()

  // 检查是否完成所有题目
  if (currentIndex.value >= props.questions.length) {
    finishPractice()
  } else {
    // 聚焦输入框
    nextTick(() => {
      inputRef.value?.focus()
    })
    // 自动播放新题目
    autoPlayNewQuestion()
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

// 结束练习
const endPractice = () => {
  finishPractice()
}

// 完成练习
const finishPractice = () => {
  isFinished.value = true
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  const totalQuestions = answerHistory.value.length
  const accuracy = totalQuestions > 0 ? (correctCount.value / totalQuestions) * 100 : 0
  const timeUsed = props.duration - timeLeft.value
  const answersPerMinute = timeUsed > 0 ? (totalQuestions / timeUsed) * 60 : 0

  emit('finish', {
    totalQuestions,
    correctCount: correctCount.value,
    incorrectCount: incorrectCount.value,
    accuracy,
    timeUsed,
    answersPerMinute,
    answerHistory: answerHistory.value
  })
}

// 监听当前题目变化，自动播放
watch(currentQuestion, () => {
  if (currentQuestion.value && autoPlay.value) {
    autoPlayNewQuestion()
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
.practice-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
  position: relative;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.status-bar {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2d3748;
}

.timer-icon {
  font-size: 1.2rem;
}

.timer-text {
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-text {
  text-align: center;
  font-weight: 600;
  color: #4a5568;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  transition: width 0.3s ease;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
}

.stat-value {
  font-weight: 700;
  font-size: 1rem;
}

.stat-value.correct {
  color: #38a169;
}

.stat-value.incorrect {
  color: #e53e3e;
}

.practice-area {
  text-align: center;
  margin-bottom: 40px;
  scroll-margin-top: 20px;
}

.question-display {
  scroll-margin-top: 20px;
  margin-bottom: 40px;
}

.character-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
}

.character {
  font-size: 6rem;
  font-weight: 700;
  color: #2d3748;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.sound-button {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sound-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.sound-button:active:not(:disabled) {
  transform: translateY(0);
}

.sound-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.hint {
  font-size: 1.2rem;
  color: #718096;
  margin-bottom: 20px;
}

.input-area {
  margin-bottom: 30px;
}

.pinyin-input {
  width: 100%;
  max-width: 300px;
  padding: 16px 20px;
  font-size: 1.5rem;
  text-align: center;
  border: 3px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
}

.pinyin-input:focus {
  border-color: #4facfe;
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.pinyin-input.correct {
  border-color: #38a169;
  background-color: #f0fff4;
}

.pinyin-input.incorrect {
  border-color: #e53e3e;
  background-color: #fff5f5;
}

.input-feedback {
  margin-top: 15px;
  min-height: 30px;
}

.feedback {
  font-size: 1.1rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  display: inline-block;
}

.feedback.correct {
  color: #38a169;
  background: #f0fff4;
}

.feedback.incorrect {
  color: #e53e3e;
  background: #fff5f5;
}

.feedback-sound-button {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  margin-left: 8px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.feedback-sound-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.feedback-sound-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.answer-history {
  margin-top: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.history-title {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 15px;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.history-item.correct {
  background: #f0fff4;
  color: #38a169;
}

.history-item.incorrect {
  background: #fff5f5;
  color: #e53e3e;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button.primary {
  background: #4facfe;
  color: white;
}

.action-button.secondary {
  background: #718096;
  color: white;
}

.action-button.danger {
  background: #e53e3e;
  color: white;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  background: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.pause-content h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 1.5rem;
}

.pause-content p {
  margin: 0;
  color: #718096;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .practice-page {
    padding: 10px;
    min-height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .container {
    padding: 15px;
    margin: 0;
    border-radius: 12px;
  }
  
  .status-bar {
    grid-template-columns: 1fr;
    gap: 12px;
    text-align: center;
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .practice-area {
    margin-bottom: 20px;
  }

  .question-display {
    margin-bottom: 20px;
  }
  
  .character {
    font-size: 3.5rem;
  }
  
  .input-area {
    margin-bottom: 15px;
  }

  .pinyin-input {
    font-size: 1.2rem;
    max-width: 250px;
    padding: 14px 18px;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  .action-button {
    width: 100%;
    max-width: 250px;
  }

  /* 键盘弹出时的优化 */
  .container {
    padding-bottom: 10px;
  }
}

@media (max-width: 480px) {
  .practice-page {
    padding: 8px;
  }

  .container {
    padding: 12px;
  }

  .status-bar {
    padding: 12px;
    margin-bottom: 15px;
  }

  .practice-area {
    margin-bottom: 15px;
  }

  .question-display {
    margin-bottom: 15px;
  }

  .character {
    font-size: 3rem;
  }

  .character-container {
    gap: 12px;
  }

  .sound-button {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
  
  .input-area {
    margin-bottom: 12px;
  }

  .pinyin-input {
    font-size: 1.1rem;
    max-width: 100%;
    padding: 12px 16px;
  }
  
  .history-list {
    flex-direction: column;
  }

  /* 键盘弹出时确保内容可见 */
  @supports (-webkit-touch-callout: none) {
    .practice-area {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}
</style>
