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
  name: 'farmland-layer',
  setup() {
    const store = useStore();
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const addGeoJson= async (viewer:Cesium.Viewer) => {
      const getGeoJson = viewer.dataSources.add(Cesium.GeoJsonDataSource.load('https://coderfmc.github.io/three.js-demo/农田_ESPG_4326_WGS84.geojson', {
        stroke: Cesium.Color.HOTPINK,
        fill: Cesium.Color.PINK.withAlpha(0.5), // 直接设置透明度
        strokeWidth: 3,
        clampToGround: false, // 必须关闭贴地模式
        heightReference: Cesium.HeightReference.NONE // 明确高度参考系
      }));
      getGeoJson.then(res => {
        console.log('res', res);
        const entities = res.entities.values;
        entities.forEach((entity, index) => {
          if (entity.polygon) {
            // 设置多边形基准高度
            entity.polygon.height = new Cesium.ConstantProperty(2);

            // 如果要创建立体效果可设置挤出高度
            entity.polygon.extrudedHeight = new Cesium.ConstantProperty(2.2);

            // 优化材质设置
            entity.polygon.material = new Cesium.ColorMaterialProperty(
              Cesium.Color.fromRandom({ alpha: 0.5 })
            );

            // 确保多边形不贴地
            // entity.polygon.clampToGround = new Cesium.ConstantProperty(false);
          }
        })
        viewer.zoomTo(entities);
      })

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
