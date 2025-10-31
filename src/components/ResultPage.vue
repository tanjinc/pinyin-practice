<template>
  <div class="result-page">
    <div class="container">
      <div class="header">
        <div class="trophy-icon">🏆</div>
        <h1 class="title">练习完成！</h1>
        <p class="subtitle">查看你的成绩表现</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{{ (safeResult.accuracy ?? 0).toFixed(1) }}%</div>
          <div class="stat-label">准确率</div>
        </div>
        
        <div class="stat-card secondary">
          <div class="stat-icon">⚡</div>
          <div class="stat-value">{{ (safeResult.answersPerMinute ?? 0).toFixed(1) }}</div>
          <div class="stat-label">答题/分钟</div>
        </div>
        
        <div class="stat-card success">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ safeResult.correctCount }}</div>
          <div class="stat-label">正确题数</div>
        </div>
        
        <div class="stat-card danger">
          <div class="stat-icon">❌</div>
          <div class="stat-value">{{ safeResult.incorrectCount }}</div>
          <div class="stat-label">错误题数</div>
        </div>
      </div>

      <div class="time-info">
        <div class="time-item">
          <span class="time-label">用时:</span>
          <span class="time-value">{{ formatTime(safeResult.timeUsed ?? 0) }}</span>
        </div>
        <div class="time-item">
          <span class="time-label">总题数:</span>
          <span class="time-value">{{ safeResult.totalQuestions }}</span>
        </div>
      </div>

      <!-- 成绩评价 -->
      <div class="performance-rating">
        <div class="rating-icon">{{ getRatingIcon() }}</div>
        <div class="rating-text">{{ getRatingText() }}</div>
        <div class="rating-description">{{ getRatingDescription() }}</div>
      </div>

      <!-- 错题回顾 -->
      <div class="mistakes-review" v-if="mistakes.length > 0">
        <h3 class="mistakes-title">错题回顾</h3>
        <div class="mistakes-list">
          <div 
            v-for="(mistake, index) in mistakes" 
            :key="index"
            class="mistake-item"
          >
            <div class="mistake-character">{{ mistake.character }}</div>
            <div class="mistake-details">
              <div class="mistake-row">
                <span class="mistake-label">你的答案:</span>
                <span class="mistake-wrong">{{ mistake.userAnswer || '(未答)' }}</span>
              </div>
              <div class="mistake-row">
                <span class="mistake-label">正确答案:</span>
                <span class="mistake-correct">{{ mistake.correctAnswer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 答题历史图表 -->
      <div class="history-chart" v-if="safeResult.answerHistory.length > 0">
        <h3 class="chart-title">答题趋势</h3>
        <div class="chart-container">
          <div 
            v-for="(answer, index) in safeResult.answerHistory" 
            :key="index"
            class="chart-bar"
            :class="{ 'correct': answer.isCorrect, 'incorrect': !answer.isCorrect }"
            :style="{ height: `${(answer.timeSpent / maxTime) * 100}%` }"
            :title="`${answer.character}: ${answer.isCorrect ? '正确' : '错误'} (${(answer.timeSpent / 1000).toFixed(1)}s)`"
          ></div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color correct"></div>
            <span>正确</span>
          </div>
          <div class="legend-item">
            <div class="legend-color incorrect"></div>
            <span>错误</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="restartPractice" class="action-button primary">
          再练一次
        </button>
        <button @click="backToHome" class="action-button secondary">
          返回首页
        </button>
        <button @click="shareResult" class="action-button share">
          分享成绩
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = defineProps<{
  result: {
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
  }
}>()

// 安全默认值，防止未传或字段缺失导致渲染报错
const defaultResult = {
  totalQuestions: 0,
  correctCount: 0,
  incorrectCount: 0,
  accuracy: 0,
  timeUsed: 0,
  answersPerMinute: 0,
  answerHistory: [] as Array<{
    character: string
    correctAnswer: string
    userAnswer: string
    isCorrect: boolean
    timeSpent: number
  }>
}

const safeResult = computed(() => {
  const base = props.result ?? (defaultResult as typeof defaultResult)
  return {
    ...defaultResult,
    ...base,
    answerHistory: Array.isArray(base.answerHistory) ? base.answerHistory : []
  }
})

// Events
const emit = defineEmits<{
  restart: []
  backToHome: []
}>()

// 计算错题
const mistakes = computed(() => 
  safeResult.value.answerHistory.filter(answer => !answer.isCorrect)
)

// 计算最大用时（用于图表）
const maxTime = computed(() => 
  Math.max(...safeResult.value.answerHistory.map(answer => answer.timeSpent), 1000)
)

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

// 获取成绩评价
const getRatingIcon = (): string => {
  const accuracy = safeResult.value.accuracy
  if (accuracy >= 95) return '🌟'
  if (accuracy >= 85) return '🎉'
  if (accuracy >= 75) return '👍'
  if (accuracy >= 60) return '💪'
  return '📚'
}

const getRatingText = (): string => {
  const accuracy = safeResult.value.accuracy
  if (accuracy >= 95) return '完美表现'
  if (accuracy >= 85) return '优秀'
  if (accuracy >= 75) return '良好'
  if (accuracy >= 60) return '及格'
  return '需要加强'
}

const getRatingDescription = (): string => {
  const accuracy = safeResult.value.accuracy
  if (accuracy >= 95) return '你的拼音输入技能已经非常熟练了！'
  if (accuracy >= 85) return '表现很好，继续保持这个水平！'
  if (accuracy >= 75) return '不错的成绩，再多练习会更好！'
  if (accuracy >= 60) return '基础还可以，多练习提高准确率！'
  return '建议多练习基础拼音，熟能生巧！'
}

// 操作方法
const restartPractice = () => {
  emit('restart')
}

const backToHome = () => {
  emit('backToHome')
}

const shareResult = () => {
  const text = `我在拼音打字练习中获得了 ${(safeResult.value.accuracy ?? 0).toFixed(1)}% 的准确率，答对了 ${safeResult.value.correctCount} 题！你也来挑战一下吧！`
  
  if (navigator.share) {
    navigator.share({
      title: '拼音打字练习成绩',
      text: text,
      url: window.location.href
    }).catch(console.error)
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(text).then(() => {
      alert('成绩已复制到剪贴板！')
    }).catch(() => {
      alert('分享功能暂不可用')
    })
  }
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 20px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.trophy-icon {
  font-size: 4rem;
  margin-bottom: 15px;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  padding: 25px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-card.success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-card.danger {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
}

.time-info {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.time-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.time-label {
  font-size: 0.9rem;
  color: #718096;
}

.time-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
}

.performance-rating {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 16px;
  margin-bottom: 30px;
}

.rating-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.rating-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 10px;
}

.rating-description {
  font-size: 1rem;
  color: #4a5568;
}

.mistakes-review {
  margin-bottom: 30px;
}

.mistakes-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
  text-align: center;
}

.mistakes-list {
  display: grid;
  gap: 15px;
}

.mistake-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #fff5f5;
  border-radius: 12px;
  border-left: 4px solid #e53e3e;
}

.mistake-character {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  min-width: 60px;
  text-align: center;
}

.mistake-details {
  flex: 1;
}

.mistake-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.mistake-row:last-child {
  margin-bottom: 0;
}

.mistake-label {
  font-size: 0.9rem;
  color: #718096;
  min-width: 80px;
}

.mistake-wrong {
  color: #e53e3e;
  font-weight: 600;
}

.mistake-correct {
  color: #38a169;
  font-weight: 600;
}

.history-chart {
  margin-bottom: 30px;
}

.chart-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
  text-align: center;
}

.chart-container {
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 3px;
  height: 100px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 15px;
}

.chart-bar {
  width: 8px;
  min-height: 10px;
  border-radius: 2px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.chart-bar.correct {
  background: #38a169;
}

.chart-bar.incorrect {
  background: #e53e3e;
}

.chart-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.1);
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #4a5568;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.correct {
  background: #38a169;
}

.legend-color.incorrect {
  background: #e53e3e;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.action-button {
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.action-button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-button.secondary {
  background: #718096;
  color: white;
}

.action-button.share {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
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
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .stat-value {
    font-size: 2rem;
  }
  
  .time-info {
    flex-direction: column;
    gap: 15px;
  }
  
  .mistake-item {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .mistake-details {
    width: 100%;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 200px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .trophy-icon {
    font-size: 3rem;
  }
  
  .title {
    font-size: 1.8rem;
  }
  
  .chart-container {
    height: 80px;
  }
  
  .chart-bar {
    width: 6px;
  }
}
</style>
