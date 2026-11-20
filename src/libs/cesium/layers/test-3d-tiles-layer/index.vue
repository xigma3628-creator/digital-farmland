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
  name: 'test-3d-tiles-layer',
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
      const currentTileset=await  viewer.jt?.primitiveManager.add3DTileset({
        name:'3D Tiles 示例',
        url:'/static/demo/tileset.json',
        show:true,
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
