<template>
  <div
    class="cnb fixed top-0 bottom-0 left-0 right-0 overflow-hidden flex flex-col"
  >
    <div
      class="header px-6 h-20 flex-grow-0 flex-shrink-0 pointer-events-auto flex flex-row items-center justify-between"
    >
      <div class="left header-item">

      </div>
      <div class="title text-white font-bold text-2xl center header-item" @click="setModel()">智慧农田</div>
      <div class="right header-item">
        <nowDate />
      </div>
    </div>
        <div class="content flex-grow flex flex-row">
<!--          <input type="checkbox" id="left-checkBox" class="hidden" />-->
          <div class="left pointer-events-auto flex flex-col">
<!--            <h3 class="text-white">无人机巡航</h3>-->
<!--            <el-button @click="startDroneCruise">开启无人机巡检</el-button>-->
<!--            <el-button @click="pausedDroneCruise">暂停/继续</el-button>-->
<!--            <el-button @click="stopDroneCruise">停止无人机巡检</el-button>-->
<!--            <h3 class="text-white">入侵检测</h3>-->
<!--            <el-button @click="startIntrusionDetection">开始入侵检测</el-button>-->
<!--            <h3 class="text-white">默认视角</h3>-->
<!--            <el-button @click="home">回到默认视角</el-button>-->
            <div class="left-one">
              <bs-overview/>
            </div>
            <div class="left-tow">
              <bs-coal-pollution/>
            </div>
            <div class="left-three">
              <bs-energy-composition/>
            </div>
          </div>
          <div class="center flex-grow flex flex-col-reverse">

            <div class="center-bottom pointer-events-auto">
              <bottom-control @show-wrj-dialog-visible="setwrjModel($event)"></bottom-control>
            </div>
          </div>
          <div class="right pointer-events-auto flex flex-col">
            <div class="right-one">
<!--              <bs-energy-consumption-average-per-day/>-->
            </div>
            <div class="right-tow">
              <bs-energy-consumption-per-person/>
            </div>
            <div class="right-three">
              <bs-energy-consumption-percent/>
            </div>
          </div>
        </div>

    <equipment-detail-model v-model:show="dialogVisible" :model-params="modelParams"></equipment-detail-model>
    <wrj-control-model v-model:show="wrjDialogVisible"></wrj-control-model>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, inject } from 'vue'
import useLayoutControl from '../useLayoutControl'
import { useStore } from '@/store'

import nowDate from './components/now-date.vue'
import bsOverview from './components/bs-overview.vue'
import bsEnergyComposition from './components/bs-energy-composition.vue'
import bsCoalPollution from './components/bs-coal-pollution.vue'
import bsEnergyConsumptionPercent from './components/bs-energy-consumption-percent.vue'
import bsEnergyConsumptionAveragePerDay from './components/bs-energy-consumption-average-per-day.vue'
import bsEnergyConsumptionPerPerson from './components/bs-energy-consumption-per-person.vue'
import DroneCruise from '@/libs/cesium/libs/drone-cruise/DroneCruise'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import IntrusionDetection from '@/libs/cesium/libs/intrusion-detection/IntrusionDetection'
import EquipmentDetailModel
  from '@/views/home/industries/carbon-neutral-bigscreen/components/equipment-detail-model.vue'
import { ModelParams } from '@/share/interface'
import BottomControl from '@/views/home/industries/carbon-neutral-bigscreen/components/bottom-control.vue'
import WrjControlModel from '@/views/home/industries/carbon-neutral-bigscreen/components/wrj-control-model.vue'

export default defineComponent({
  name: 'carbon-neutral-bigscreen',
  components: {
    WrjControlModel,
    BottomControl,
    EquipmentDetailModel,
    nowDate,
    bsOverview,
    bsEnergyComposition,
    bsCoalPollution,
    bsEnergyConsumptionPercent,
    bsEnergyConsumptionAveragePerDay,
    bsEnergyConsumptionPerPerson
  },
  setup(props, context) {
    const store = useStore()
    const layoutControl = useLayoutControl()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const dialogVisible =ref(false)
    const  wrjDialogVisible=ref(false)

    onMounted(() => {
      layoutControl.hideAllLayout(store)
    })
    const startDroneCruise = () => {
      viewer?.jt?.droneCruise.start()
    }
    const stopDroneCruise = () => {
      viewer?.jt?.droneCruise.stop()
    }
    const pausedDroneCruise = () => {
      viewer?.jt?.droneCruise.pause()
    }
    const startIntrusionDetection = () => {
      if (!viewer) return
      const borderlayer = viewer?.jt?.layerManager.getLayer('border-layer')
      const intrusionDetection = new IntrusionDetection(viewer)
      intrusionDetection.isInsideCallback = function() {
        borderlayer?.instance.ctx.setIntrude(true)
      }
      intrusionDetection.noInsideCallback = function() {
        borderlayer?.instance.ctx.setIntrude(false)
      }
      setTimeout(() => {
        intrusionDetection.startPersonTrack()
      }, 2000)
    }
    const home = () => {
      viewer?.jt?.flyTo.flyToHome()
    }
    const  setModel=()=>{
      dialogVisible.value =true
    }
    const  setwrjModel=(show:boolean)=>{
      wrjDialogVisible.value =true
    }
    const modelParams=computed(() => {
      if(store.state.template.equipmentDetailModelState.show){
        dialogVisible.value =true;
      }
      return store.state.template.equipmentDetailModelState
    })
    return {
      stopDroneCruise,
      startDroneCruise,
      pausedDroneCruise,
      home,
      startIntrusionDetection,
      setModel,
      setwrjModel,
      wrjDialogVisible,
      dialogVisible,
      modelParams
    }
  }
})
</script>

<style scoped lang="scss">
.cnb {
  .header {
    width: 100%;
    height: 76px;
    background-repeat: no-repeat;
    background-size: cover;
    background-image: url('static/imgs/echarts/header.png');
    display: flex;
    justify-content: space-around;

    &-item {
      flex: 1;
    }

    .center {
      display: flex;
      justify-content: center;
    }

    .right {
      height: 100%;
    }
  }

  .content {
    .left,
    .right {
      width: 360px;
      //background: black;
      display: flex;
      flex-direction: column;
    }
    .left{
      margin-left: 10px;
    }
    .right{
      margin-right: 10px;
    }


    .left {
      position: relative;
    }

    .center {
      position: relative;
      .center-bottom {
        position: fixed;
        width: 16%;
        height: 50px;
        bottom: 1%;
        left: 50%;
        display: flex;
        transform: translate(-50%);
        background: black;
        border-radius: 20px;
      }
    }
  }
  .left-one,.left-tow,.left-three,.right-one,.right-tow,.right-three{
    height: 315px;
    margin-bottom: 10px;
    //background: black;
  }
}
</style>
