<template>
  <div class="w-full h-full">
    <jt-cesium-vue @loaded="onLoaded" :depth-test-against-terrain="true" />
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import * as Cesium from 'cesium'
import jtCesiumVue from '@/components/jt-cesium-vue/index.vue'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'

export default defineComponent({
  name: 'diag-page',
  components: { jtCesiumVue },
  setup() {
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const onLoaded = () => {
      const viewer = (cesiumRef || {}).viewer
      if (!viewer) return
      viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: '/amap-tiles/appmaptile?style=6&x={x}&y={y}&z={z}',
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        maximumLevel: 18,
        credit: 'amap-proxy'
      }))
    }
    return { onLoaded }
  }
})
</script>
