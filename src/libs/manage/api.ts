// 管理端统一请求层：token 注入与 401 跳转集中在这里，避免各页面重复处理
const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'

const TOKEN_KEY = 'garden_token'
const USER_KEY = 'garden_user'

export type ManageRole = 'admin' | 'worker' | 'engineer' | 'viewer'

export interface ManageUser {
  username: string
  role: ManageRole
  displayName: string
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

export function getUser(): ManageUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as ManageUser) : null
  } catch {
    return null
  }
}

function saveSession(token: string, user: ManageUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function redirectToLogin(): void {
  clearSession()
  if (!window.location.hash.startsWith('#/manage-login')) {
    window.location.hash = '#/manage-login'
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

export async function login(username: string, password: string): Promise<ManageUser> {
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
  const user: ManageUser = { username: data.username, role: data.role, displayName: data.displayName }
  saveSession(data.token, user)
  return user
}

export function logout(): void {
  clearSession()
}
