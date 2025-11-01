// 本地存储服务：用户资料、学习设置、练习进度与统计

import type { PracticeMode } from '../data/pinyinData'

export interface UserProfile {
  id: string
  name: string
  createdAt: number
}

export interface PracticeSettings {
  mode: PracticeMode
  duration: number
  questionCount: number
  speechEnabled: boolean
  autoPlay: boolean
  randomize?: boolean
}

export interface StudySession {
  id: string
  mode: PracticeMode
  accuracy: number
  speed: number
  timeUsed: number
  total: number
  correct: number
  incorrect: number
  createdAt: number
}

export interface StatsSnapshot {
  totalSessions: number
  totalTimeSeconds: number
  totalCorrect: number
  totalIncorrect: number
  bestAccuracy: number
  bestSpeed: number
  lastSessionAt: number | null
}

const LS_KEYS = {
  user: 'ppv_user',
  settings: 'ppv_settings',
  sessions: 'ppv_sessions',
  stats: 'ppv_stats'
} as const

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// 用户
export function getUser(): UserProfile {
  const existing = safeParse<UserProfile | null>(localStorage.getItem(LS_KEYS.user), null)
  if (existing) return existing
  const created: UserProfile = { id: uid(), name: '学员', createdAt: Date.now() }
  localStorage.setItem(LS_KEYS.user, JSON.stringify(created))
  return created
}

export function setUser(profile: Partial<UserProfile>): UserProfile {
  const current = getUser()
  const next = { ...current, ...profile }
  localStorage.setItem(LS_KEYS.user, JSON.stringify(next))
  return next
}

// 设置
export function saveSettings(settings: PracticeSettings): void {
  localStorage.setItem(LS_KEYS.settings, JSON.stringify(settings))
}

export function loadSettings(): PracticeSettings | null {
  return safeParse<PracticeSettings | null>(localStorage.getItem(LS_KEYS.settings), null)
}

// 统计
export function getStats(): StatsSnapshot {
  return safeParse<StatsSnapshot>(localStorage.getItem(LS_KEYS.stats), {
    totalSessions: 0,
    totalTimeSeconds: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    bestAccuracy: 0,
    bestSpeed: 0,
    lastSessionAt: null
  })
}

function saveStats(s: StatsSnapshot) {
  localStorage.setItem(LS_KEYS.stats, JSON.stringify(s))
}

// 练习记录
export function getSessions(): StudySession[] {
  return safeParse<StudySession[]>(localStorage.getItem(LS_KEYS.sessions), [])
}

function saveSessions(items: StudySession[]) {
  localStorage.setItem(LS_KEYS.sessions, JSON.stringify(items))
}

export function recordSession(payload: {
  mode: PracticeMode
  accuracy: number
  speed: number
  timeUsed: number
  total: number
  correct: number
  incorrect: number
}): StudySession {
  const session: StudySession = {
    id: uid(),
    mode: payload.mode,
    accuracy: payload.accuracy || 0,
    speed: payload.speed || 0,
    timeUsed: payload.timeUsed || 0,
    total: payload.total || (payload.correct + payload.incorrect),
    correct: payload.correct || 0,
    incorrect: payload.incorrect || 0,
    createdAt: Date.now()
  }

  const sessions = getSessions()
  sessions.unshift(session)
  // 限制保存数量，避免无限增长
  if (sessions.length > 200) sessions.length = 200
  saveSessions(sessions)

  const stats = getStats()
  stats.totalSessions += 1
  stats.totalTimeSeconds += session.timeUsed
  stats.totalCorrect += session.correct
  stats.totalIncorrect += session.incorrect
  stats.bestAccuracy = Math.max(stats.bestAccuracy, session.accuracy)
  stats.bestSpeed = Math.max(stats.bestSpeed, session.speed)
  stats.lastSessionAt = session.createdAt
  saveStats(stats)

  return session
}

// 清理（调试用）
export function clearAll(): void {
  localStorage.removeItem(LS_KEYS.user)
  localStorage.removeItem(LS_KEYS.settings)
  localStorage.removeItem(LS_KEYS.sessions)
  localStorage.removeItem(LS_KEYS.stats)
}


