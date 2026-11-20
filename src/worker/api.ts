// 十一期：工人端统一请求层。与管理端 api.ts 同范式，但 token 存 worker_token，
// 401 清会话后跳工人端登录页（不是管理端登录页）。
const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'

const TOKEN_KEY = 'worker_token'
const USER_KEY = 'worker_user'

export interface WorkerUser {
  username: string
  role: string
  displayName: string
}

export interface WorkOrder {
  id: number
  orderNo: string
  title: string
  description: string
  orderType: string
  priority: number
  status: string
  zone: string
  location: string
  sourceAlarm: string | null
  reporter: string
  assignee: string | null
  images: string[]
  cost: number | null
  resolution: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkOrderEvent {
  id: number
  orderId: number
  fromStatus: string | null
  toStatus: string
  operator: string
  note: string
  ts: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getUser(): WorkerUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as WorkerUser) : null
  } catch {
    return null
  }
}

export function saveSession(token: string, user: WorkerUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function redirectToLogin(): void {
  clearSession()
  if (!window.location.hash.startsWith('#/worker-login')) {
    window.location.hash = '#/worker-login'
  }
}

export async function apiJson<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    })
  } catch {
    throw new ApiError('无法连接后端服务，请确认 server 已启动', 0)
  }
  if (res.status === 401) {
    redirectToLogin()
    throw new ApiError('登录已过期，请重新登录', 401)
  }
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `请求失败（HTTP ${res.status}）`, res.status)
  return data as T
}

export async function loginWorker(username: string, password: string): Promise<WorkerUser> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
  } catch {
    throw new ApiError('无法连接后端服务，请确认 server 已启动', 0)
  }
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || '登录失败', res.status)
  if (data.role !== 'worker') throw new ApiError('请使用工人账号登录', 403)
  const user: WorkerUser = { username: data.username, role: data.role, displayName: data.displayName }
  saveSession(data.token, user)
  return user
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form
    })
  } catch {
    throw new ApiError('无法连接后端服务，请确认 server 已启动', 0)
  }
  if (res.status === 401) {
    redirectToLogin()
    throw new ApiError('登录已过期，请重新登录', 401)
  }
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `照片上传失败（HTTP ${res.status}）`, res.status)
  return data.url as string
}

/** 工单里存的可能是 /api/uploads 相对路径，<img> 需要拼成后端绝对地址 */
export function resolveUrl(url: string): string {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return url.startsWith('/') ? API_BASE + url : `${API_BASE}/${url}`
}
