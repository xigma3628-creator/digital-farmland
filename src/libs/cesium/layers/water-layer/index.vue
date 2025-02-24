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
  name: 'water-layer',
  setup() {
    const store = useStore();
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const addGeoJson = async (viewer: Cesium.Viewer) => {
      const  height=3.0;
      try {
        const response = await fetch('https://coderfmc.github.io/three.js-demo/水域_ESPG_4326_WGS84.geojson');
        const geoJson = await response.json();
        //3,创建 material
        const material = new Cesium.Material({
          fabric: {
            type: 'Water',
            uniforms: {
              // baseWaterColor: new Cesium.Color(64 / 255.0, 157 / 255.0, 253 / 255.0, 0.7),
              normalMap: "https://coderfmc.github.io/three.js-demo/waterNormalsSmall.jpg",
              // amplitude: 50,
              // specularIntensity: 0.5


              baseWaterColor: new Cesium.Color(
                42 / 255.0,
                202 / 255.0,
                226 / 255.0,
                0.1
              ),
              frequency:900.0, // 波纹数量
              amplitude: 20, // 波纹振幅
              specularIntensity:2.75, //镜面反射强度
              animationSpeed: 0.01,
            }
          }
        })

        // 椭球面材质
        let appearance = new Cesium.EllipsoidSurfaceAppearance({
          material: material
        })
        const  geometryInstances = geoJson.features.map((feature: any) => {
          const coordinates = feature.geometry.coordinates;
          const degreesArray=coordinates[0].flat().map((coord:any) => {
            return coord;
          }).flat()
          const polygon = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(
              Cesium.Cartesian3.fromDegreesArray(degreesArray)
            ),
            height:height
          });
          //2，创建geometryInstance
          const instance = new Cesium.GeometryInstance({
            geometry: polygon,
          });
          return instance;
        })
        viewer.scene.primitives.add(new Cesium.Primitive({
          geometryInstances,
          appearance: appearance
        }))
      }catch (e){

        console.error(e)
      }
    }
    const init = () => {
      const viewr = (cesiumRef || {}).viewer;
      if (!viewr) {
        return
      }
      addGeoJson(viewr);
    }
    onMounted(() => {
      init();
    })
  },
})
</script>
