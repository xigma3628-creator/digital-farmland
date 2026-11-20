import { CesiumBridge } from 'cesium-mcp-bridge'
import type { Viewer } from 'cesium'

/**
 * 把 viewer 接入 cesium-mcp-runtime：
 * 页面侧 WebSocket -> runtime -> MCP -> AI 助手
 * runtime 未启动时每 3s 自动重连，静默降级
 */
let connected = false

export function connectAiBridge(viewer: Viewer, session = 'smart-garden', url = 'ws://localhost:9100'): void {
  if (connected) return
  connected = true
  const bridge = new CesiumBridge(viewer)
  let ws: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const retry = (): void => {
    if (retryTimer) return
    retryTimer = setTimeout(() => {
      retryTimer = null
      connect()
    }, 3000)
  }

  const connect = (): void => {
    try {
      ws = new WebSocket(`${url}?session=${session}`)
    } catch {
      retry()
      return
    }
    ws.onopen = () => {
      // eslint-disable-next-line no-console
      console.info('[ai-bridge] connected to cesium-mcp-runtime')
    }
    ws.onmessage = async event => {
      try {
        const { id, method, params } = JSON.parse(event.data as string)
        const result = await bridge.execute({ action: method, params })
        ws?.send(JSON.stringify({ id, result }))
      } catch (e) {
        try {
          ws?.send(JSON.stringify({ id: (JSON.parse(event.data as string) || {}).id, error: String(e) }))
        } catch {
          /* ignore */
        }
      }
    }
    ws.onclose = () => {
      ws = null
      retry()
    }
    ws.onerror = () => {
      ws?.close()
    }
  }

  connect()
}
