// 灌溉闭环前端数据层：REST 拉取分区状态 + WS 接收推送（mock 模式下由前端规则驱动）
import { computed, reactive } from 'vue'

const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'

export interface IrrigationZone {
  id: string
  name: string
  valveId: string
  valveName: string
  mode: 'auto' | 'manual'
  state: 'idle' | 'watering' | 'cooldown'
  soilIds: string[]
  moisture: number | null
  moistureLow: number
  moistureTarget: number
  todayLiters: number
  dailyCapLiters: number
  openedAt: string | null
  closedAt: string | null
  lastReason: string
  valveOpen: boolean
  flow: number
  valveStatus: string
}

export const irrigationZones = reactive<IrrigationZone[]>([])
export const irrigationReady = reactive({ ok: false, error: '' })
export const irrigationAutoCount = computed(() => irrigationZones.filter(z => z.mode === 'auto').length)

export async function fetchIrrigationZones(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/irrigation/zones`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'bad response')
    syncZones(json.zones || [])
    irrigationReady.ok = true
    irrigationReady.error = ''
    return true
  } catch (e) {
    irrigationReady.ok = false
    irrigationReady.error = String((e as Error)?.message || e)
    return false
  }
}

function syncZones(list: IrrigationZone[]): void {
  const byId = new Map(irrigationZones.map(z => [z.id, z]))
  for (const z of list) {
    const existing = byId.get(z.id)
    if (existing) Object.assign(existing, z)
    else irrigationZones.push(z)
  }
}

export function upsertZone(zone: IrrigationZone): void {
  const idx = irrigationZones.findIndex(z => z.id === zone.id)
  if (idx >= 0) Object.assign(irrigationZones[idx], zone)
  else irrigationZones.push(zone)
}

export function handleIrrigationMessage(msg: any): void {
  if (msg.type !== 'irrigation' || !msg.zone) return
  upsertZone(msg.zone)
}

export async function setZoneMode(id: string, mode: 'auto' | 'manual'): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/irrigation/zones/${id}/mode`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode })
    })
    const json = await res.json()
    if (json.ok && json.zone) upsertZone(json.zone)
    return !!json.ok
  } catch {
    return false
  }
}

export async function setZoneValve(id: string, valveOpen: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/irrigation/zones/${id}/valve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valveOpen })
    })
    const json = await res.json()
    if (json.ok && json.zone) upsertZone(json.zone)
    return !!json.ok
  } catch {
    return false
  }
}

// ---------- mock 模式：前端本地策略驱动（与后端规则保持一致的安全约束） ----------
import { gardenDevices } from './simulator'

const MOCK_ZONES = [
  { id: 'zone-center', name: '中心绿地区', valveId: 'irr-01', soilIds: ['soil-01', 'soil-02'] },
  { id: 'zone-library', name: '图书馆前绿地区', valveId: 'irr-02', soilIds: ['soil-04'] },
  { id: 'zone-sports', name: '运动场绿地区', valveId: 'irr-03', soilIds: ['soil-03'] },
  { id: 'zone-farm', name: '校外农田区', valveId: 'irr-04', soilIds: ['soil-05', 'soil-06'] }
]
const MOCK_LIMITS = { moistureLow: 35, moistureTarget: 45, maxRunSeconds: 120, cooldownSeconds: 60, dailyCapLiters: 600 }

let mockTimer: ReturnType<typeof setInterval> | null = null
const mockMeta = new Map<string, { openedAt: number; closedAt: number }>()

export function startMockIrrigation(): void {
  if (mockTimer !== null) return
  if (irrigationZones.length === 0) {
    for (const cfg of MOCK_ZONES) {
      irrigationZones.push({
        ...cfg, valveName: cfg.valveId, mode: 'auto', state: 'idle',
        moisture: null, ...MOCK_LIMITS,
        todayLiters: 0, openedAt: null, closedAt: null, lastReason: '前端离线策略运行中',
        valveOpen: false, flow: 0, valveStatus: 'online'
      })
      mockMeta.set(cfg.id, { openedAt: 0, closedAt: 0 })
    }
  } else {
    // 从后端快照切过来：重置为可运行的本地初始态
    for (const z of irrigationZones) {
      z.mode = 'auto'
      z.state = 'idle'
      z.todayLiters = 0
      z.openedAt = null
      z.closedAt = null
      z.lastReason = '前端离线策略运行中'
      if (!mockMeta.has(z.id)) mockMeta.set(z.id, { openedAt: 0, closedAt: 0 })
    }
  }
  irrigationReady.ok = true
  irrigationReady.error = ''
  mockTimer = setInterval(mockTick, 2000)
}

export function stopMockIrrigation(): void {
  if (mockTimer !== null) {
    clearInterval(mockTimer)
    mockTimer = null
  }
}

function mockTick(): void {
  for (const z of irrigationZones) {
    const meta = mockMeta.get(z.id)!
    const soils = gardenDevices.filter(d => z.soilIds.includes(d.id) && d.status === 'online')
    const vals = soils.map(d => d.soilMoisture).filter((v): v is number => typeof v === 'number')
    z.moisture = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
    const valve = gardenDevices.find(d => d.id === z.valveId)
    z.valveStatus = valve?.status || 'unknown'

    if (z.mode !== 'auto') {
      z.valveOpen = !!valve?.valveOpen
      z.flow = valve?.flow || 0
      continue
    }

    if (z.state === 'watering') {
      z.todayLiters += (valve?.flow || 0) * 2 / 3600 * 1000
      const overRun = Date.now() - meta.openedAt > MOCK_LIMITS.maxRunSeconds * 1000
      if (z.moisture !== null && z.moisture >= MOCK_LIMITS.moistureTarget) mockClose(z, meta, `墒情达标 ${z.moisture.toFixed(1)}% ≥ ${MOCK_LIMITS.moistureTarget}%`)
      else if (overRun) mockClose(z, meta, `达到最大连续运行时长 ${MOCK_LIMITS.maxRunSeconds}s`)
      else if (z.todayLiters >= MOCK_LIMITS.dailyCapLiters) mockClose(z, meta, `达到日用水上限 ${MOCK_LIMITS.dailyCapLiters}L`)
    } else if (z.state === 'cooldown') {
      if (Date.now() - meta.closedAt >= MOCK_LIMITS.cooldownSeconds * 1000) {
        z.state = 'idle'
        z.lastReason = '冷却结束，恢复自动待机'
      }
    } else if (z.moisture !== null && z.moisture < MOCK_LIMITS.moistureLow && valve?.status === 'online') {
      z.state = 'watering'
      z.valveOpen = true
      meta.openedAt = Date.now()
      z.lastReason = `墒情不足 ${z.moisture.toFixed(1)}% < ${MOCK_LIMITS.moistureLow}%`
      z.openedAt = new Date().toISOString()
      if (valve) { valve.valveOpen = true; valve.flow = valve.flow || 10 }
    }
  }
}

function mockClose(z: IrrigationZone, meta: { openedAt: number; closedAt: number }, reason: string): void {
  z.state = 'cooldown'
  z.valveOpen = false
  z.flow = 0
  z.lastReason = reason
  z.closedAt = new Date().toISOString()
  meta.closedAt = Date.now()
  const valve = gardenDevices.find(d => d.id === z.valveId)
  if (valve) { valve.valveOpen = false; valve.flow = 0 }
}

/** mock 模式下的模式/阀门控制（不走 REST） */
export function mockSetMode(id: string, mode: 'auto' | 'manual'): void {
  const z = irrigationZones.find(x => x.id === id)
  if (!z) return
  const meta = mockMeta.get(id)
  if (!meta) return
  if (mode === 'manual' && z.state === 'watering') mockClose(z, meta, '切换为手动模式')
  if (mode === 'auto') { z.state = 'idle'; meta.closedAt = 0 }
  z.mode = mode
  z.lastReason = mode === 'auto' ? '切换为自动模式' : '切换为手动模式'
}

export function mockSetValve(id: string, valveOpen: boolean): void {
  const z = irrigationZones.find(x => x.id === id)
  const meta = mockMeta.get(id)
  if (!z || !meta) return
  const valve = gardenDevices.find(d => d.id === z.valveId)
  if (z.mode === 'auto') z.mode = 'manual'
  if (valveOpen) {
    z.state = 'watering'
    z.valveOpen = true
    meta.openedAt = Date.now()
    z.openedAt = new Date().toISOString()
    z.lastReason = '手动开阀'
    if (valve) { valve.valveOpen = true; valve.flow = valve.flow || 10 }
  } else {
    mockClose(z, meta, '手动关阀')
  }
}
