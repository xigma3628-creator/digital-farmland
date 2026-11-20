// 植被一张图前端数据层：开关状态 + 苗木列表 + 点击弹窗状态（与 camera.ts 的弹窗模式一致）
// 大屏面板只读；档案的增删改在管理端/接口侧完成
import { ref } from 'vue'

const API_BASE: string = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'

export interface TreeAsset {
  id: number
  code: string
  species: string
  latin: string
  zone: string
  lon: number
  lat: number
  age: number
  diameterCm: number
  photo: string
  healthScore: number
  status: string
  ancient: number
  lastCareAt: string
  note: string
}

export const treesVisible = ref(false)
export const trees = ref<TreeAsset[]>([])
export const treesLoading = ref(false)
export const activeTree = ref<TreeAsset | null>(null)

let loaded = false

export async function fetchTrees(force = false): Promise<void> {
  if (loaded && !force) return
  treesLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/tree-assets`)
    const data = await res.json()
    if (data.ok) {
      trees.value = data.items || []
      loaded = true
    }
  } catch {
    // 后端不可达时保持空列表，面板仍可关闭
  } finally {
    treesLoading.value = false
  }
}

/** 健康分三档配色：≥80 绿 / 60-79 橙 / <60 红 */
export function healthColor(score: number): string {
  if (score >= 80) return '#38e08a'
  if (score >= 60) return '#ffb454'
  return '#ff4d4f'
}

export function openTree(tree: TreeAsset): void {
  activeTree.value = tree
}

export function closeTree(): void {
  activeTree.value = null
}

export async function setTreesVisible(visible: boolean): Promise<void> {
  treesVisible.value = visible
  if (visible) {
    await fetchTrees()
  } else {
    closeTree()
  }
}
