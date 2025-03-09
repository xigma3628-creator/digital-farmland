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
    const store = useStore()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const  getColor=(state:string,alpha:number):Cesium.Color=>{
      if (state == '养护中') {
        return   Cesium.Color.fromCssColorString('#bc9f5e').withAlpha(alpha)
      } else if (state == '生长期') {
        // #41693c
        return  Cesium.Color.fromCssColorString('#53c847').withAlpha(alpha)
      } else if (state == '成熟期') {
        // #918570
        return   Cesium.Color.fromCssColorString('#2975ca').withAlpha(alpha)
      }else {
        return   Cesium.Color.WHITE;
      }
    }
    const  createLandMaterial=(entity:Cesium.Entity)=>{
      const colorProperty=new Cesium.CallbackProperty(function(time,result){
        let alpha=0.5;
        if(window.hightLightLandEntity===entity){
          alpha=1.0;
        }
        let state:string='';
        if(entity.properties&&entity.properties.getValue()){
          state  = entity.properties.state
        }
        return getColor(state,alpha);
      },false)
      return new Cesium.ColorMaterialProperty(colorProperty);
    }
    const addGeoJson = async (viewer: Cesium.Viewer) => {
      const getGeoJson = viewer.dataSources.add(Cesium.GeoJsonDataSource.load('https://coderfmc.github.io/three.js-demo/农田_ESPG_4326_WGS84.geojson', {
        stroke: Cesium.Color.HOTPINK.withAlpha(0),
        strokeWidth: 3,
        clampToGround: false, // 必须关闭贴地模式
        heightReference: Cesium.HeightReference.NONE // 明确高度参考系
      }));
      getGeoJson.then(res => {
        // console.log('res', res)
        const entities = res.entities.values
        entities.forEach((entity, index) => {
          if (entity.polygon) {
            entity.polygon.material=createLandMaterial(entity)
            // 设置多边形基准高度
            entity.polygon.height = new Cesium.ConstantProperty(2)

            // 如果要创建立体效果可设置挤出高度
            entity.polygon.extrudedHeight = new Cesium.ConstantProperty(2.2)


          }
        })
        // viewer.zoomTo(entities)
      })
    }

    const  initEvent=(viewer: Cesium.Viewer)=>{
      const scene = viewer.scene;
      const handler = viewer.screenSpaceEventHandler;
      handler.setInputAction(function (movement:any) {
        var pickedObject = scene.pick(movement.endPosition);
        if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
          window.hightLightLandEntity = pickedObject.id;
        } else {
          window.hightLightLandEntity = null;
        }

      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    const init = () => {
      const viewr = (cesiumRef || {}).viewer
      if (!viewr) {
        return
      }
      window.hightLightLandEntity=null;
      addGeoJson(viewr)
      initEvent(viewr);
    }
    onMounted(() => {
      init()
    })
  }
})
</script>
