// 视频监控前端数据层：流地址解析 + 云台状态 + 取流弹窗状态
// 真实模式：流描述来自 GET /api/cameras，云台走 POST /api/cameras/:id/ptz
// 离线模式：直接使用本地流配置，云台在本地更新（与后端约束一致）
import { computed, reactive, ref } from 'vue'
import { gardenDevices, dataSourceState, type GardenDevice } from './simulator'
import { requestSceneRender } from './render-bus'

const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'
const BASE_URL: string = (import.meta.env as any).BASE_URL || '/'

export type StreamType = 'mp4-demo' | 'hls' | 'webrtc' | 'gb28181'

export interface CameraStreamCfg {
  type: StreamType
  url: string
  resolution: string
  fps: number
  /** 视域锥初始朝向（方位角，正北为 0） */
  heading: number
  /** 视域锥俯仰角 */
  pitch: number
  /** 视域锥张角 */
  fov: number
}

/** 与后端 server/src/cameras.js 的 CAMERA_STREAMS 保持一致（含 3D 视域锥参数） */
export const CAMERA_STREAMS: Record<string, CameraStreamCfg> = {
  'cam-01': { type: 'mp4-demo', url: '/static/35.mp4', resolution: '1920x1080', fps: 25, heading: 180, pitch: -35, fov: 60 },
  'cam-02': { type: 'mp4-demo', url: '/static/35.mp4', resolution: '1920x1080', fps: 25, heading: 315, pitch: -35, fov: 60 },
  'cam-03': { type: 'mp4-demo', url: '/static/35.mp4', resolution: '1920x1080', fps: 25, heading: 45, pitch: -35, fov: 60 },
  'cam-04': { type: 'mp4-demo', url: '/static/35.mp4', resolution: '1920x1080', fps: 25, heading: 225, pitch: -35, fov: 60 },
  'cam-05': { type: 'mp4-demo', url: '/static/35.mp4', resolution: '1920x1080', fps: 25, heading: 0, pitch: -35, fov: 60 }
}

export const cameraDevices = computed<GardenDevice[]>(() => gardenDevices.filter(d => d.type === 'camera'))
export const cameraOnlineCount = computed(() => cameraDevices.value.filter(d => d.status === 'online').length)

// ---------- 云台 ----------
export interface PtzState { pan: number; tilt: number; zoom: number }
export const ptzState = reactive<Record<string, PtzState>>({})

function ensurePtz(id: string): PtzState {
  if (!ptzState[id]) {
    const cfg = CAMERA_STREAMS[id]
    ptzState[id] = { pan: cfg ? cfg.heading : 0, tilt: cfg ? cfg.pitch : -35, zoom: 1 }
  }
  return ptzState[id]
}
for (const id of Object.keys(CAMERA_STREAMS)) ensurePtz(id)

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))

function applyPtzLocal(id: string, dPan: number, dTilt: number, dZoom: number): void {
  const p = ensurePtz(id)
  p.pan = clamp((p.pan + dPan + 360) % 360, 0, 360)
  p.tilt = clamp(p.tilt + dTilt, -90, 30)
  p.zoom = clamp(+(p.zoom + dZoom).toFixed(1), 1, 4)
  requestSceneRender()
}

/** 云台步进：mock 本地更新；real 先本地生效再异步同步后端（失败不回滚，仅提示） */
export async function adjustPtz(id: string, dPan: number, dTilt: number, dZoom: number): Promise<void> {
  applyPtzLocal(id, dPan, dTilt, dZoom)
  if (dataSourceState.mode === 'mock') return
  const p = ptzState[id]
  try {
    await fetch(`${API_BASE}/api/cameras/${id}/ptz`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pan: p.pan, tilt: p.tilt, zoom: p.zoom })
    })
  } catch { /* 后端不可达时保留本地云台状态 */ }
}

export async function resetPtz(id: string): Promise<void> {
  const cfg = CAMERA_STREAMS[id]
  if (!cfg) return
  const p = ensurePtz(id)
  p.pan = cfg.heading; p.tilt = cfg.pitch; p.zoom = 1
  requestSceneRender()
  if (dataSourceState.mode === 'mock') return
  try {
    await fetch(`${API_BASE}/api/cameras/${id}/ptz`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pan: p.pan, tilt: p.tilt, zoom: p.zoom })
    })
  } catch { /* 同上 */ }
}

// ---------- 流地址解析 ----------
export function streamCfg(id: string): CameraStreamCfg | null {
  return CAMERA_STREAMS[id] || null
}

export function streamLabel(id: string): string {
  const cfg = CAMERA_STREAMS[id]
  if (!cfg) return '未知'
  switch (cfg.type) {
    case 'mp4-demo': return '演示流 · MP4 循环'
    case 'hls': return 'HLS 拉流'
    case 'webrtc': return 'WebRTC'
    case 'gb28181': return 'GB28181'
    default: return cfg.type
  }
}

/** 演示流资源在前端 public 目录，按 BASE_URL 解析；生产流地址由后端原样下发 */
export function resolveStreamUrl(id: string): string {
  const cfg = CAMERA_STREAMS[id]
  if (!cfg) return ''
  if (cfg.type === 'mp4-demo') return BASE_URL + cfg.url.replace(/^\//, '')
  return cfg.url
}

// ---------- 取流弹窗 ----------
export const activeCameraId = ref<string | null>(null)
export const activeCamera = computed<GardenDevice | null>(
  () => (activeCameraId.value ? gardenDevices.find(d => d.id === activeCameraId.value) || null : null)
)
export const activeStreamUrl = computed(() => (activeCameraId.value ? resolveStreamUrl(activeCameraId.value) : ''))

let openedAtMs = 0

export function openCamera(id: string): void {
  if (!CAMERA_STREAMS[id]) return
  activeCameraId.value = id
  openedAtMs = Date.now()
}

export function closeCamera(): void {
  activeCameraId.value = null
}

/**
 * 地图上点击摄像头取流时，同一次点击的 click 事件会落在随后出现的遮罩上，
 * 导致弹窗刚打开就被 @click.self 立即关闭；打开瞬间的遮罩点击不作为关闭指令。
 */
export function maskClickShouldClose(): boolean {
  return Date.now() - openedAtMs > 400
}
