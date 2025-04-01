<template>
  <div style="display: none;"></div>
</template>

<script lang="ts">


import { computed, defineComponent, inject, onMounted } from 'vue'
import { useStore } from '@/store'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import {
  JTPrimitiveActionTypes
} from '@/store/modules/jt-cesium-vue/modules/cesium-data/modules/jt-primitive/action-types'
import calculatePrimitiveCenter from '@/libs/cesium/libs/calculate-primitive-center'
import * as Cesium from 'cesium'
import GUI from 'lil-gui'
import { Cartesian3 } from 'cesium'

export default defineComponent({
  name: 'house-greenery-layer',
  setup() {
    const store = useStore()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const syncJTPrimitive = (): void => {
      store.dispatch(
        `jtCesiumVue/cesiumData/jtPrimitive/${JTPrimitiveActionTypes.SYNC_JTPRIMITIVES}`,
        cesiumRef?.viewer
      )
    }
    const add3DTilese = async (viewer: Cesium.Viewer) => {
      // 定义初始偏移量（单位：米，东/北/上方向）
      const controls = {
        offsetEast: -106.1,
        offsetNorth: -21.6,
        offsetUp: 0
      }
      const c3Dtileset = await viewer.jt?.primitiveManager.add3DTileset({
        name: '广州南沙',
        url: 'https://coderfmc.github.io/three.js-demo/guangzhounansha_bm/tileset.json',
        show: true,
        skipLevelOfDetail: true,
        skipScreenSpaceErrorFactor: 8,
        maximumScreenSpaceError: 64,
        dynamicScreenSpaceError: true,
        dynamicScreenSpaceErrorDensity: 0.25,
        dynamicScreenSpaceErrorFactor: 4,
        preloadWhenHidden: true
      })

      if (c3Dtileset) {
        const update = () => {
          const tileset_center = c3Dtileset.boundingSphere.center
          const boundingSphere = c3Dtileset.boundingSphere
          const frompoint_to_world_matrix = Cesium.Transforms.eastNorthUpToFixedFrame(tileset_center)
//以模型中心为原点的局部坐标系下向东\北\天移动x,y,z的分量
          const local_translation = new Cesium.Cartesian3(controls.offsetEast, controls.offsetNorth, controls.offsetUp)
          const result = new Cesium.Cartesian3(0, 0, 0)
//局部坐标系到世界坐标系的转换矩阵左乘平移向量得到世界坐标系下的平移终点
          Cesium.Matrix4.multiplyByPoint(frompoint_to_world_matrix, local_translation, result)

//问题回到了第一种情况
          const translation = Cesium.Cartesian3.subtract(result, boundingSphere.center, new Cesium.Cartesian3())
          c3Dtileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
        }
        update()
        /**
         * 控制调试
        //  */
        // const gui = new GUI({
        //   title: '控制面板',
        //   width: '320',
        //   closeFolders: true
        // })
        // gui.add(controls, 'offsetEast').min(-120).max(-70).step(0.1).onFinishChange((val: any) => {
        //   update()
        //   console.log('height', val)
        // })
        // gui.add(controls, 'offsetNorth').min(-30).max(-10).step(0.1).onFinishChange((val: any) => {
        //   update()
        //   console.log('interal', val)
        // })
        // gui.addColor(controls, 'offsetUp').onChange((val: any) => {
        //   update()
        //   console.log('color1', val)
        // })
      }
    }
    const init = () => {
      const viewr = (cesiumRef || {}).viewer
      if (!viewr) {
        return
      }
      add3DTilese(viewr)
    }
    onMounted(() => {
      init()
    })
  }
})
</script>
