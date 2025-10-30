<template>
  <div class="pronunciation-test">
    <div class="container">
      <h1 class="title">拼音发音测试</h1>
      <p class="subtitle">点击下面的拼音组件来测试发音是否正确</p>
      
      <div class="test-section">
        <h2 class="section-title">声母测试</h2>
        <div class="component-grid">
          <div 
            v-for="initial in initials" 
            :key="initial"
            class="test-item"
            @click="testPronunciation(initial)"
            :class="{ 'playing': currentPlaying === initial }"
          >
            <div class="component">{{ initial }}</div>
            <div class="pronunciation">{{ getPronunciation(initial) }}</div>
          </div>
        </div>
      </div>
      
      <div class="test-section">
        <h2 class="section-title">韵母测试</h2>
        <div class="component-grid">
          <div 
            v-for="final in finals" 
            :key="final"
            class="test-item"
            @click="testPronunciation(final)"
            :class="{ 'playing': currentPlaying === final }"
          >
            <div class="component">{{ final }}</div>
            <div class="pronunciation">{{ getPronunciation(final) }}</div>
          </div>
        </div>
      </div>
      
      <div class="controls">
        <button @click="testAll" class="test-all-btn" :disabled="isTestingAll">
          {{ isTestingAll ? '正在测试...' : '测试所有发音' }}
        </button>
        <button @click="goBack" class="back-btn">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getAllInitials, getAllFinals } from '../data/pinyinData'
import { speechService, pinyinPronunciationMap } from '../services/speechService'
import { audioService } from '../services/audioService'

// Events
const emit = defineEmits<{
  back: []
}>()

// 数据
const initials = getAllInitials()
const finals = getAllFinals()
const currentPlaying = ref<string | null>(null)
const isTestingAll = ref(false)

// 获取发音
const getPronunciation = (component: string): string => {
  return pinyinPronunciationMap[component] || component
}

// 测试单个发音
const testPronunciation = async (component: string) => {
  if (currentPlaying.value) return
  
  currentPlaying.value = component
  try {
    await speechService.speakComponent(component)
  } finally {
    currentPlaying.value = null
  }
}

// 测试所有发音
const testAll = async () => {
  if (isTestingAll.value) return
  
  isTestingAll.value = true
  const allComponents = [...initials, ...finals]
  
  for (const component of allComponents) {
    currentPlaying.value = component
    await speechService.speakComponent(component)
    // 每个发音之间间隔0.5秒
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  currentPlaying.value = null
  isTestingAll.value = false
}

// 返回首页
const goBack = () => {
  speechService.stop()
  audioService.stop()
  emit('back')
}
</script>

<style scoped>
.pronunciation-test {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  text-align: center;
  font-size: 1.1rem;
  color: #718096;
  margin-bottom: 40px;
}

.test-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
  text-align: center;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  justify-items: center;
}

.test-item {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.test-item:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.test-item.playing {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(243, 156, 18, 0.3);
}

.component {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.pronunciation {
  font-size: 1rem;
  color: #667eea;
  font-weight: 500;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.test-all-btn,
.back-btn {
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-all-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.test-all-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-btn {
  background: #718096;
  color: white;
}

.test-all-btn:hover:not(:disabled),
.back-btn:hover {
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
  
  .component-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
  
  .test-item {
    padding: 12px;
    min-width: 80px;
  }
  
  .component {
    font-size: 1.2rem;
  }
  
  .pronunciation {
    font-size: 0.9rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .test-all-btn,
  .back-btn {
    width: 200px;
  }
}
</style>
