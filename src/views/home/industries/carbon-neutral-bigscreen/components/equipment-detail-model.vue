<template>
  <el-dialog
    v-model="dialogVisible"
    title="Tips"
    width="500"
    modal-class="equipment-detail-model-mask"
    top="30vh"
    draggable
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="my-header">
        <el-icon class="close" @click="closeDialog"><Close /></el-icon>
      </div>
    </template>
    <div class="equipment-detail-dialog">
      <div class="equipment-detail-dialog-header">
        <p>空间环境温度: {{ params.data.ambientTemperature }}°C</p>
        <p>空间环境湿度: {{ params.data.ambientHumidity }}%</p>
        <p>土壤温度: {{ params.data.soilTemperature }}°C</p>
        <p>土壤湿度: {{ params.data.soilMoisture }}%</p>
        <p>土壤酸碱度: {{ params.data.soilPH }}</p>
        <p>监测器电量: {{ params.data.monitorBattery }}%</p>
        <p>光照强度: {{ params.data.lightIntensity }} lux</p>
      </div>
      <!-- 假设监控录像的URL存储在FarmlandMonitoringData类的一个新属性中 -->
      <video width="100%" controls>
        <source :src="'/static/35.mp4'" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'
import Cesium, { Cartesian2 } from 'cesium'
import { ModelParams } from '@/share/interface'
import FarmlandMonitoringDataDomain from '@/domain/farmlandMonitoringData.domain'
import FarmlandMonitoringData from '@/domain/farmlandMonitoringData.domain'

export default defineComponent({
  name: 'equipment-detail-model',
  props: {
    show: {
      type: Boolean,
    },
    modelParams: {
      type: Object, // 指定为 Object 类型
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

    const params = computed<{
      pos: Cartesian2,
      show: boolean,
      data: FarmlandMonitoringData
    }>(() => {
      return props.modelParams as {
        pos: Cartesian2,
        show: boolean,
        data: FarmlandMonitoringData
      };
    })

    const closeDialog = () => {
      dialogVisible.value = false;
    }

    return {
      dialogVisible,
      params,
      closeDialog
    }
  }
})
</script>

<style lang="scss">
.equipment-detail-model-mask {
  pointer-events: auto !important;
  background-color: rgba(255, 255, 255, 0)!important;
  .el-dialog {
    background-color: #333;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #0d7a72;
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

.equipment-detail-dialog {
  color: #fff !important;
  padding: 20px;

  //p {
  //  margin: 5px 0;
  //}

  video {
    margin-top: 20px;
  }
  .equipment-detail-dialog-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;

    p {
      margin: 0;
    }
  }
}
</style>
