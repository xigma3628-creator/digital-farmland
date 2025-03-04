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
  name: 'crop-layer',
  setup(props, ctx) {
    const layerName: string = 'crop-layer'
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewr = (cesiumRef || {}).viewer
    const collection = new BillboardCollection({ scene: viewr.scene })
    const addGeoJson = async (viewer: Cesium.Viewer) => {
      const height = 10.0
      try {
        const response1 = await fetch('https://coderfmc.github.io/three.js-demo/作物_ESPG_4326_WGS84.geojson')
        const response2 = await fetch('https://coderfmc.github.io/three.js-demo/水产_ESPG_4326_WGS84.geojson')
        const geoJson1 = await response1.json()
        const geoJson2 = await response2.json()
        geoJson1.features.forEach((feature: any) => {
          const { geometry, properties } = feature
          const position = Cartesian3.fromDegrees(geometry.coordinates[0], geometry.coordinates[1])
          let imageUrl = `/static/imgs/${properties.plantType}.png`
          if (properties.plantType) {
            collection.add({
              position: position,
              image: imageUrl,
              width: 32,
              height: 32,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 1500.0),
              show: true,
              id: {
                properties,
                chanliang: Math.round(Math.random() * 50),
                layer: layerName
              }
            })
          }
        })
        geoJson2.features.forEach((feature: any) => {
          const { geometry, properties } = feature
          const position = Cartesian3.fromDegrees(geometry.coordinates[0], geometry.coordinates[1])
          if (properties.type) {
            let imageUrl = `/static/imgs/${properties.type}.png`
            collection.add({
              position: position,
              image: imageUrl,
              width: 32,
              height: 32,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 1500.0),
              show: true,
              id: {
                properties,
                chanliang: Math.round(Math.random() * 50),
                layer: layerName
              }
            })
          }
        })
        viewer.jt?.layerManager.registerLayer('crop-layer', {
          show: true,
          zIndex: 0,
          collection
        })
      } catch (e) {

        console.error(e)
      }
    }
    /**
     * 悬浮tooltip
     * */
    const cesiumEventHandler = () => {
      if (!cesiumRef || !viewr) return
      const handler = new ScreenSpaceEventHandler(viewr.scene.canvas)
      // const  divInnerHtml=`
      // <div style="width: 32px;height: 32;"></div>
      // `
      const tooltip: Tooltip = new Tooltip(cesiumRef.viewerContainer)

      handler.setInputAction(function(movement: any) {
        if (!viewr.jt?.layerManager.getLayer(layerName)?.show) return
        const pickedObject = viewr.scene.pick(movement.endPosition)
        if (
          Cesium.defined(pickedObject)
          && pickedObject.primitive instanceof Billboard
          &&pickedObject.id
          && pickedObject.id.layer === layerName
        ) {
          const { properties } = pickedObject.id
          const canvasPosition = movement.endPosition
          tooltip.show(canvasPosition, `
<div style="padding: 5px;border-radius: 4px;background: #fff;text-align: center;font-size: 12px;">
<p>${properties.plantType ? properties.plantType : properties.type}</p>
<p>产量：${pickedObject.id.chanliang}吨</p>
</div>`)
          viewr.canvas.style.cursor = 'pointer'
        } else {
          viewr.canvas.style.cursor = 'default'
          tooltip.hide()
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    }
    const init = () => {
      if (!viewr) {
        return
      }
      addGeoJson(viewr)
      cesiumEventHandler()
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
