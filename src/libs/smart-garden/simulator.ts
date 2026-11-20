import { reactive, ref } from 'vue'
import { CAMPUS_BOUNDARY, CAMPUS_CENTER, CAMPUS_DEVICES, CAMPUS_ZONES } from './campus-data'

export type DeviceType = 'soil' | 'weather' | 'irrigation' | 'camera' | 'water' | 'insect'
export type DeviceStatus = 'online' | 'offline'

export interface GardenDevice {
  id: string
  name: string
  type: DeviceType
  lon: number
  lat: number
  status: DeviceStatus
  soilMoisture?: number
  soilTemp?: number
  airTemp?: number
  humidity?: number
  windSpeed?: number
  flow?: number
  pressure?: number
  valveOpen?: boolean
  dissolvedOxygen?: number
  turbidity?: number
  insectIndex?: number
}

export interface SensorPoint {
  time: string
  soil: number
  air: number
  humidity: number
}

export interface GardenAlarm {
  key: string
  time: string
  text: string
  level: 'high' | 'mid'
}

export const PARK_CENTER = CAMPUS_CENTER

/** 园区边界（演示数据） */
export const PARK_BOUNDARY = CAMPUS_BOUNDARY

/** 园区功能分区 */
export const PARK_ZONES = CAMPUS_ZONES

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))
const walk = (v: number, step: number, min: number, max: number): number =>
  clamp(v + (Math.random() - 0.5) * 2 * step, min, max)

const nowStr = (): string => {
  const d = new Date()
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const seedMetric = (type: DeviceType): Partial<GardenDevice> => {
  switch (type) {
    case 'soil':
      return { soilMoisture: 52, soilTemp: 24 }
    case 'weather':
      return { airTemp: 27.5, humidity: 68, windSpeed: 2.4 }
    case 'irrigation':
      return { flow: 12.5, pressure: 0.38, valveOpen: true }
    case 'water':
      return { dissolvedOxygen: 7.2, turbidity: 2.1 }
    case 'insect':
      return { insectIndex: 12 }
    default:
      return {}
  }
}

export const gardenDevices = reactive<GardenDevice[]>(
  CAMPUS_DEVICES.map(d => ({
    ...d,
    ...seedMetric(d.type),
    ...(d.type === 'irrigation' && d.id === 'irr-03' ? { flow: 0, valveOpen: false } : {})
  }))
)

export const sensorHistory = reactive<SensorPoint[]>([])
export const gardenAlarms = reactive<GardenAlarm[]>([])
export const irrigationToday = ref(128.6)

let timer: ReturnType<typeof setInterval> | null = null
let tickCount = 0
const activeAlarmKeys = new Set<string>()

const raiseAlarm = (key: string, text: string, level: 'high' | 'mid'): void => {
  if (activeAlarmKeys.has(key)) return
  activeAlarmKeys.add(key)
  gardenAlarms.unshift({ key, time: nowStr(), text, level })
  if (gardenAlarms.length > 20) gardenAlarms.pop()
}

const clearAlarm = (key: string): void => {
  if (!activeAlarmKeys.has(key)) return
  activeAlarmKeys.delete(key)
  const idx = gardenAlarms.findIndex(a => a.key === key)
  if (idx >= 0) gardenAlarms.splice(idx, 1)
}

const tick = (): void => {
  tickCount += 1
  for (const dev of gardenDevices) {
    if (dev.type === 'soil') {
      dev.soilMoisture = walk(dev.soilMoisture || 50, 1.2, 25, 85)
      dev.soilTemp = walk(dev.soilTemp || 25, 0.3, 15, 35)
      if (dev.soilMoisture < 35) {
        raiseAlarm(`dry-${dev.id}`, `${dev.name}土壤湿度过低（${dev.soilMoisture.toFixed(1)}%），建议灌溉`, 'high')
      } else {
        clearAlarm(`dry-${dev.id}`)
      }
    } else if (dev.type === 'weather') {
      dev.airTemp = walk(dev.airTemp || 27, 0.2, 18, 35)
      dev.humidity = walk(dev.humidity || 65, 1.5, 35, 95)
      dev.windSpeed = walk(dev.windSpeed || 2.5, 0.4, 0, 10)
    } else if (dev.type === 'water') {
      dev.dissolvedOxygen = walk(dev.dissolvedOxygen || 7.2, 0.3, 3, 12)
      dev.turbidity = walk(dev.turbidity || 2.1, 0.4, 0.5, 20)
      if ((dev.dissolvedOxygen || 0) < 5) {
        raiseAlarm(`water-${dev.id}`, `${dev.name}溶解氧偏低（${dev.dissolvedOxygen?.toFixed(1)} mg/L），建议增氧`, 'mid')
      } else {
        clearAlarm(`water-${dev.id}`)
      }
    } else if (dev.type === 'insect') {
      dev.insectIndex = Math.round(walk(dev.insectIndex || 12, 4, 0, 100))
      if ((dev.insectIndex || 0) > 60) {
        raiseAlarm(`insect-${dev.id}`, `${dev.name}虫情指数偏高（${dev.insectIndex}），建议排查诱虫情况`, 'mid')
      } else {
        clearAlarm(`insect-${dev.id}`)
      }
    } else if (dev.type === 'irrigation') {
      if (dev.valveOpen) {
        dev.flow = walk(dev.flow || 12, 0.8, 6, 25)
        dev.pressure = walk(dev.pressure || 0.4, 0.02, 0.2, 0.6)
        irrigationToday.value = +(irrigationToday.value + (dev.flow || 0) * 2 / 3600).toFixed(2)
      } else {
        dev.flow = 0
      }
    }
  }

  // 演示用：30 秒后离线摄像头恢复
  if (tickCount === 15) {
    const cam = gardenDevices.find(d => d.id === 'cam-03')
    if (cam) {
      cam.status = 'online'
      clearAlarm(`offline-${cam.id}`)
      raiseAlarm('recover-cam-03', '学生公寓监控已恢复在线', 'mid')
    }
  }

  const weather = gardenDevices.find(d => d.type === 'weather')
  if (weather) {
    sensorHistory.push({
      time: nowStr(),
      soil: gardenDevices.filter(d => d.type === 'soil').reduce((s, d) => s + (d.soilMoisture || 0), 0) / Math.max(1, gardenDevices.filter(d => d.type === 'soil').length),
      air: weather.airTemp || 0,
      humidity: weather.humidity || 0
    })
    if (sensorHistory.length > 30) sensorHistory.shift()
  }
}

export function startSimulator(): void {
  if (timer) return
  // 离线演示时同步启用前端灌溉策略与 AI 识别，保证面板与真实模式行为一致
  import('./irrigation').then(m => m.startMockIrrigation()).catch(() => {})
  import('./ai-recognition').then(m => m.startMockAi()).catch(() => {})
  tick()
  timer = setInterval(tick, 2000)
}

export function stopSimulator(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  import('./irrigation').then(m => m.stopMockIrrigation()).catch(() => {})
  import('./ai-recognition').then(m => m.stopMockAi()).catch(() => {})
}

export type DataSourceMode = 'mock' | 'real'

/** 数据源模式：mock=一期离线演示；real=后端实时推送（默认由 .env VITE_DATA_SOURCE 决定，运行时可一键切换） */
export function dataSourceMode(): DataSourceMode {
  const v = (import.meta.env as any).VITE_DATA_SOURCE
  return v === 'real' ? 'real' : 'mock'
}

export const dataSourceState = reactive({
  mode: dataSourceMode() as DataSourceMode,
  wsConnected: false,
  lastError: ''
})

let dataSourceStarted = false

/** 按环境变量选择数据源驱动；真实模式下由 src/libs/smart-garden/realtime.ts 接管同一份响应式数据 */
export function startDataSource(): void {
  if (dataSourceStarted) return
  dataSourceStarted = true
  if (dataSourceState.mode === 'real') {
    startRealDriver()
  } else {
    startSimulator()
  }
}

async function startRealDriver(): Promise<void> {
  try {
    const { startRealtime, checkBackend } = await import('./realtime')
    const ok = await checkBackend()
    if (!ok) throw new Error('后端服务不可用')
    startRealtime()
  } catch (e) {
    console.warn('[data-source] 实时数据源启动失败，回退到离线演示：', e)
    dataSourceState.mode = 'mock'
    dataSourceState.lastError = String((e as Error)?.message || e)
    startSimulator()
  }
}

/** 运行时一键切换数据源；返回是否成功切换到 real */
export async function switchDataSource(mode: DataSourceMode): Promise<boolean> {
  if (mode === dataSourceState.mode) return mode === 'real' ? dataSourceState.wsConnected : true
  const { stopRealtime, checkBackend } = await import('./realtime')
  stopRealtime()
  stopSimulator()
  dataSourceState.lastError = ''
  dataSourceState.wsConnected = false

  if (mode === 'real') {
    const ok = await checkBackend()
    if (!ok) {
      dataSourceState.lastError = '后端服务不可用，已保留离线演示'
      startSimulator()
      return false
    }
    dataSourceState.mode = 'real'
    const m = await import('./realtime')
    m.startRealtime()
    return true
  }

  dataSourceState.mode = 'mock'
  startSimulator()
  return true
}

export const deviceTypeText: Record<DeviceType, string> = {
  soil: '土壤传感',
  weather: '气象站',
  irrigation: '灌溉阀',
  camera: '视频监控',
  water: '水质监测',
  insect: '虫情测报'
}

export function deviceMetricText(dev: GardenDevice): string {
  if (dev.status === 'offline') return '——'
  if (dev.type === 'soil') return `湿度 ${dev.soilMoisture?.toFixed(1)}% / ${dev.soilTemp?.toFixed(1)}℃`
  if (dev.type === 'weather') return `${dev.airTemp?.toFixed(1)}℃ / 湿度 ${dev.humidity?.toFixed(0)}%`
  if (dev.type === 'irrigation') return dev.valveOpen ? `${dev.flow?.toFixed(1)} m³/h` : '阀门关闭'
  if (dev.type === 'water') return `溶解氧 ${dev.dissolvedOxygen?.toFixed(1)} mg/L / 浊度 ${dev.turbidity?.toFixed(1)} NTU`
  if (dev.type === 'insect') return `虫情指数 ${dev.insectIndex ?? '——'}`
  return '在线'
}
