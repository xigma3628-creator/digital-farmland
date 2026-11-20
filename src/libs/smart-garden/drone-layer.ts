// 十期：大屏"巡检回放"数据层。任务/帧拉取 + 播放时钟 + 照片弹窗状态。
// 与 tree-layer.ts 同模式：大屏只读，数据来自 /api/drone/*；
// 3D 实体（航线/飞机/照片标记）由 garden-layer 按 droneEnabled/droneMissionId/droneFrames 重建。
import { ref, computed } from 'vue'
import { requestSceneRender } from './render-bus'

const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'

export interface DroneWaypoint { seq: number; lon: number; lat: number; alt: number }
export interface DroneMission {
  id: number
  missionNo: string
  name: string
  zone: string
  route: DroneWaypoint[]
  status: string
  assignee: string | null
  startedAt: string | null
  endedAt: string | null
  distanceM: number | null
  coverageM2: number | null
  battery: number | null
  remark: string | null
}
export interface DroneFrameAi { kind: string; label: string; confidence: number; advice: string }
export interface DroneFrame {
  id: number
  missionId: number
  seq: number
  lon: number
  lat: number
  alt: number
  imagePath: string
  takenAt: string
  source: string
  aiResultId: number | null
  priority: number
  inferStatus: string
  createdAt: string
  aiResult?: DroneFrameAi | null
}

export const droneEnabled = ref(false)
export const droneMissions = ref<DroneMission[]>([])
export const droneMissionId = ref<number | null>(null)
export const droneFrames = ref<DroneFrame[]>([])
/** 播放时钟（秒）：滑块与飞机插值共用的唯一时间源 */
export const droneClock = ref(0)
export const dronePlaying = ref(false)
export const activeDroneFrame = ref<DroneFrame | null>(null)

/** 每段航线的播放秒数（演示节奏，非真实航时） */
const SEGMENT_SECONDS = 6
const TICK_MS = 100
const CLOCK_STEP = 0.3

export const activeMission = computed<DroneMission | null>(() =>
  droneMissions.value.find(m => m.id === droneMissionId.value) || null)

export const droneDuration = computed(() => {
  const n = activeMission.value?.route?.length || 0
  return n > 1 ? (n - 1) * SEGMENT_SECONDS : 0
})

let playTimer: ReturnType<typeof setInterval> | null = null

function stopPlayLoop(): void {
  if (playTimer !== null) {
    clearInterval(playTimer)
    playTimer = null
  }
  dronePlaying.value = false
}

function startPlayLoop(): void {
  if (playTimer !== null) return
  dronePlaying.value = true
  // requestRenderMode 下 CallbackProperty 不会自动出帧，播放循环负责推进时钟并逐 tick 请求渲染
  playTimer = setInterval(() => {
    droneClock.value = Math.min(droneClock.value + CLOCK_STEP, droneDuration.value)
    if (droneClock.value >= droneDuration.value) stopPlayLoop()
    requestSceneRender()
  }, TICK_MS)
}

export function toggleDronePlay(): void {
  if (dronePlaying.value) {
    stopPlayLoop()
  } else {
    if (droneClock.value >= droneDuration.value) droneClock.value = 0
    startPlayLoop()
  }
}

export function setDroneClock(v: number): void {
  droneClock.value = Math.max(0, Math.min(v, droneDuration.value))
  requestSceneRender()
}

export async function fetchDroneMissions(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/drone/missions`)
    const data = await res.json()
    if (data.ok) droneMissions.value = data.missions || []
  } catch {
    // 后端不可达时保持空列表
  }
}

export async function fetchDroneFrames(missionId: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/drone/frames?missionId=${missionId}`)
    const data = await res.json()
    droneFrames.value = data.ok ? (data.frames || []) : []
  } catch {
    droneFrames.value = []
  }
}

export function frameImageUrl(frame: DroneFrame): string {
  return `${API_BASE}/api/drone/frames/${frame.id}/image`
}

export async function setDroneEnabled(v: boolean): Promise<void> {
  droneEnabled.value = v
  stopPlayLoop()
  droneClock.value = 0
  droneFrames.value = []
  closeDroneFrame()
  requestSceneRender()
  if (v) {
    await fetchDroneMissions()
    if (!droneMissionId.value && droneMissions.value.length) droneMissionId.value = droneMissions.value[0].id
    if (droneMissionId.value) await fetchDroneFrames(droneMissionId.value)
    requestSceneRender()
  }
}

export async function selectDroneMission(id: number): Promise<void> {
  if (droneMissionId.value === id) return
  droneMissionId.value = id
  stopPlayLoop()
  droneClock.value = 0
  closeDroneFrame()
  await fetchDroneFrames(id)
  requestSceneRender()
}

export function openDroneFrame(frame: DroneFrame): void {
  activeDroneFrame.value = frame
}

export function closeDroneFrame(): void {
  activeDroneFrame.value = null
}

/** 第 i 个航点的播放时刻 */
export function waypointTime(i: number): number {
  return i * SEGMENT_SECONDS
}

/** 播放时钟 t 对应的航线位置（航点间线性插值） */
export function positionAt(route: DroneWaypoint[], t: number): DroneWaypoint | null {
  if (!route.length) return null
  if (route.length === 1) return route[0]
  const clamped = Math.max(0, Math.min(t, droneDuration.value))
  const f = clamped / SEGMENT_SECONDS
  const k = Math.min(Math.floor(f), route.length - 2)
  const frac = f - k
  const a = route[k]
  const b = route[k + 1]
  return {
    seq: k,
    lon: a.lon + (b.lon - a.lon) * frac,
    lat: a.lat + (b.lat - a.lat) * frac,
    alt: a.alt + (b.alt - a.alt) * frac
  }
}

/** 帧归属航点：按平面距离取最近航点下标 */
export function nearestWaypointIndex(route: DroneWaypoint[], lon: number, lat: number): number {
  let best = 0
  let bestD = Infinity
  route.forEach((w, i) => {
    const d = (w.lon - lon) ** 2 + (w.lat - lat) ** 2
    if (d < bestD) { bestD = d; best = i }
  })
  return best
}

export const MISSION_STATUS_TEXT: Record<string, string> = {
  planned: '待执行',
  flying: '飞行中',
  done: '已完成',
  aborted: '已中止'
}
