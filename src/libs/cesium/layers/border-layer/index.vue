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
import {
  Billboard,
  BillboardCollection,
  Cartesian3, ColorMaterialProperty,
  CustomDataSource,
  PrimitiveCollection,
  ScreenSpaceEventHandler
} from 'cesium'
import Tooltip from '@/libs/cesium/tooltip/tooltip'
import BorderWallMaterialProperty from '@/libs/cesium/layers/border-layer/borderWallMaterialProperty'

export default defineComponent({
  name: 'border-layer',
  setup(props, ctx) {
    const layerName: string = 'crop-layer'
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewr = (cesiumRef || {}).viewer
    const datasouce:CustomDataSource=new CustomDataSource('wall');
    const addGeoJson = async () => {
      if(!viewr)return;
      try {
        const response1 = await fetch('https://coderfmc.github.io/three.js-demo/边界_ESPG_4326_WGS84.geojson')
        const geoJson1 = await response1.json()
        const borderPos=geoJson1.features[0].geometry.coordinates[0];
        // debugger
        // debugger
        const material=new BorderWallMaterialProperty(viewr,{
          trailImage: "/static/imgs/wall.png", color: Cesium.Color.CYAN, duration: 1500
        })
        datasouce.entities.add({
          wall:{
            positions:Cartesian3.fromDegreesArray(borderPos.flat()),
            minimumHeights:new Array(borderPos.length).fill(20),
            material:material
          }
        })
        // setTimeout(()=>{
        //   material.color=Cesium.Color.RED;
        // },2000)
        viewr?.jt?.layerManager.registerLayer("border-layer",{
          show: true,
          collection:datasouce,
          zIndex:0
        })

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
      // viewr?.scene.primitives.remove(collectio)
    })
  }
})
</script>
