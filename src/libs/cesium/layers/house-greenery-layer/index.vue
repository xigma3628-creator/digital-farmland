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
export default defineComponent({
  name: 'house-greenery-layer',
  setup() {
    const store = useStore();
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const syncJTPrimitive = (): void => {
      store.dispatch(
        `jtCesiumVue/cesiumData/jtPrimitive/${JTPrimitiveActionTypes.SYNC_JTPRIMITIVES}`,
        cesiumRef?.viewer
      )
    }
    const add3DTilese= async (viewer:Cesium.Viewer) => {
      const t=await  viewer.jt?.primitiveManager.add3DTileset({
        name:'广州南沙',
        url:'http://192.168.31.162:42225/distribution/model/hjri2qqrmiiu/tileset.json',
        show:true,
        skipLevelOfDetail: true,                // 启用LOD跳过优化
        skipScreenSpaceErrorFactor: 8,           // 增大跳级因子（默认1，增大可减少细节切换）
        maximumScreenSpaceError: 64,             // 适当增大屏幕空间误差阈值（默认16）
        dynamicScreenSpaceError: true,          // 启用动态误差计算
        dynamicScreenSpaceErrorDensity: 0.25,    // 降低密集区域的细节需求（默认0.25）
        dynamicScreenSpaceErrorFactor: 4,      // 动态调整系数（默认4）,
        preloadWhenHidden: true,
      })
      // if(t){
      //   viewer.zoomTo(t);
      // }
    }
    const init = () => {
      const viewr = (cesiumRef || {}).viewer;
      if (!viewr) {
        return
      }
      add3DTilese(viewr);
    }
    onMounted(() => {
      init();
    })
  },
})
</script>
