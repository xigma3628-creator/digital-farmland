<template>
  <div style="display: none;"></div>
</template>

<script lang="ts">
import { defineComponent, inject, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import { Cartesian3, CallbackProperty, Color, CustomDataSource, VerticalOrigin } from 'cesium'
import { PARK_BOUNDARY, PARK_ZONES, gardenDevices, gardenAlarms } from '@/libs/smart-garden/simulator'
import { CAMPUS_CENTER, CAMPUS_LABEL } from '@/libs/smart-garden/campus-data'
import { CAMERA_STREAMS, ptzState, openCamera } from '@/libs/smart-garden/camera'
import { treesVisible, trees, openTree, healthColor } from '@/libs/smart-garden/tree-layer'
import { requestSceneRender } from '@/libs/smart-garden/render-bus'
import {
  droneEnabled, droneMissionId, droneFrames, droneClock,
  activeMission, openDroneFrame, positionAt, waypointTime, nearestWaypointIndex
} from '@/libs/smart-garden/drone-layer'

const TYPE_COLORS: Record<string, Color> = {
  soil: Color.ORANGE,
  weather: Color.CYAN,
  irrigation: Color.DODGERBLUE,
  camera: Color.YELLOW,
  water: Color.MEDIUMPURPLE,
  insect: Color.GREENYELLOW
}

// 无人机图标（内联 SVG，避免新增静态资源与依赖）
const DRONE_ICON = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">'
  + '<g stroke="#7cfc9c" stroke-width="4" stroke-linecap="round" opacity="0.9">'
  + '<line x1="32" y1="32" x2="15" y2="15"/><line x1="32" y1="32" x2="49" y2="15"/>'
  + '<line x1="32" y1="32" x2="15" y2="49"/><line x1="32" y1="32" x2="49" y2="49"/></g>'
  + '<circle cx="15" cy="15" r="7" fill="none" stroke="#7cfc9c" stroke-width="3"/>'
  + '<circle cx="49" cy="15" r="7" fill="none" stroke="#7cfc9c" stroke-width="3"/>'
  + '<circle cx="15" cy="49" r="7" fill="none" stroke="#7cfc9c" stroke-width="3"/>'
  + '<circle cx="49" cy="49" r="7" fill="none" stroke="#7cfc9c" stroke-width="3"/>'
  + '<circle cx="32" cy="32" r="9" fill="#38e08a" stroke="#ffffff" stroke-width="2"/></svg>'
)

/**
 * 智慧园林图层：园区边界 + 功能分区 + 设备点位
 */
export default defineComponent({
  name: 'garden-layer',
  setup() {
    const route = useRoute()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const dataSource: CustomDataSource = new CustomDataSource('smart-garden')

    const buildBoundary = (): void => {
      const flat = PARK_BOUNDARY.reduce<number[]>((arr, p) => arr.concat(p), [])
      dataSource.entities.add({
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray(flat),
          material: Color.LIME.withAlpha(0.06),
          outline: false
        },
        polyline: {
          positions: Cartesian3.fromDegreesArray(flat),
          width: 4,
          clampToGround: true,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            color: Color.LIME
          })
        }
      })
      dataSource.entities.add({
        position: Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat, 10),
        label: {
          text: CAMPUS_LABEL,
          font: 'bold 16pt "Microsoft YaHei", sans-serif',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 30000.0)
        }
      })
    }

    const buildZones = (): void => {
      for (const zone of PARK_ZONES) {
        const flat = zone.ring.reduce<number[]>((arr, p) => arr.concat(p), [])
        const cx = zone.ring.reduce((s, p) => s + p[0], 0) / zone.ring.length
        const cy = zone.ring.reduce((s, p) => s + p[1], 0) / zone.ring.length
        dataSource.entities.add({
          polygon: {
            hierarchy: Cartesian3.fromDegreesArray(flat),
            material: Color.fromCssColorString(zone.color).withAlpha(0.3),
            outline: true,
            outlineColor: Color.fromCssColorString(zone.color),
            outlineWidth: 1
          }
        })
        dataSource.entities.add({
          position: Cartesian3.fromDegrees(cx, cy, 2),
          label: {
            text: zone.name,
            font: '11pt "Microsoft YaHei", sans-serif',
            fillColor: Color.WHITE.withAlpha(0.9),
            outlineColor: Color.BLACK,
            outlineWidth: 1,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 6000.0)
          }
        })
      }
    }

    const buildDevices = (): void => {
      gardenDevices.forEach(dev => {
        dataSource.entities.add({
          id: 'sg-dev-' + dev.id,
          position: Cartesian3.fromDegrees(dev.lon, dev.lat, 2),
          point: {
            pixelSize: dev.type === 'camera' ? 12 : 10,
            color: new CallbackProperty(
              () => (dev.status === 'offline' ? Color.RED : TYPE_COLORS[dev.type] || Color.WHITE),
              false
            ),
            outlineColor: new CallbackProperty(
              () => (dev.status === 'offline' ? Color.RED.withAlpha(0.5) : Color.WHITE),
              false
            ),
            outlineWidth: 2
          },
          label: {
            text: dev.name,
            font: '11pt "Microsoft YaHei", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 8000.0)
          }
        })
        // 摄像头视域锥：随云台方位角旋转，离线时隐藏
        if (dev.type === 'camera' && CAMERA_STREAMS[dev.id]) {
          const cfg = CAMERA_STREAMS[dev.id]
          const camPos = Cartesian3.fromDegrees(dev.lon, dev.lat, 9)
          dataSource.entities.add({
            id: 'sg-viewshed-' + dev.id,
            position: camPos,
            orientation: new CallbackProperty(() => {
              const pan = ptzState[dev.id] ? ptzState[dev.id].pan : cfg.heading
              const hpr = new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(pan),
                Cesium.Math.toRadians(cfg.pitch),
                0
              )
              return Cesium.Transforms.headingPitchRollQuaternion(camPos, hpr)
            }, false),
            cylinder: {
              length: 26,
              topRadius: 0.3,
              bottomRadius: 13,
              material: Color.YELLOW.withAlpha(0.14),
              outline: false,
              show: new CallbackProperty(() => dev.status === 'online', false)
            }
          })
          // AI 病虫害告警光圈：该摄像头存在未消除的 ai-pest 告警时显示
          dataSource.entities.add({
            id: 'sg-aialarm-' + dev.id,
            position: Cartesian3.fromDegrees(dev.lon, dev.lat),
            ellipse: {
              semiMajorAxis: 16,
              semiMinorAxis: 16,
              material: Color.RED.withAlpha(0.22),
              outline: true,
              outlineColor: Color.RED.withAlpha(0.8),
              show: new CallbackProperty(
                () => gardenAlarms.some(a => a.key === 'ai-pest-' + dev.id),
                false
              )
            }
          })
        }
      })
    }

    let clickHandler: Cesium.ScreenSpaceEventHandler | null = null
    const bindCameraClick = (): void => {
      if (!viewer) return
      clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      clickHandler.setInputAction((movement: any) => {
        const picked = viewer!.scene.pick(movement.position)
        const id = picked && picked.id ? picked.id.id : null
        // 视域锥通常比点位先被拾取，两种实体 id 都要识别；
        // 只剥掉命名空间前缀，保留完整的设备 id（cam-01）
        if (typeof id === 'string' && /^sg-(dev|viewshed)-cam-/.test(id)) {
          openCamera(id.replace(/^sg-(dev|viewshed)-/, ''))
        } else if (typeof id === 'string' && id.startsWith('sg-tree-')) {
          const treeId = Number(id.slice('sg-tree-'.length))
          const tree = trees.value.find(t => t.id === treeId)
          if (tree) openTree(tree)
        } else if (typeof id === 'string' && id.startsWith('sg-drone-frame-')) {
          const frameId = Number(id.slice('sg-drone-frame-'.length))
          const frame = droneFrames.value.find(f => f.id === frameId)
          if (frame) openDroneFrame(frame)
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
      console.info('[cam-click] bound to canvas')
    }

    // 植被一张图：开关开启后按 health_score 分档渲染轻量点实体，关闭即整体移除
    let treeEntities: Cesium.Entity[] = []
    const applyTrees = (): void => {
      if (!viewer) return
      for (const e of treeEntities) dataSource.entities.remove(e)
      treeEntities = []
      if (treesVisible.value) {
        for (const t of trees.value) {
          treeEntities.push(dataSource.entities.add({
            id: `sg-tree-${t.id}`,
            position: Cartesian3.fromDegrees(t.lon, t.lat, 2),
            point: {
              pixelSize: t.ancient === 1 ? 11 : 8,
              color: Color.fromCssColorString(healthColor(t.healthScore)),
              outlineColor: t.ancient === 1 ? Color.MAGENTA : Color.WHITE,
              outlineWidth: 2
            }
          }))
        }
      }
      // 按需渲染模式下实体增删不自动出帧，显式请求一次
      requestSceneRender()
    }
    watch(treesVisible, applyTrees, { immediate: true })
    watch(trees, applyTrees, { deep: true })

    // 巡检回放：开关/任务/帧数据任一变化即整体重建回放实体（数量小，整体重建最省心）
    let droneEntities: Cesium.Entity[] = []
    const removeDroneEntities = (): void => {
      for (const e of droneEntities) dataSource.entities.remove(e)
      droneEntities = []
    }
    const rebuildDrone = (): void => {
      removeDroneEntities()
      const mission = activeMission.value
      const route = mission?.route || []
      if (droneEnabled.value && route.length > 1) {
        // 航线折线（带高度，不贴地）
        droneEntities.push(dataSource.entities.add({
          id: 'sg-drone-route',
          polyline: {
            positions: Cartesian3.fromDegreesArrayHeights(route.flatMap(w => [w.lon, w.lat, w.alt])),
            width: 3,
            material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.3, color: Color.CYAN })
          }
        }))
        // 已过航点小圆点：播放时钟越过该航点时刻后才显示
        route.forEach((w, i) => {
          droneEntities.push(dataSource.entities.add({
            id: `sg-drone-wp-${i}`,
            position: Cartesian3.fromDegrees(w.lon, w.lat, w.alt),
            point: {
              pixelSize: 8,
              color: Color.CYAN,
              outlineColor: Color.WHITE,
              outlineWidth: 1,
              show: new CallbackProperty(() => droneClock.value >= waypointTime(i), false)
            }
          }))
        })
        // 飞机图标：按 elapsed 时间在航点间线性插值（position 需 PositionProperty 子类）
        droneEntities.push(dataSource.entities.add({
          id: 'sg-drone-plane',
          position: new Cesium.CallbackPositionProperty(() => {
            const p = positionAt(route, droneClock.value) || route[0]
            return Cartesian3.fromDegrees(p.lon, p.lat, p.alt)
          }, false),
          billboard: {
            image: DRONE_ICON,
            width: 30,
            height: 30,
            verticalOrigin: VerticalOrigin.CENTER
          },
          label: {
            text: '巡检无人机',
            font: '11pt "Microsoft YaHei", sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 1,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -22),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 20000.0)
          }
        }))
        // 有照片的航点：飞机经过后显示照片标记（priority=1 高亮橙色），点击打开缩略图+识别结果
        for (const f of droneFrames.value) {
          const wpIndex = nearestWaypointIndex(route, f.lon, f.lat)
          const passed = new CallbackProperty(() => droneClock.value >= waypointTime(wpIndex), false)
          droneEntities.push(dataSource.entities.add({
            id: `sg-drone-frame-${f.id}`,
            position: Cartesian3.fromDegrees(f.lon, f.lat, f.alt),
            point: {
              pixelSize: f.priority === 1 ? 12 : 9,
              color: f.priority === 1 ? Color.ORANGE : Color.YELLOW,
              outlineColor: Color.WHITE,
              outlineWidth: 1,
              show: passed
            },
            label: {
              text: `照片${f.seq}`,
              font: '10pt "Microsoft YaHei", sans-serif',
              fillColor: Color.YELLOW,
              outlineColor: Color.BLACK,
              outlineWidth: 1,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -12),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 8000.0),
              show: passed
            }
          }))
        }
      }
      // 按需渲染：回放实体增删后显式请求一帧
      requestSceneRender()
    }
    watch([droneEnabled, droneMissionId, droneFrames], rebuildDrone, { immediate: true })

    const syncShow = (): void => {
      dataSource.show = route.name === 'smart-garden'
    }

    // 按需渲染：相机静止时不再 60fps 空转全屏重绘（集成显卡卡顿主因）。
    // 瓦片加载由 Cesium 自动出帧；相机运动期间本版本不会自动逐帧渲染
    // （飞行 tween 只在真正渲染时推进），故挂 moveStart/moveEnd 逐帧补帧；
    // 数据驱动的 3D 变化（状态灯/告警环）用 2s 心跳兜底；画布鼠标移动
    // 兜底测量/绘制类交互反馈。
    let renderHeartbeat: ReturnType<typeof setInterval> | null = null
    let removeCanvasMoveListener: (() => void) | null = null
    let removeMoveStartListener: (() => void) | null = null
    let removeMoveEndListener: (() => void) | null = null
    let movePumpTimer: ReturnType<typeof setTimeout> | null = null

    // 16ms 泵只负责置 requestRender 标志，真实出帧节奏仍由渲染循环决定
    const renderEachFrame = (): void => {
      requestSceneRender()
      movePumpTimer = setTimeout(renderEachFrame, 16)
    }

    const stopMovePump = (): void => {
      if (movePumpTimer !== null) {
        clearTimeout(movePumpTimer)
        movePumpTimer = null
      }
    }

    const enableOnDemandRender = (): void => {
      if (!viewer) return
      const scene = viewer.scene
      scene.requestRenderMode = true
      scene.maximumRenderTimeChange = Infinity
      renderHeartbeat = setInterval(requestSceneRender, 2000)
      const canvas = scene.canvas
      const onCanvasMove = (): void => requestSceneRender()
      canvas.addEventListener('pointermove', onCanvasMove)
      removeCanvasMoveListener = (): void => canvas.removeEventListener('pointermove', onCanvasMove)
      removeMoveStartListener = viewer.camera.moveStart.addEventListener((): void => {
        if (movePumpTimer === null) renderEachFrame()
      })
      removeMoveEndListener = viewer.camera.moveEnd.addEventListener(stopMovePump)
    }

    const disableOnDemandRender = (): void => {
      stopMovePump()
      if (removeMoveStartListener) {
        removeMoveStartListener()
        removeMoveStartListener = null
      }
      if (removeMoveEndListener) {
        removeMoveEndListener()
        removeMoveEndListener = null
      }
      if (renderHeartbeat !== null) {
        clearInterval(renderHeartbeat)
        renderHeartbeat = null
      }
      if (removeCanvasMoveListener) {
        removeCanvasMoveListener()
        removeCanvasMoveListener = null
      }
      if (viewer) {
        viewer.scene.requestRenderMode = false
        viewer.scene.maximumRenderTimeChange = 0
      }
    }

    onMounted(() => {
      if (!viewer) return
      buildBoundary()
      buildZones()
      buildDevices()
      viewer.dataSources.add(dataSource)
      bindCameraClick()
      syncShow()
      enableOnDemandRender()
    })

    watch(() => route.name, syncShow, { immediate: true })

    onUnmounted(() => {
      disableOnDemandRender()
      if (clickHandler) {
        clickHandler.destroy()
        clickHandler = null
      }
      viewer?.dataSources.remove(dataSource, true)
    })
  }
})
</script>
