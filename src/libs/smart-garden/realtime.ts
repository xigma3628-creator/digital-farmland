// 真实数据源驱动：REST 初始化 + WebSocket 实时推送，写入与模拟器相同的一期响应式数据结构
import { dataSourceState, gardenAlarms, gardenDevices, irrigationToday, sensorHistory } from './simulator'
import { fetchIrrigationZones, handleIrrigationMessage } from './irrigation'
import { fetchAiResults, handleAiMessage } from './ai-recognition'
import { fmtIsoTime } from './format'

const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'
const WS_URL: string = (import.meta.env as any).VITE_WS_URL || 'ws://localhost:3100/ws'
const RECONNECT_MAX = 2000

let ws: WebSocket | null = null
let retryDelay = 500
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let aggregator: ReturnType<typeof setInterval> | null = null
let stopped = false

export async function checkBackend(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1500)
    const res = await fetch(`${API_BASE}/api/health`, { signal: ctrl.signal })
    clearTimeout(t)
    return res.ok
  } catch {
    return false
  }
}

export function stopRealtime(): void {
  stopped = true
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (aggregator !== null) {
    clearInterval(aggregator)
    aggregator = null
  }
  if (zonesTimer !== null) {
    clearInterval(zonesTimer)
    zonesTimer = null
  }
  if (ws) {
    ws.onclose = null
    ws.close()
    ws = null
  }
  dataSourceState.wsConnected = false
}

export function startRealtime(): void {
  stopped = false
  fetchDevices()
  fetchAlarms()
  fetchIrrigationZones()
  fetchIrrigationZonesInterval()
  fetchAiResults()
  connectWs()
  if (aggregator === null) aggregator = setInterval(aggregate, 2000)
}

let zonesTimer: ReturnType<typeof setInterval> | null = null
function fetchIrrigationZonesInterval(): void {
  if (zonesTimer !== null) return
  zonesTimer = setInterval(() => { fetchIrrigationZones() }, 3000)
}

function fetchDevices(): void {
  fetch(`${API_BASE}/api/devices`)
    .then(r => r.json())
    .then(res => {
      for (const d of res.devices || []) {
        upsertDeviceFromRest(d)
      }
      pushLog('devices synced: ' + (res.devices || []).length)
    })
    .catch(e => pushLog('REST-ERR devices: ' + e))
}

function fetchAlarms(): void {
  fetch(`${API_BASE}/api/alarms?active=1`)
    .then(r => r.json())
    .then(res => {
      gardenAlarms.splice(0, gardenAlarms.length)
      for (const a of res.alarms || []) {
        gardenAlarms.push({ key: a.key, level: a.level, text: a.text, time: fmtIsoTime(a.raised_at) })
      }
    })
    .catch(e => pushLog('REST-ERR alarms: ' + e))
}

function upsertDeviceFromRest(d: any): void {
  const fields = {
    name: d.name,
    type: d.type,
    lon: d.lon,
    lat: d.lat,
    status: d.status === 'offline' ? ('offline' as const) : ('online' as const),
    ...(d.metrics || {})
  }
  const existing = gardenDevices.find(x => x.id === d.id)
  if (existing) {
    Object.assign(existing, fields)
  } else {
    gardenDevices.push({ id: d.id, ...fields })
  }
}

function connectWs(): void {
  if (stopped) return
  try {
    ws = new WebSocket(WS_URL)
  } catch {
    scheduleReconnect()
    return
  }
  ws.onopen = () => {
    retryDelay = 500
    dataSourceState.wsConnected = true
    pushLog('WS connected')
  }
  ws.onmessage = event => {
    try {
      handleWsMessage(JSON.parse(event.data as string))
    } catch { /* 忽略非法报文 */ }
  }
  ws.onclose = () => {
    ws = null
    dataSourceState.wsConnected = false
    if (!stopped) {
      pushLog('WS closed, reconnecting...')
      scheduleReconnect()
    }
  }
  ws.onerror = () => {
    ws?.close()
  }
}

function scheduleReconnect(): void {
  if (stopped || reconnectTimer !== null) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectWs()
  }, retryDelay)
  retryDelay = Math.min(retryDelay * 2, RECONNECT_MAX)
}

function handleWsMessage(msg: any): void {
  if (msg.type === 'sensor') {
    const dev = gardenDevices.find(x => x.id === msg.deviceId)
    if (dev) {
      dev.status = msg.data.status === 'offline' ? 'offline' : 'online'
      Object.assign(dev, normalizeMetrics(msg.data.metrics || {}))
    }
  } else if (msg.type === 'alarm') {
    const a = msg.alarm
    if (!gardenAlarms.some(x => x.key === a.key)) {
      gardenAlarms.unshift({
        key: a.key,
        level: a.level,
        text: a.text,
        time: fmtIsoTime(a.raised_at)
      })
      if (gardenAlarms.length > 20) gardenAlarms.pop()
    }
  } else if (msg.type === 'alarmCleared') {
    const idx = gardenAlarms.findIndex(x => x.key === msg.key)
    if (idx >= 0) gardenAlarms.splice(idx, 1)
  } else if (msg.type === 'device') {
    const dev = gardenDevices.find(x => x.id === msg.deviceId)
    if (dev) dev.status = msg.status === 'offline' ? 'offline' : 'online'
  } else if (msg.type === 'irrigation') {
    handleIrrigationMessage(msg)
  } else if (msg.type === 'ai') {
    handleAiMessage(msg)
  }
}

function normalizeMetrics(m: Record<string, unknown>): Record<string, unknown> {
  return m
}

/** 每 2 秒汇总一次，驱动一期既有曲线与累计灌溉量 */
function aggregate(): void {
  const soilDevs = gardenDevices.filter(d => d.type === 'soil')
  const weather = gardenDevices.find(d => d.type === 'weather')
  if (!weather && soilDevs.length === 0) return
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  sensorHistory.push({
    time: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
    soil: soilDevs.reduce((s, x) => s + (x.soilMoisture || 0), 0) / Math.max(1, soilDevs.length),
    air: weather?.airTemp || 0,
    humidity: weather?.humidity || 0
  })
  if (sensorHistory.length > 30) sensorHistory.shift()
  for (const dev of gardenDevices) {
    if (dev.type === 'irrigation' && dev.valveOpen) {
      irrigationToday.value = +(irrigationToday.value + (dev.flow || 0) * 2 / 3600).toFixed(2)
    }
  }
}

function pushLog(msg: string): void {
  console.info('[realtime] ' + msg)
}
