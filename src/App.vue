<script setup lang="ts">
import { ref } from 'vue'
import HomePage from './components/HomePage.vue'
import PracticePage from './components/PracticePage.vue'
import ComponentPracticePage from './components/ComponentPracticePage.vue'
import NewResultPage from './components/NewResultPage.vue'
import PronunciationTest from './components/PronunciationTest.vue'
import AudioTest from './components/AudioTest.vue'
import { getRandomQuestions, type PinyinQuestion, type PracticeMode } from './data/pinyinData'
import { saveSettings, recordSession } from './services/storageService'

// 应用状态
type AppState = 'home' | 'practice' | 'component-practice' | 'result' | 'pronunciation-test' | 'audio-test'
const currentState = ref<AppState>('home')

// 练习设置
const practiceSettings = ref({
  mode: 'character' as PracticeMode,
  duration: 60,
  questionCount: 20,
  speechEnabled: true,
  autoPlay: false,
  randomize: false
})

// 练习数据
const questions = ref<PinyinQuestion[]>([])
const practiceResult = ref<any>(null)

// 开始练习
const startPractice = (settings: { 
  mode: PracticeMode
  duration: number
  questionCount: number
  speechEnabled: boolean
  autoPlay: boolean
  randomize?: boolean
}) => {
  practiceSettings.value = settings
  // 保存最近一次设置
  saveSettings({
    mode: settings.mode,
    duration: settings.duration,
    questionCount: settings.questionCount,
    speechEnabled: settings.speechEnabled,
    autoPlay: settings.autoPlay,
    randomize: settings.randomize
  })
  
  if (settings.mode === 'character') {
    questions.value = getRandomQuestions(settings.questionCount)
    currentState.value = 'practice'
  } else {
    // 声母、韵母或整体认读音节练习
    currentState.value = 'component-practice'
  }
}

// 完成练习
const finishPractice = (result: any) => {
  practiceResult.value = result
  // 记录练习
  recordSession({
    mode: practiceSettings.value.mode,
    accuracy: Number(result?.accuracy ?? 0),
    speed: Number(result?.answersPerMinute ?? 0),
    timeUsed: Number(result?.timeUsed ?? 0),
    total: Number(result?.totalQuestions ?? 0),
    correct: Number(result?.correctCount ?? 0),
    incorrect: Number(result?.incorrectCount ?? 0)
  })
  currentState.value = 'result'
}

// 完成组件练习
const finishComponentPractice = (result: any) => {
  practiceResult.value = result
  // 记录练习（组件练习）
  recordSession({
    mode: practiceSettings.value.mode,
    accuracy: Number(result?.accuracy ?? 0),
    speed: Number(result?.componentsPerMinute ?? 0),
    timeUsed: Number(result?.timeUsed ?? 0),
    total: Number(result?.totalComponents ?? 0),
    correct: Number(result?.correctCount ?? 0),
    incorrect: Number(result?.errorCount ?? 0)
  })
  currentState.value = 'result'
}

// 重新开始练习
const restartPractice = () => {
  if (practiceSettings.value.mode === 'character') {
    questions.value = getRandomQuestions(practiceSettings.value.questionCount)
    currentState.value = 'practice'
  } else {
    currentState.value = 'component-practice'
  }
}

// 返回首页
const backToHome = () => {
  currentState.value = 'home'
  practiceResult.value = null
}

// 进入发音测试
const goToPronunciationTest = () => {
  currentState.value = 'pronunciation-test'
}

// 进入音频测试
const goToAudioTest = () => {
  currentState.value = 'audio-test'
}
</script>

<template>
  <div class="app">
    <!-- 首页 -->
    <HomePage 
      v-if="currentState === 'home'"
      @start-practice="startPractice"
      @test-pronunciation="goToPronunciationTest"
      @test-audio="goToAudioTest"
    />
    
    <!-- 汉字拼音练习页面 -->
    <PracticePage 
      v-if="currentState === 'practice'"
      :questions="questions"
      :duration="practiceSettings.duration"
      :speech-enabled="practiceSettings.speechEnabled"
      :auto-play="practiceSettings.autoPlay"
      @finish="finishPractice"
    />
    
    <!-- 拼音组件练习页面 -->
    <ComponentPracticePage 
      v-if="currentState === 'component-practice'"
      :practice-mode="practiceSettings.mode as 'initial' | 'final' | 'overall'"
      :duration="practiceSettings.duration"
      :speech-enabled="practiceSettings.speechEnabled"
      :auto-play="practiceSettings.autoPlay"
      :randomize="practiceSettings.randomize ?? false"
      @finish="finishComponentPractice"
      @back="backToHome"
    />
    
    <!-- 结果页面 -->
    <NewResultPage 
      v-if="currentState === 'result'"
      :result="practiceResult"
      @restart="restartPractice"
      @back-to-home="backToHome"
    />
    
    <!-- 发音测试页面 -->
    <PronunciationTest 
      v-if="currentState === 'pronunciation-test'"
      @back="backToHome"
    />
    
    <!-- 音频测试页面 -->
    <AudioTest 
      v-if="currentState === 'audio-test'"
      @back="backToHome"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
}

/* 全局响应式样式 */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  html {
    font-size: 13px;
  }
}
</style>
