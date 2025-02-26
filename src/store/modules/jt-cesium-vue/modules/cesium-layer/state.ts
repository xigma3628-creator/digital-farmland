export type DfLayers = {
  name: string
  uuid: string
  state:string
}

export type State = {
  // showBrowserPanel: boolean
  // showToolbar: boolean
  // showSettingButton: boolean
  // toolbarHeight: number
  // overlayDynamicViews: OverlayDynamicView[]
  layers: DfLayers[]
}
export const defaultState = (): State => {
  return {
    layers: [],
  }
}
export const state: State = defaultState()
