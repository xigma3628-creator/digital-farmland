<template>
  <div style="display: none;">

  </div>
</template>

<script lang="ts">


import { defineComponent, inject, onMounted, onUnmounted } from 'vue'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import { Cartesian3, CustomDataSource } from 'cesium'
import BorderWallMaterialProperty from '@/libs/cesium/layers/border-layer/borderWallMaterialProperty'
import IntrusionDetection from '@/libs/cesium/libs/intrusion-detection/IntrusionDetection'

export default defineComponent({
  name: 'border-layer',
  setup(props, ctx) {
    const layerName: string = 'crop-layer'
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewr = (cesiumRef || {}).viewer
    const datasouce: CustomDataSource = new CustomDataSource('wall')
    let material: any = null;
    let timer: any = null;


    /**
     * 入侵检测
     * */
    const setIntrude = (val: boolean) => {
      if (!material) return
      if (val) {
       timer=setInterval(() => {
         material.color=Cesium.Color.RED
         setTimeout(()=>{
           material.color=Cesium.Color.CYAN
         },1000)
       },2000)

      } else {
        clearInterval(timer);
        material.color = Cesium.Color.CYAN
      }
    }

    /**
     *
     * **/


    const addGeoJson = async () => {
      if (!viewr) return
      try {
        const response1 = await fetch('https://coderfmc.github.io/three.js-demo/边界_ESPG_4326_WGS84.geojson')
        const geoJson1 = await response1.json()
        const borderPos = geoJson1.features[0].geometry.coordinates[0]
        material = new BorderWallMaterialProperty(viewr, {
          trailImage: '/static/imgs/wall.png', color: Cesium.Color.CYAN, duration: 1500
        })
        datasouce.entities.add({
          wall: {
            positions: Cartesian3.fromDegreesArray(borderPos.flat()),
            minimumHeights: new Array(borderPos.length).fill(20),
            material: material
          }
        })
        viewr?.jt?.layerManager.registerLayer('border-layer', {
          show: true,
          collection: datasouce,
          zIndex: 0,
          ex:borderPos
        })

        /***
         入侵检测
         **/
        // const intrusionDetection=new IntrusionDetection(viewr);
        // intrusionDetection.isInsideCallback=function(){
        //   setIntrude(true)
        // }
        // intrusionDetection.noInsideCallback=function(){
        //   setIntrude(false)
        // }
        // setTimeout(()=>{
        //   intrusionDetection.startPersonTrack();
        // },2000)
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
      if(timer){
        clearInterval(timer);
      }
      // viewr?.scene.primitives.remove(collectio)
    })

    return {
      setIntrude
    }
  }
})
</script>
