// requestRenderMode 下的显式出帧入口：数据或交互改变了 3D 表现时调用
export function requestSceneRender(): void {
  const v = (window as unknown as { viewer?: { scene?: { requestRender: () => void } } }).viewer
  if (v && v.scene) v.scene.requestRender()
}
