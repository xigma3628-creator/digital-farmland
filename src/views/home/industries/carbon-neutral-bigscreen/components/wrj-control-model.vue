<template>
  <el-dialog
    v-model="dialogVisible"
    title="Tips"
    width="400"
    modal-class="wrj-model-mask"
    :top="dialogTop"
    draggable
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="my-header">
        <el-icon class="close" @click="closeDialog"><Close /></el-icon>
      </div>
    </template>
    <div class="wrj-dialog">
      <h2>无人机巡航</h2>
      <div class="wrj-dialog-header">
        <el-button type="primary" @click="pausedDroneCruise">暂停</el-button>
        <el-button type="primary" @click="handleStop">结束</el-button>
      </div>
      <video width="100%" controls autoplay loop>
        <source :src="'/static/35.mp4'" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, inject, onUnmounted } from 'vue'
import Cesium, { Cartesian2 } from 'cesium'
import { ModelParams } from '@/share/interface'
import FarmlandMonitoringDataDomain from '@/domain/farmlandMonitoringData.domain'
import FarmlandMonitoringData from '@/domain/farmlandMonitoringData.domain'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import { Close } from '@element-plus/icons-vue'

/**
 * 无人机巡航控制弹窗
 */
export default defineComponent({
  name: 'wrj-control-model',
  props: {
    show: {
      type: Boolean,
    },
    setShowChart: {
      type: Function,
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const dialogVisible = computed({
      get() {
        return props.show;
      },
      set(newValue) {
        emit('update:show', newValue);
      }
    })
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const dialogTop = ref('30vh')
    const dialogLeft = ref('-400px')

    const closeDialog = () => {
      dialogVisible.value = false;
    }

    const startDroneCruise = () => {
      viewer?.jt?.droneCruise.start(() => {
          props.setShowChart && props.setShowChart(true);
          viewer?.jt?.layerManager.setLayerVisible('farmland-layer', false)
          viewer?.jt?.layerManager.setLayerVisible('equipment-layer', false)
          viewer?.jt?.layerManager.setLayerVisible('crop-layer', true)
        },
        () => {
          props.setShowChart && props.setShowChart(false);
          viewer?.jt?.layerManager.setLayerVisible('farmland-layer', true)
          viewer?.jt?.layerManager.setLayerVisible('equipment-layer', true)
          viewer?.jt?.layerManager.setLayerVisible('crop-layer', true)
          emit('update:show', false);
        }
      )
    }

    const stopDroneCruise = () => {
      viewer?.jt?.droneCruise.stop()
    }

    const pausedDroneCruise = () => {
      viewer?.jt?.droneCruise.pause()
    }

    const handleStop = () => {
      emit('update:show', false)
    }

    // const beforeOpen = () => {
    //   dialogLeft.value = '-400px'
    //   setTimeout(() => {
    //     dialogLeft.value = '0px'
    //   }, 0)
    // }
    //
    // const beforeClose = () => {
    //   dialogLeft.value = '-400px'
    //   return new Promise((resolve) => {
    //     setTimeout(() => {
    //       resolve(true)
    //     }, 300)
    //   })
    // }

    watch(dialogVisible, (newVal, oldVal) => {
      if (newVal) {
        // 设置全屏
        startDroneCruise();
      } else {
        // 退出巡航
        if (viewer?.jt?.droneCruise.state!== 'STOPPING') {
          stopDroneCruise();
        }
      }
    })

    return {
      dialogVisible,
      startDroneCruise,
      pausedDroneCruise,
      stopDroneCruise,
      closeDialog,
      handleStop,
      dialogTop,
      dialogLeft
    }
  }
})
</script>

<style lang="scss">
.wrj-model-mask {
  pointer-events: auto !important;
  background-color: rgba(255, 255, 255, 0)!important;
  .el-dialog {
    background-color: #333;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #0d7a72;
    position: fixed;
    top: var(--dialog-top);
    left: var(--dialog-left);
    transition: left 0.3s ease;
    .my-header {
      height: 25px;
      background-image: url("/static/imgs/echarts/u7.svg");
      background-repeat: no-repeat;
      background-size: cover;
      display: flex;
      justify-content: right;
      align-items: center;
      padding-left: 10px;
      color: #fff;
      text-align: right;
      img {
        width: 25px;
        margin-right: 5px;
      }
      .close {
        cursor: pointer;
      }
      line-height: 50px;
      font-size: 20px;
    }
  }
}

.wrj-dialog {
  color: #fff !important;
  padding: 20px;

  video {
    margin-top: 20px;
  }
  .wrj-dialog-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;

    p {
      margin: 0;
    }
  }
}
</style>
