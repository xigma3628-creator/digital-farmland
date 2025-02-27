<template>
  <div style="display: none;">

  </div>
</template>

<script lang="ts">


import { computed, defineComponent, inject, onMounted, onUnmounted } from 'vue'
import { useStore } from '@/store'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import {
  JTPrimitiveActionTypes
} from '@/store/modules/jt-cesium-vue/modules/cesium-data/modules/jt-primitive/action-types'
import calculatePrimitiveCenter from '@/libs/cesium/libs/calculate-primitive-center'
import * as Cesium from 'cesium'
import { Billboard, BillboardCollection, Cartesian3, PrimitiveCollection, ScreenSpaceEventHandler } from 'cesium'
import Tooltip from '@/libs/cesium/tooltip/tooltip'

export default defineComponent({
  name: 'border-layer',
  setup(props, ctx) {
    const layerName: string = 'crop-layer'
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewr = (cesiumRef || {}).viewer
    const collection = new BillboardCollection({ scene: viewr.scene })
    const addGeoJson = async () => {
      try {
        const response1 = await fetch('https://coderfmc.github.io/three.js-demo/边界_ESPG_4326_WGS84.geojson')
        const geoJson1 = await response1.json()
        debugger
      } catch (e) {

        console.error(e)
      }
    }
    const init = () => {
      if (!viewr) {
        return
      }
      addGeoJson()
    }

    onMounted(() => {
      init()
    })
    onUnmounted(() => {
      viewr?.scene.primitives.remove(collection)
    })
  }
})
</script>
