<template>
  <div
    class="cnb fixed top-0 bottom-0 left-0 right-0 overflow-hidden flex flex-col"
  >
    <div
      class="header px-6 h-20 flex-grow-0 flex-shrink-0 pointer-events-auto flex flex-row items-center justify-between"
    >
      <div class="title text-white font-bold text-2xl">XXX市“碳中和”监控指挥平台</div>
      <nowDate class="text-white" />
    </div>
    <div class="content flex-grow flex flex-row">
      <input type="checkbox" id="left-checkBox" class="hidden" />
      <div class="left pointer-events-auto flex flex-col">
        <el-button @click="startDroneCruise">开启无人机巡检</el-button>
        <el-button @click="pausedDroneCruise">暂停/继续</el-button>
        <el-button @click="stopDroneCruise">停止无人机巡检</el-button>
        <el-button @click="home">回到默认视角</el-button>
      </div>
      <div class="center flex-grow flex flex-col-reverse">
        <!-- <div class="center-bottom bg-gray-700"></div> -->
      </div>
<!--      <div class="right pointer-events-auto flex flex-col">-->
<!--      </div>-->
    </div>
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

export default defineComponent({
  name: 'carbon-neutral-bigscreen',
  components: {
    nowDate,
    bsOverview,
    bsEnergyComposition,
    bsCoalPollution,
    bsEnergyConsumptionPercent,
    bsEnergyConsumptionAveragePerDay,
    bsEnergyConsumptionPerPerson,
  },
  setup(props, context) {
    const store = useStore()
    const layoutControl = useLayoutControl()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer

    onMounted(() => {
      layoutControl.hideAllLayout(store)
    })
    const startDroneCruise=()=>{
      viewer?.jt?.droneCruise.start();
    }
    const stopDroneCruise = () => {
      viewer?.jt?.droneCruise.stop();
    }
    const pausedDroneCruise = () => {
      viewer?.jt?.droneCruise.pause();
    }
    const home = () => {
      viewer?.jt?.flyTo.flyToHome()
    }
    return {
      stopDroneCruise,
      startDroneCruise,
      pausedDroneCruise,
      home
    }
  },
})
</script>

<style scoped lang="scss">
.cnb {
  .header {
    background-color: rgba(1, 6, 17, 0.7);
  }
  .content {
    .left,
    .right {
      width: 20%;
      min-width: 260px;
      background-color: rgba(1, 6, 17, 0.9);
    }
    #left-checkBox:checked + div {
      background-color: green !important;
      transform: translateX(calc(-1 * calc(100%) + 12px));
      min-width: 0 !important;
    }
    .left {
      position: relative;

      .handler {
        // total width 12px
        background-color: black;
        position: absolute;
        top: 49%;
        right: 0;
        padding: 3px;
        display: flex;
        flex-direction: column;
        cursor: pointer;
        .dot {
          width: 6px;
          height: 6px;
          display: inline-block;
          border-radius: 3px;
          background-color: red;
          margin: 1px 0px;
          cursor: inherit;
        }
      }
    }
    .center {
      .center-bottom {
        width: 100%;
        height: 168px;
      }
    }
  }
}
</style>
