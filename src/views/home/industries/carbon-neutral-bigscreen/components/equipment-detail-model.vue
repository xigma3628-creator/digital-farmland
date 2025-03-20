
<template>
  <el-dialog
    v-model="dialogVisible"
    title="Tips"
    width="500"
    modal-class="equipment-detail-model-mask"
    top="30vh"
  >
    <div class="equipment-detail-dialog">
      <div class="equipment-detail-dialog-header">
        空间环境温度:{{params.data.ambientHumidity}}
      </div>
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
    }},
  emits: ['update:show'],
  setup(props, { emit }) {
    const  dialogVisible=computed({
      get() {
        return props.show;
      },
      set(newValue) {
        emit('update:show', newValue);
      }
    })
    const params=computed<{
      pos:Cartesian2,
      show:boolean,
      data:FarmlandMonitoringData
    }>(()=>{
      // console.log('model params',props.modelParams)
      return props.modelParams as {
        pos:Cartesian2,
        show:boolean,
        data:FarmlandMonitoringData
      };
    })
    // watch(params, (val:any) => {
    //   debugger
    // });
    // onMounted(()=>{
    //     console.log('model params',params)
    // })
    return {
      dialogVisible,
      params
    }
  }
})
</script>
<style  lang="scss">
.equipment-detail-model-mask{
  pointer-events: auto !important;
  background-color: rgba(255, 255, 255, 0)!important;
}
.equipment-detail-dialog{

}
</style>
