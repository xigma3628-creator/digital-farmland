// AI 识别前端数据层：识别结果列表 + 统计 + 触发（真实/离线双模式）
// 真实模式：GET /api/ai/results 拉取 + WS type=ai 增量推送 + POST /api/ai/recognize 手动触发
// 离线模式：前端按同一 taxonomy 权重模拟推理，8s 一次自动巡检
import { computed, reactive, ref } from 'vue'
import { gardenDevices, dataSourceState } from './simulator'

const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'

export interface AiResult {
  id?: number
  cameraId: string
  cameraName: string
  kind: 'pest' | 'growth'
  label: string
  confidence: number
  advice: string
  source: 'auto' | 'manual' | 'model' | 'mock-fallback' | 'mock'
  latencyMs: number
  ts: string
}

export const aiResults = reactive<AiResult[]>([])
export const aiStats = reactive({ today: 0, pests: 0, avgConfidence: 0 })
export const aiScanning = ref(false)
export const aiReady = reactive({ ok: false, error: '' })

export const pestResults = computed(() => aiResults.filter(r => r.kind === 'pest'))

// ---------- 真实模式 ----------
export async function fetchAiResults(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/ai/results?limit=30`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'bad response')
    aiResults.splice(0, aiResults.length)
    for (const r of json.results || []) aiResults.push(r)
    Object.assign(aiStats, json.stats || {})
    aiReady.ok = true
    aiReady.error = ''
    return true
  } catch (e) {
    aiReady.ok = false
    aiReady.error = String((e as Error)?.message || e)
    return false
  }
}

function pushResult(r: AiResult): void {
  if (aiResults.some(x => x.ts === r.ts && x.cameraId === r.cameraId)) return
  aiResults.unshift(r)
  if (aiResults.length > 30) aiResults.pop()
  aiStats.today += 1
  if (r.kind === 'pest') aiStats.pests += 1
  const n = aiStats.today
  aiStats.avgConfidence = +(aiStats.avgConfidence * (n - 1) / n + r.confidence * 100 / n).toFixed(1)
}

export function handleAiMessage(msg: any): void {
  if (msg.type !== 'ai' || !msg.result) return
  pushResult(msg.result)
}

export async function recognizeCamera(cameraId: string): Promise<AiResult | null> {
  if (dataSourceState.mode === 'mock') return mockRecognize(cameraId)
  try {
    const res = await fetch(`${API_BASE}/api/ai/recognize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cameraId })
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || '识别失败')
    pushResult(json.result)
    return json.result
  } catch (e) {
    aiReady.error = String((e as Error)?.message || e)
    return null
  }
}

/** 全园巡检：对全部在线摄像头依次识别（间隔 600ms 避免占满推理队列） */
export async function scanAllCameras(): Promise<number> {
  if (aiScanning.value) return 0
  aiScanning.value = true
  let done = 0
  try {
    const cams = gardenDevices.filter(d => d.type === 'camera' && d.status === 'online')
    for (const cam of cams) {
      const r = await recognizeCamera(cam.id)
      if (r) done += 1
      await new Promise(resolve => setTimeout(resolve, 600))
    }
  } finally {
    aiScanning.value = false
  }
  return done
}

// ---------- 离线演示模式 ----------
const MOCK_TAXONOMY = [
  { kind: 'pest', label: '蚜虫', weight: 0.10, advice: '建议喷施吡虫啉 1000 倍液，3 天后复检' },
  { kind: 'pest', label: '红蜘蛛', weight: 0.08, advice: '建议增加叶面湿度并施用阿维菌素，5 天后复检' },
  { kind: 'pest', label: '白粉病', weight: 0.09, advice: '建议喷施三唑酮 1500 倍液，剪除病叶并集中处理' },
  { kind: 'pest', label: '蚧壳虫', weight: 0.06, advice: '建议刷除虫体后喷施螺虫乙酯，7 天后复检' },
  { kind: 'growth', label: '长势正常', weight: 0.42, advice: '叶片色泽与形态正常，按既定养护计划执行' },
  { kind: 'growth', label: '轻度缺氮', weight: 0.12, advice: '叶色偏黄，建议追施尿素 10g/m² 并加强观察' },
  { kind: 'growth', label: '长势偏弱', weight: 0.08, advice: '建议检查土壤墒情与光照，适当补充水肥' },
  { kind: 'growth', label: '徒长', weight: 0.05, advice: '节间过长，建议控水控肥并增加光照' }
] as const
const MOCK_TOTAL = MOCK_TAXONOMY.reduce((s, t) => s + t.weight, 0)

let mockTimer: ReturnType<typeof setInterval> | null = null
let mockSeq = 1

function mockPick() {
  let r = Math.random() * MOCK_TOTAL
  for (const t of MOCK_TAXONOMY) {
    r -= t.weight
    if (r <= 0) return t
  }
  return MOCK_TAXONOMY[MOCK_TAXONOMY.length - 1]
}

function mockGenerate(cameraId: string, source: 'auto' | 'manual'): AiResult {
  const cam = gardenDevices.find(d => d.id === cameraId)
  const t = mockPick()
  return {
    id: mockSeq++,
    cameraId,
    cameraName: cam ? cam.name : cameraId,
    kind: t.kind,
    label: t.label,
    confidence: +(0.62 + Math.random() * 0.36).toFixed(2),
    advice: t.advice,
    source,
    latencyMs: Math.round(300 + Math.random() * 500),
    ts: new Date().toISOString()
  }
}

export function mockRecognize(cameraId: string): AiResult | null {
  const cam = gardenDevices.find(d => d.id === cameraId)
  if (!cam || cam.status !== 'online') {
    aiReady.error = '摄像头离线，无法取流识别'
    return null
  }
  const r = mockGenerate(cameraId, 'manual')
  pushResult(r)
  return r
}

export function startMockAi(): void {
  if (mockTimer !== null) return
  aiReady.ok = true
  aiReady.error = ''
  const autoTick = (): void => {
    const cams = gardenDevices.filter(d => d.type === 'camera' && d.status === 'online')
    if (cams.length === 0) return
    const cam = cams[Math.floor(Math.random() * cams.length)]
    pushResult(mockGenerate(cam.id, 'auto'))
  }
  autoTick()
  mockTimer = setInterval(autoTick, 8000)
}

export function stopMockAi(): void {
  if (mockTimer !== null) {
    clearInterval(mockTimer)
    mockTimer = null
  }
}
