<template>
  <div class="score-result">
    <div class="panel">
      <div class="panel-header">
        <div class="title">成绩</div>
        <button class="close" @click="backToHome">✕</button>
      </div>

      <div class="section">
        <div class="row">
          <div class="row-label">准确率</div>
          <div class="row-value strong">{{ (safe.accuracy ?? 0).toFixed(2) }}%</div>
        </div>
        <div class="row">
          <div class="row-label">按键速度</div>
          <div class="row-value">{{ (safe.speed ?? 0).toFixed(0) }} 键/分钟</div>
        </div>
        <div class="row">
          <div class="row-label">用时</div>
          <div class="row-value">{{ (safe.timeUsed ?? 0).toFixed(2) }} 秒</div>
        </div>
      </div>

      <div class="section">
        <div class="row">
          <div class="row-label">总字数</div>
          <div class="row-value">{{ safe.total }}</div>
        </div>
        <div class="row">
          <div class="row-label">正确字数</div>
          <div class="row-value">{{ safe.correct }}</div>
        </div>
        <div class="row">
          <div class="row-label">错误字数</div>
          <div class="row-value">{{ safe.incorrect }}</div>
        </div>
        <div class="row">
          <div class="row-label">退格</div>
          <div class="row-value">{{ safe.backspace }}</div>
        </div>
      </div>

      <div class="score-line">
        <div class="score-label">获得积分</div>
        <div class="score-value">{{ safe.score }}</div>
      </div>

      <div class="rating">
        <div class="stars">
          <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= safe.stars }">★</span>
        </div>
        <div class="comment">{{ safe.comment }}</div>
      </div>

      <div class="actions">
        <button class="btn ghost" @click="restart">再来一次（R）</button>
        <button class="btn primary" @click="continueNext">继续 ↵</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ result: any }>()
const emit = defineEmits<{ restart: []; backToHome: [] }>()

const normalize = (r: any) => {
  const correct = Number(r?.correctCount ?? r?.correct ?? 0)
  const incorrect = Number(r?.incorrectCount ?? r?.errorCount ?? r?.incorrect ?? 0)
  const total = Number(r?.totalQuestions ?? r?.totalComponents ?? correct + incorrect)
  const timeUsed = Number(r?.timeUsed ?? 0)
  const speed = Number(
    r?.answersPerMinute ?? r?.componentsPerMinute ?? (timeUsed > 0 ? (total / timeUsed) * 60 : 0)
  )
  const accuracy = Number(r?.accuracy ?? (total > 0 ? (correct / total) * 100 : 0))
  const backspace = Number(r?.backspace ?? 0)

  // 简单评分与星级
  const score = Math.max(0, Math.round(accuracy * 0.8 + speed * 0.1))
  const stars = Math.min(5, Math.max(1, Math.round((accuracy / 100) * 5)))
  const comment =
    accuracy >= 95 ? '表现不错喔，快进入下个课程继续探索吧！' :
    accuracy >= 85 ? '很棒，保持手感继续前进！' :
    accuracy >= 70 ? '还行，再多练习会更稳！' : '继续加油，熟能生巧！'

  return { accuracy, speed, timeUsed, total, correct, incorrect, backspace, score, stars, comment }
}

const safe = computed(() => normalize(props.result ?? {}))

const restart = () => emit('restart')
const backToHome = () => emit('backToHome')
const continueNext = () => emit('backToHome')
</script>

<style scoped>
.score-result {
  min-height: 100vh;
  background: #0f1116;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #e6e6eb;
}

.panel {
  width: 680px;
  background: #151823;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.title {
  font-size: 22px;
  font-weight: 700;
}

.close {
  background: transparent;
  border: none;
  color: #8b90a5;
  font-size: 18px;
  cursor: pointer;
}

.section {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.row-label { color: #9aa0b4; }
.row-value { color: #eef0f6; }
.row-value.strong { font-size: 22px; font-weight: 800; }

.score-line {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.score-label { color: #9aa0b4; }
.score-value {
  font-size: 36px;
  font-weight: 900;
  color: #ff97b0;
  text-shadow: 0 0 10px rgba(255,151,176,0.3);
}

.rating { padding: 12px 20px 4px; text-align: left; }
.stars { margin-bottom: 8px; }
.star { color: #2a2f3f; font-size: 20px; margin-right: 6px; }
.star.on { color: #ff5f8a; text-shadow: 0 0 8px rgba(255,95,138,0.35); }
.comment { color: #c5c9d6; }

.actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px 20px;
}

.btn {
  flex: 1;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 700;
  cursor: pointer;
}

.btn.ghost {
  background: transparent;
  border-color: rgba(255,255,255,0.15);
  color: #e6e6eb;
}

.btn.primary {
  background: #ff5f8a;
  color: white;
  box-shadow: 0 6px 18px rgba(255,95,138,0.35);
}

@media (max-width: 720px) {
  .panel { width: 100%; }
}
</style>


