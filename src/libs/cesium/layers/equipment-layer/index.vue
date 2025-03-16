<template>
  <div style="display: none;">

  </div>
</template>

<script lang="ts">


import { defineComponent, getCurrentInstance, inject, onMounted, onUnmounted } from 'vue'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import {
  BillboardCollection,
  Cartesian3,
  Cartographic,
  CustomDataSource,
  Matrix3,
  Matrix4,
  Model,
  Transforms
} from 'cesium'
import BorderWallMaterialProperty from '@/libs/cesium/layers/border-layer/borderWallMaterialProperty'
import IntrusionDetection from '@/libs/cesium/libs/intrusion-detection/IntrusionDetection'

/**
 * 设备图层
 * */
export default defineComponent({
  name: 'equipment-layer',
  setup(props, ctx) {
    const layerName: string = 'crop-layer'
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const datasouce: CustomDataSource = new CustomDataSource('wall')
    let material: any = null;
    let timer: any = null;
    const collection = new BillboardCollection({ scene: viewer.scene })
    const instance = getCurrentInstance();
    let height:number=0;


    const waitForModelReady=(model: Model): Promise<void>=>{
      return new Promise((resolve) => {
        const checkReady = () => {
          if (model.ready) {
            resolve();
          } else {
            requestAnimationFrame(checkReady);
          }
        };
        checkReady();
      });
    }

    /**
     *加载监测器
     * **/
    const loadMonitors = async (coordinates: number[][]) => {
      if (!viewer) return;

    const monitors=[];
      for (let i = 0; i < coordinates.length; i++) {
        const pos = Cartesian3.fromDegrees(coordinates[i][0], coordinates[i][1], 0.5);

        // 生成随机旋转角度（0-360度）
        const randomRotation = Math.random() * Math.PI * 2;

        // 创建旋转矩阵（绕Z轴旋转）
        const rotationMatrix = Matrix3.fromRotationZ(randomRotation);

        // 组合矩阵：位置矩阵 * 旋转矩阵
        const modelMatrix = Matrix4.multiply(
          Transforms.eastNorthUpToFixedFrame(pos),
          Matrix4.fromRotationTranslation(rotationMatrix),
          new Matrix4()
        );
        // 预加载模型文件提升性能
        const model = await Model.fromGltfAsync({
          url: 'https://coderfmc.github.io/three.js-demo/环境监测.glb',
          scale: 5,
          modelMatrix
        });

        monitors[i]=viewer.scene.primitives.add(model);
        if(i==0){
          await waitForModelReady(model);
          height=model.boundingSphere.radius;

          console.log(model.boundingSphere.radius);
        }
        // monitors[i].show=false
      }
      return monitors;
    };
    /**
     * 加载监视器图标
     */
    const loadBillboardCollection= async (coordinates: number[][]) => {
      if (!viewer) return;

      // const monitors=[];
      for (let i = 0; i < coordinates.length; i++) {
        const pos = Cartesian3.fromDegrees(coordinates[i][0], coordinates[i][1], 12);
        collection.add({
          position: pos,
          image: '/static/imgs/土壤监测设备.png',
          width: 32,
          height: 32,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          heightReference: Cesium.HeightReference.NONE,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 1500.0),
          show: true
        })
      }
      viewer.scene.primitives.add(collection);
      const baseZ:any[]=[];
      for (let i = 0; i < collection.length; ++i) {
        const b = collection.get(i);
        baseZ[i]=b.position.z;
      }
      viewer.scene.preRender.addEventListener((d:any,julianDate:any)=>{
        // 转换为 JavaScript Date 对象
        const date = Cesium.JulianDate.toDate(julianDate);
        const elapsedSeconds = julianDate.secondsOfDay;
        const len = collection.length;
        // 获取相机当前位置的笛卡尔坐标
        // const cameraPosition = viewer.camera.position;
        // const cartographic = Cesium.Cartographic.fromCartesian(cameraPosition);
        // const height = cartographic.height;


        for (let i = 0; i < len; ++i) {
          const b = collection.get(i);
          const pos=b.position.clone();
          pos.z=baseZ[i]+Math.sin(elapsedSeconds*4+(i%3))*0.8
          b.position=pos;
        }
      })
    };



    const addGeoJson = async () => {
      if (!viewer) return
      try {
        const response1 = await fetch('https://coderfmc.github.io/three.js-demo/监测器_ESPG_4326_WGS84.geojson')
        const geoJson1 = await response1.json();
        const coordinates= geoJson1.features.map((item:any)=>item.geometry.coordinates)
        await  loadMonitors(coordinates);
        await  loadBillboardCollection(coordinates);


      } catch (e) {

        console.error(e)
      }
    }
    const init = () => {
      if (!viewer) {
        return
      }
      addGeoJson()
    }

    onMounted(() => {
      init()
      // window.requestAnimationFrame(()=>{
      //   console.log('ca',viewer?.camera)
      // })


    })
    onUnmounted(() => {
    })
  }
})
</script>
