// 音频播放服务
import pinyinAudioMap from '../config/pinyinAudioMap.json'

export class AudioService {
  private isEnabled: boolean = true
  private currentAudio: HTMLAudioElement | null = null
  private sfxEnabled: boolean = true
  private sfxVolume: number = 0.6

  constructor() {
    // 预加载一些常用音频
    this.preloadCommonAudios()
  }

  // 预加载常用音频
  private async preloadCommonAudios() {
    // 预加载一些常用的拼音音频
    const commonPinyins = ['a1', 'o1', 'e1', 'i1', 'u1']
    commonPinyins.forEach(pinyin => {
      const audio = new Audio(`/mp3/${pinyin}.mp3`)
      audio.preload = 'auto'
    })
  }

  // 设置音频开关
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  // 开关与音量：输入音效/错误音效
  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.min(1, Math.max(0, volume))
  }

  // 获取音频开关状态
  getEnabled(): boolean {
    return this.isEnabled
  }

  // 停止当前播放
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  // 播放拼音音频
  async playPinyin(pinyin: string, tone: number = 1): Promise<void> {
    if (!this.isEnabled || !pinyin) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      try {
        // 停止当前播放
        this.stop()

        // 构建音频文件路径
        const audioPath = `/mp3/${pinyin}${tone}.mp3`
        const audio = new Audio(audioPath)
        this.currentAudio = audio

        // 设置音频参数
        audio.volume = 0.8
        audio.preload = 'auto'

        // 事件监听
        audio.onended = () => {
          this.currentAudio = null
          resolve()
        }

        audio.onerror = (error) => {
          console.warn(`Audio playback error for ${audioPath}:`, error)
          this.currentAudio = null
          resolve() // 即使出错也resolve，不影响主流程
        }

        // 开始播放
        audio.play().catch(error => {
          console.warn(`Audio play failed for ${audioPath}:`, error)
          this.currentAudio = null
          resolve()
        })

        // 设置超时，防止卡住
        setTimeout(() => {
          if (this.currentAudio === audio) {
            this.stop()
            resolve()
          }
        }, 3000)
      } catch (error) {
        console.warn('Audio playback failed:', error)
        resolve()
      }
    })
  }

  // 播放汉字发音（通过拼音）
  async playCharacter(_character: string, pinyin: string, tone: number): Promise<void> {
    return this.playPinyin(pinyin, tone)
  }

  // 播放拼音组件发音
  async playComponent(component: string): Promise<void> {
    if (!this.isEnabled || !component) {
      return Promise.resolve()
    }

    // 获取拼音组件的音频文件路径
    const audioPath = this.getComponentAudioPath(component)
    console.log( 'playComponent audioPath: ', audioPath, 'component: ', component)
    if (!audioPath) {
      console.warn(`No audio file found for component: ${component}`)
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      try {
        this.stop()

        const audio = new Audio(audioPath)
        this.currentAudio = audio

        audio.volume = 0.8
        audio.preload = 'auto'

        audio.onended = () => {
          this.currentAudio = null
          resolve()
        }

        audio.onerror = (error) => {
          console.warn(`Audio playback error for ${audioPath}:`, error)
          this.currentAudio = null
          resolve()
        }

        audio.play().catch(error => {
          console.warn(`Audio play failed for ${audioPath}:`, error)
          this.currentAudio = null
          resolve()
        })

        setTimeout(() => {
          if (this.currentAudio === audio) {
            this.stop()
            resolve()
          }
        }, 3000)
      } catch (error) {
        console.warn('Audio playback failed:', error)
        resolve()
      }
    })
  }

  // 获取拼音组件的音频文件路径
  private getComponentAudioPath(component: string): string | null {
    // 从配置中读取
    const initialsMap = (pinyinAudioMap as any).initials as Record<string, string>
    const finalsMap = (pinyinAudioMap as any).finals as Record<string, string>
    const overallMap = (pinyinAudioMap as any).overall as Record<string, string>

    let filename: string | undefined
    if (initialsMap && component in initialsMap) {
      filename = initialsMap[component]
    } else if (finalsMap && component in finalsMap) {
      filename = finalsMap[component]
    } else if (overallMap && component in overallMap) {
      filename = overallMap[component]
    }

    return filename ? `/mp3/${filename}` : null
  }

  // 播放通用音效（来自 public/music/）
  async playSfx(kind: 'type' | 'error'): Promise<void> {
    if (!this.sfxEnabled) return Promise.resolve()

    const filename = kind === 'type' ? 'type.mp3' : 'error.mp3'
    const path = `/music/${filename}`

    return new Promise((resolve) => {
      try {
        const audio = new Audio(path)
        audio.volume = this.sfxVolume
        audio.preload = 'auto'
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
        // 不占用 currentAudio，不打断主发音
      } catch {
        resolve()
      }
    })
  }

  // 检查音频文件是否存在
  async checkAudioExists(audioPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio(audioPath)
      audio.oncanplaythrough = () => resolve(true)
      audio.onerror = () => resolve(false)
      audio.load()
    })
  }

  // 预加载指定的音频文件
  async preloadAudio(audioPath: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(audioPath)
      audio.preload = 'auto'
      audio.oncanplaythrough = () => resolve()
      audio.onerror = () => resolve() // 即使失败也resolve
      audio.load()
    })
  }

  // 批量预加载音频
  async preloadAudios(audioPaths: string[]): Promise<void> {
    const promises = audioPaths.map(path => this.preloadAudio(path))
    await Promise.all(promises)
  }
}

// 创建全局音频服务实例
export const audioService = new AudioService()

// 音频设置接口
export interface AudioSettings {
  enabled: boolean
  volume: number
  preloadEnabled: boolean
}

// 默认音频设置
export const defaultAudioSettings: AudioSettings = {
  enabled: true,
  volume: 0.8,
  preloadEnabled: true
}
