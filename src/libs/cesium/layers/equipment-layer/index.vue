<template>
  <div style="display: none;">

  </div>
</template>

<script lang="ts">


import { defineComponent, getCurrentInstance, inject, onMounted, onUnmounted } from 'vue'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'
import {
  Billboard,
  BillboardCollection, Cartesian2,
  Cartesian3,
  Cartographic,
  CustomDataSource,
  Matrix3,
  Matrix4,
  Model, ScreenSpaceEventHandler,
  Transforms
} from 'cesium'
import BorderWallMaterialProperty from '@/libs/cesium/layers/border-layer/borderWallMaterialProperty'
import IntrusionDetection from '@/libs/cesium/libs/intrusion-detection/IntrusionDetection'
import Tooltip from '@/libs/cesium/tooltip/tooltip'
import { useStore } from '@/store'
import { TemplateMutationTypes } from '@/store/modules/template/mutation-types'
import { ModelParams } from '@/share/interface'
import FarmlandMonitoringData from '@/domain/farmlandMonitoringData.domain'
import EquipmentMonitor from '@/domain/equment-monitor.domian'

/**
 * 设备图层
 * */
export default defineComponent({
  name: 'equipment-layer',
  setup(props, ctx) {
    const store = useStore();
    const layerName: string = 'equipment-layer'
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const datasouce: CustomDataSource = new CustomDataSource('wall')
    let material: any = null;
    let timer: any = null;
    const collection = new BillboardCollection({ scene: viewer?.scene })
    const instance = getCurrentInstance();
    let height:number=0;
    let monitors:any[]=[];
    let monitorsIds:any[]=[];
    let handler:any=null;

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
        model.id='equipment-layer-monitor'+i;

        monitors[i]=viewer.scene.primitives.add(model);
        monitorsIds[i]='equipment-layer-monitor'+i;
        if(i==0){
          await waitForModelReady(model);
          height=model.boundingSphere.radius;

          console.log(model.boundingSphere.radius);
        }
        // monitors[i].show=false
      }
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
      const initialTime = Date.now(); // 记录初始时间
      // viewer.scene.preRender.addEventListener((d:any,julianDate:any)=>{
      //   const currentTime = Date.now();
      //   const elapsedSeconds = (currentTime - initialTime) / 1000; // 转换为秒
      //   const len = collection.length;
      //   for (let i = 0; i < len; ++i) {
      //     const b = collection.get(i);
      //     const pos=b.position.clone();
      //     pos.z=baseZ[i]+Math.sin(elapsedSeconds*4+(i%3))*0.8
      //     b.position=pos;
      //   }
      // })
    };

    // const initList=(coordinates: number[][])=>{
    //   const equipmentMonitorList:EquipmentMonitor[]=[];
    //   for (let i = 0; i < coordinates.length; i++) {
    //     const pos = Cartesian3.fromDegrees(coordinates[i][0], coordinates[i][1], 0.5);
    //     equipmentMonitorList.push(new EquipmentMonitor({
    //       id:(i+1)+'',
    //       name:'设备'+(i+1),
    //       state:'运行中',
    //       pos:pos,
    //     }))
    //   }
    //   if(!sessionStorage.getItem("equipmentMonitorList")){
    //     sessionStorage.setItem("equipmentMonitorList", JSON.stringify(equipmentMonitorList));
    //   }else{
    //     sessionStorage.removeItem("equipmentMonitorList");
    //     sessionStorage.setItem("equipmentMonitorList", JSON.stringify(equipmentMonitorList));
    //   }
    // }
    const extractNumbers=(str: string): number[]=>{
      const regex = /\d+/g;
      const matches = str.match(regex);
      if (matches) {
        return matches.map((match) => parseInt(match, 10));
      }
      return [];
    }
    /**
     * 悬浮tooltip
     * */
    const cesiumEventHandler = () => {
      if (!cesiumRef || !viewer) return
      handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
      // const  divInnerHtml=`
      // <div style="width: 32px;height: 32;"></div>
      // `
      const tooltip: Tooltip = new Tooltip(cesiumRef.viewerContainer)
      const offset=new Cartesian2(-40,-40)
      handler.setInputAction(function(movement: any) {
        if (!viewer.jt?.layerManager.getLayer(layerName)?.show) return
        const pickedObject = viewer.scene.pick(movement.endPosition)
        if(Cesium.defined(pickedObject)
          && pickedObject.primitive instanceof Model
          &&monitorsIds.includes(pickedObject.primitive.id)
        ){
            const { properties } = pickedObject.id
            const canvasPosition = movement.endPosition
            tooltip.show(
              canvasPosition,
              `<p style="font-size: 14px;background: #fff;line-height: 18px;padding: 6px;border-radius: 4px;">双击查看详情</p>`,
              offset
            )
            viewer.canvas.style.cursor = 'pointer'
        }else{
            viewer.canvas.style.cursor = 'default'
            tooltip.hide()
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)


      /**
       * 双击查看详细数据
       * **/
      handler.setInputAction(function(movement: any) {
        // debugger
        // if (!viewer.jt?.layerManager.getLayer(layerName)?.show) return
        const pickedObject = viewer.scene.pick(movement.position)
        if(Cesium.defined(pickedObject)
          && pickedObject.primitive instanceof Model
          &&monitorsIds.includes(pickedObject.primitive.id)
        ){
          console.log('movement',movement)
          const params:ModelParams={
            show:true,
            pos:movement.position,
            data:new FarmlandMonitoringData({
              soilTemperature: 22,
              soilMoisture: 60,
              soilPH: 6.5,
              ambientTemperature: 25,
              ambientHumidity: 70,
              monitorBattery: 80,
              lightIntensity: 50000,
              equipment:new EquipmentMonitor({
                id:''+extractNumbers(pickedObject.primitive.id)[0],
                name:'设备'+(extractNumbers(pickedObject.primitive.id)[0]+1)
              })
            })
          }
          store.commit(`template/${TemplateMutationTypes.SET_EQUIPMENT_DETAIL_MODEL}`,params)
          // store.
          console.log('双击了监测器')
        }else{
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

    }

    const addGeoJson = async () => {
      if (!viewer) return
      const equipmentMonitorList:EquipmentMonitor[]=[];
      try {
        const response1 = await fetch('https://coderfmc.github.io/three.js-demo/监测器_ESPG_4326_WGS84.geojson')
        const geoJson1 = await response1.json();
        const coordinates= geoJson1.features.map((item:any)=>item.geometry.coordinates)
        await  loadMonitors(coordinates);
        await  loadBillboardCollection(coordinates);
        viewer.jt?.layerManager.registerLayer(
          layerName,
          {
            show: true,
            zIndex:0,
            setShowCb:(isShow:boolean)=>{
              collection.show=isShow;
              monitors.forEach(item=>{
                item.show=isShow;
              })
            },
            collection:{
              collection:collection,
              monitors:monitors
            }
          }
        )

      } catch (e) {

        console.error(e)
      }
    }
    const init = () => {
      if (!viewer) {
        return
      }
      addGeoJson()
      cesiumEventHandler();
    }

    onMounted(() => {
      init()
      // window.requestAnimationFrame(()=>{
      //   console.log('ca',viewer?.camera)
      // })


    })
    onUnmounted(() => {
      handler&&handler.destroy();
      viewer?.scene.primitives.remove(collection)
      monitors.forEach(item=>{
        viewer?.scene.primitives.remove(item)
      })

    })
  }
})
</script>
