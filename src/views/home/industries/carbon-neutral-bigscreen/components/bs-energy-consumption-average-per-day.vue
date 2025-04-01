<template>
  <div class="bs-energy-consumption-average-per-day">
    <div class="bs-energy-consumption-average-per-day-header">
      <img src="/static/imgs/控制台.png">
      <div class="bs-energy-consumption-average-per-day-header-text">监测设备</div>
    </div>
    <div class="bs-energy-consumption-average-per-day-main">
      <el-table
        :data="mydata.list"
        height="250"
        style="width: 100%;--el-table-border-color: none;background-color: #333333"
        :header-cell-style="{
          'background-color': '#313744',
            'color': '#fff',
             borderBottom: ' 1px solid rgba(255, 255, 255, 0.2)',
        }"
        :cell-style="{
          backgroundColor: '#333',
          color: '#fff',
          borderBottom: ' 1px solid rgba(255, 255, 255, 0.2)',
          // borderRight: ' 1px solid rgba(255, 255, 255, 0.2)'
        }"
        ref="scrollTable"
        @mouseenter.native="autoScroll(true)"
        @mouseleave.native="autoScroll(false)"
      >
        <el-table-column fixed type="index" width="80" label="序号" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="state" label="状态" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              link
              type="primary"
              size="small"
              @click.prevent="goViewEquipmentMonitor(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, onUnmounted, nextTick, inject } from 'vue'
import EquipmentMonitor from '@/domain/equment-monitor.domian'
import { Cartesian3 } from 'cesium'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import * as Cesium from 'cesium'

export default defineComponent({
  name: 'bs-energy-consumption-average-per-day',
  setup(props, context) {
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const mydata = reactive<{ list: EquipmentMonitor[] }>({ list: [] })
    // 修改 scrollTimer 的类型
    const scrollTimer = ref<ReturnType<typeof setInterval> | null>(null)
    const scrollTable = ref<any>(null)

    const getData = async () => {
      const response1 = await fetch('https://coderfmc.github.io/three.js-demo/监测器_ESPG_4326_WGS84.geojson')
      const geoJson1 = await response1.json()
      const coordinates = geoJson1.features.map((item: any) => item.geometry.coordinates)
      const equipmentMonitorList: EquipmentMonitor[] = []
      for (let i = 0; i < coordinates.length; i++) {
        const pos = Cartesian3.fromDegrees(coordinates[i][0], coordinates[i][1], 5)
        equipmentMonitorList.push(new EquipmentMonitor({
          id: (i) + '',
          name: '设备' + (i + 1),
          state: '运行中',
          pos: pos
        }))
      }
      mydata.list = equipmentMonitorList
      // autoScroll(false)
    }
    const goViewEquipmentMonitor=(item:EquipmentMonitor)=>{
      console.log('item',item);
      viewer?.jt?.flyTo.flyTo({
        destination:item.pos,
        duration:1,
        offset:{
          heading: Cesium.Math.toRadians(-45),
          pitch: Cesium.Math.toRadians(45),
          range:50
        }
      })
    }

    const autoScroll = (stop: boolean) => {
      if (stop) {
        if (scrollTimer.value) {
          clearInterval(scrollTimer.value)
          scrollTimer.value = null
        }
      } else {
        if (!scrollTimer.value) {
          scrollTimer.value = setInterval(() => {
            const tableBody = scrollTable.value?.$el.querySelector('.el-scrollbar__wrap')
            if (tableBody) {
              tableBody.scrollTop = (tableBody.scrollTop + 2) % (tableBody.scrollHeight-tableBody.clientHeight)
              // console.log('tableBody.scrollTop',tableBody.scrollTop)
              // console.log('tableBody.scrollHeight',tableBody.scrollHeight)
              // console.log('tableBody.scrollHeight',tableBody.clientHeight)
            }
          }, 50)
        }
      }
    }
    onMounted(() => {
      getData()
      autoScroll(false)
      // setTimeout(()=>{
      //   viewer?.scene.preRender.addEventListener(()=>{
      //     console.log('相机')
      //     console.log(viewer.scene.camera.heading);
      //     console.log(viewer.scene.camera.pitch);
      //     console.log(viewer.scene.camera.roll);
      //     console.log(viewer.scene.camera.position)
      //
      //   })
      // },1000)
    })

    onUnmounted(() => {
      autoScroll(true)
    })

    return {
      mydata,
      autoScroll,
      scrollTimer,
      scrollTable,
      goViewEquipmentMonitor
    }
  }
})
</script>
<style scoped lang="scss">
.bs-energy-consumption-average-per-day {
  width: 100%;
  height: 100%;
  ////background-image: url("/static/imgs/echarts/u5.svg");
  //background-repeat: no-repeat;
  //background-size: cover;
  background-color: #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #0d7a72;
  color: #fff;

  &-header {
    height: 50px;
    background-image: url("/static/imgs/echarts/u7.svg");
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    align-items: center;
    padding-left: 10px;

    img {
      width: 25px;
      margin-right: 5px;
    }

    line-height: 50px;
    font-size: 20px;
  }

  &-main {
    flex: 1;
    width: 100%;
    //.equipment-table-header{
    //  background-color: red !important;
    //}
  }

  .equipment-table-header {
    background-color: red !important;
  }

  ::v-deep .el-table tbody tr:hover > td {
    background: #2d7c3b !important;
  }
}
</style>
