import { audioService } from './audioService'

// 拼音组件发音映射表（用于显示）
const pinyinPronunciationMap: Record<string, string> = {
  // 声母发音映射
  'b': '波',
  'p': '泼', 
  'm': '摸',
  'f': '佛',
  'd': '得',
  't': '特',
  'n': '讷',
  'l': '勒',
  'g': '哥',
  'k': '科',
  'h': '喝',
  'j': '基',
  'q': '欺',
  'x': '希',
  'zh': '知',
  'ch': '蚩',
  'sh': '诗',
  'r': '日',
  'z': '资',
  'c': '雌',
  's': '思',
  'y': '衣',
  'w': '乌',
  
  // 韵母发音映射
  'a': '啊',
  'o': '哦',
  'e': '鹅',
  'i': '衣',
  'u': '乌',
  'ü': '迂',
  'ai': '哀',
  'ei': '诶',
  'ui': '威',
  'ao': '熬',
  'ou': '欧',
  'iu': '优',
  'ie': '耶',
  'üe': '约',
  'er': '儿',
  'an': '安',
  'en': '恩',
  'in': '因',
  'un': '温',
  'ün': '晕',
  'ang': '昂',
  'eng': '亨',
  'ing': '英',
  'ong': '翁'
}

// 语音合成服务
export class SpeechService {
  private synthesis: SpeechSynthesis
  private voice: SpeechSynthesisVoice | null = null
  private isEnabled: boolean = true

  constructor() {
    this.synthesis = window.speechSynthesis
    this.initVoice()
  }

  // 初始化中文语音
  private async initVoice() {
    // 等待语音列表加载
    if (this.synthesis.getVoices().length === 0) {
      await new Promise(resolve => {
        this.synthesis.onvoiceschanged = resolve
      })
    }

    const voices = this.synthesis.getVoices()
    
    // 优先选择中文语音
    const chineseVoices = voices.filter(voice => 
      voice.lang.includes('zh') || 
      voice.lang.includes('cmn') ||
      voice.name.includes('Chinese') ||
      voice.name.includes('中文')
    )

    if (chineseVoices.length > 0) {
      // 优先选择普通话语音
      this.voice = chineseVoices.find(voice => 
        voice.lang.includes('zh-CN') || 
        voice.lang.includes('cmn-Hans')
      ) || chineseVoices[0] || null
    } else {
      // 如果没有中文语音，使用默认语音
      this.voice = voices[0] || null
    }
  }

  // 检查是否支持语音合成
  isSupported(): boolean {
    return 'speechSynthesis' in window
  }

  // 设置语音开关
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    // 同时设置音频服务的开关
    audioService.setEnabled(enabled)
  }

  // 获取语音开关状态
  getEnabled(): boolean {
    return this.isEnabled
  }

  // 停止当前播放
  stop() {
    // 停止音频播放
    audioService.stop()
    
    // 停止语音合成（兼容性）
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
    }
  }

  // 播放拼音发音
  async speakPinyin(pinyin: string, tone: number = 1): Promise<void> {
    if (!this.isEnabled || !pinyin) {
      return Promise.resolve()
    }

    // 使用音频服务播放预录音频
    return audioService.playPinyin(pinyin, tone)
  }

  // 播放汉字发音（需要传入拼音和声调）
  async speakCharacter(character: string, pinyin?: string, tone?: number): Promise<void> {
    if (!this.isEnabled || !character) {
      return Promise.resolve()
    }

    // 如果提供了拼音和声调，使用音频服务播放
    if (pinyin && tone) {
      return audioService.playCharacter(character, pinyin, tone)
    }

    // 否则回退到语音合成（保持兼容性）
    if (!this.isSupported()) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      try {
        this.stop()

        const utterance = new SpeechSynthesisUtterance(character)
        
        if (this.voice) {
          utterance.voice = this.voice
        }
        utterance.lang = 'zh-CN'
        utterance.rate = 0.7
        utterance.pitch = this.getTonePitch(tone || 1)
        utterance.volume = 0.8

        utterance.onend = () => resolve()
        utterance.onerror = (error) => {
          console.warn('Speech synthesis error:', error)
          resolve()
        }

        this.synthesis.speak(utterance)

        setTimeout(() => {
          if (this.synthesis.speaking) {
            this.stop()
            resolve()
          }
        }, 3000)
      } catch (error) {
        console.warn('Speech synthesis failed:', error)
        resolve()
      }
    })
  }

  // 播放拼音组件发音（声母/韵母）
  async speakComponent(component: string): Promise<void> {
    if (!this.isEnabled || !component) {
      return Promise.resolve()
    }

    // 使用音频服务播放预录音频
    return audioService.playComponent(component)
  }

  // 根据声调获取音调（保留用于语音合成兼容性）
  private getTonePitch(tone: number): number {
    switch (tone) {
      case 1: return 1.2  // 一声：高平
      case 2: return 1.1  // 二声：上升
      case 3: return 0.9  // 三声：下降再上升
      case 4: return 0.8  // 四声：下降
      default: return 1.0 // 轻声
    }
  }

  // 获取可用的中文语音列表
  getChineseVoices(): SpeechSynthesisVoice[] {
    const voices = this.synthesis.getVoices()
    return voices.filter(voice => 
      voice.lang.includes('zh') || 
      voice.lang.includes('cmn') ||
      voice.name.includes('Chinese') ||
      voice.name.includes('中文')
    )
  }

  // 设置特定语音
  setVoice(voice: SpeechSynthesisVoice) {
    this.voice = voice
  }

  // 获取拼音组件的正确发音
  getPinyinPronunciation(component: string): string {
    return pinyinPronunciationMap[component] || component
  }
}

// 创建全局语音服务实例
export const speechService = new SpeechService()

// 导出发音映射表供其他地方使用
export { pinyinPronunciationMap }

// 语音设置接口
export interface SpeechSettings {
  enabled: boolean
  autoPlay: boolean
  voice: string
  rate: number
  pitch: number
  volume: number
}

// 默认语音设置
export const defaultSpeechSettings: SpeechSettings = {
  enabled: true,
  autoPlay: false,
  voice: '',
  rate: 0.8,
  pitch: 1.0,
  volume: 0.8
}
