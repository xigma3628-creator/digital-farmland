<template>
  <div style="display: none;">

  </div>
</template>

<script lang="ts">


import { defineComponent, getCurrentInstance, inject, onMounted, onUnmounted } from 'vue'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import { Cartesian2, Cartesian3, Cartographic, CustomDataSource, ImageMaterialProperty } from 'cesium'
import BorderWallMaterialProperty from '@/libs/cesium/layers/border-layer/borderWallMaterialProperty'
import IntrusionDetection from '@/libs/cesium/libs/intrusion-detection/IntrusionDetection'

export default defineComponent({
  name: 'border-layer',
  setup(props, ctx) {
    const layerName: string = 'crop-layer'
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const datasouce: CustomDataSource = new CustomDataSource('wall')
    let material: any = null;
    let timer: any = null;
    const instance = getCurrentInstance()


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
      if (!viewer) return
      try {
        const response1 = await fetch('https://coderfmc.github.io/three.js-demo/边界_ESPG_4326_WGS84.geojson')
        const geoJson1 = await response1.json()
        const borderPos = geoJson1.features[0].geometry.coordinates[0]
        material = new BorderWallMaterialProperty(viewer, {
          trailImage: '/static/imgs/wall.png', color: Cesium.Color.CYAN, duration: 1500
        })
        const chinaCoords = [
          73.55, 53.56, 0,   // 西北点
          135.08, 53.56, 0,  // 东北点
          135.08, 18.15, 0,  // 东南点
          73.55, 18.15, 0,   // 西南点
          73.55, 53.56, 0    // 闭合多边形
        ];
        datasouce.entities.add({
          wall: {
            positions: Cartesian3.fromDegreesArray(borderPos.flat()),
            minimumHeights: new Array(borderPos.length).fill(20),
            material: material
          }
        })
        const texturedPolygonWithHoles = viewer.entities.add({
          name: "Textured polygon with per-position heights, holes and custom texture coordinates",
          polygon: {
            hierarchy: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights(chinaCoords),
              holes: [
                {
                  positions:  Cartesian3.fromDegreesArray(borderPos.flat()),
                },
              ],
            },
            material:  new ImageMaterialProperty({
              image:'/static/imgs/echarts/u0_state0.jpg',
              repeat:new Cartesian2(1000,1000)
            }),
          },
        });
        viewer?.jt?.layerManager.registerLayer('border-layer', {
          show: true,
          collection: datasouce,
          zIndex: 0,
          instance:instance,
          ex:borderPos
        })

        /***
         入侵检测
         **/
        // const intrusionDetection=new IntrusionDetection(viewer);
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
      if (!viewer) {
        return
      }
      addGeoJson()
      // if(viewer){
      //   viewer.scene.preRender.addEventListener(()=>{
      //     console.log('ca Cartographic',viewer.camera.position);
      //     console.log('ca hpr',viewer.camera);
      //
      //   })
      // }
    }

    onMounted(() => {
      init()
      // window.requestAnimationFrame(()=>{
      //   console.log('ca',viewer?.camera)
      // })


    })
    onUnmounted(() => {
      if(timer){
        clearInterval(timer);
      }
      viewer?.scene.primitives.remove(datasouce)
    })

    return {
      setIntrude
    }
  }
})
</script>
