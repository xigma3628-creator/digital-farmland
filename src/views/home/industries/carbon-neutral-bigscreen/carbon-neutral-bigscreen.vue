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
        <div v-if="!isFullScreen" class="content flex-grow flex flex-row">
          <div class="left pointer-events-auto flex flex-col">
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
              <bs-energy-consumption-average-per-day/>
            </div>
            <div class="right-tow">
              <bs-energy-consumption-per-person/>
            </div>
            <div class="right-three">
              <bs-energy-consumption-percent/>
            </div>
            <div class="right-tuli">
              <div class="right-tuli-item">
                  <div class="right-tuli-icon csq"></div>
                  <span>成熟期</span>
              </div>
              <div class="right-tuli-item">
                <div class="right-tuli-icon szq"></div>
                <span>生长期</span>
              </div>
              <div class="right-tuli-item">
                <div class="right-tuli-icon yhz"></div>
                <span>养护中</span>
              </div>
            </div>
          </div>
        </div>

    <equipment-detail-model v-model:show="dialogVisible" :model-params="modelParams"></equipment-detail-model>
    <wrj-control-model v-model:show="wrjDialogVisible" :set-show-chart="setFullScreen"></wrj-control-model>
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
    const isFullScreen = ref(false)

    onMounted(() => {
      layoutControl.hideAllLayout(store)
    })
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
    const setFullScreen=(val:boolean)=>{
      isFullScreen.value =val
    }
    return {
      home,
      startIntrusionDetection,
      setModel,
      setwrjModel,
      setFullScreen,
      isFullScreen,
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
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABzEAAABMCAYAAADtG0qAAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGWGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzUyLCAyMDIwLzAxLzMwLTE1OjUwOjM4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTEwLTI5VDE1OjE0OjI1KzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTEwLTI5VDE1OjE0OjI1KzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0xMC0yOVQxNToxNDoyNSswODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpkOWQ0Y2Q5My1kZmEzLTRjNDItOTRkOC0xMzM1NjVhMTA4YjAiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4NjNlNTg0Ni05MTdhLTJlNDktODY1Ni0xYTdmYzUwM2IyNjYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkMDk5NzRlNC03NGY3LTU1NDUtYjBiNC04Mzg4MTc1NTU3MzYiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpkMDk5NzRlNC03NGY3LTU1NDUtYjBiNC04Mzg4MTc1NTU3MzYiIHN0RXZ0OndoZW49IjIwMjEtMTAtMjlUMTU6MTQ6MjUrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4xIChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZDlkNGNkOTMtZGZhMy00YzQyLTk0ZDgtMTMzNTY1YTEwOGIwIiBzdEV2dDp3aGVuPSIyMDIxLTEwLTI5VDE1OjE0OjI1KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6MmExYzhjYzQtYmRiNC02NDQ1LWExODUtYmJlMGY2ZjIwNzQ5PC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Qt74GwAAR59JREFUeJztnXuMZ8lV30/9uqenZ3bWs+v1Prx+sTaQtWNBUIA/CKBgcBTAOCQicUwSBFgWQoBCEotEicIfURJeikCKgsRDCjEKIg+BsXlYEEEECSFEjmXj2IBjiO3d9T69r3n0THf/Kn90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');
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
  .right{
    position: relative;
    .right-tuli{
      position: absolute;
      left: -120px;
      bottom: 10%;
      width: 80px;
      height: 100px;
      //background-color: #333333;
      display: flex;
      flex-direction: column;
      color: #fff;
      &-item{
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      &-icon{
        width: 14px;
        height: 14px;
        border-radius: 4px;
      }
      .csq{
        background-color: #2975ca;
      }
      .szq{
        background-color: #53c847;
      }
      .yhz{
        background-color: #bc9f5e;
      }
    }
  }
}
</style>
