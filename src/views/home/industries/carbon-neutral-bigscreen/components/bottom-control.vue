<template>
  <div class="bottom-control">
    <div class="bottom-control-item">
      <el-dropdown placement="top">
        <span class="bottom-control-item-text">
          <img src="/static/imgs/天气.png">
          天气切换
        </span>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown ">
            <el-dropdown-item @click="setWeather('晴天')">晴天</el-dropdown-item>
            <el-dropdown-item @click="setWeather('雨天')">雨天</el-dropdown-item>
            <el-dropdown-item @click="setWeather('下雪')">下雪</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="bottom-control-item">
      <el-dropdown placement="top">
        <span class="bottom-control-item-text">
          <img src="/static/imgs/智能巡检.png">
          日常巡检
        </span>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown ">
            <el-dropdown-item  @click="showWrjDialogVisible">
              <div :class="rcxj=='无人机巡航'?'user-dropdown-item active':'user-dropdown-item'">
                <span>无人机巡航</span>
                <el-icon v-if="rcxj=='无人机巡航'"><Select /></el-icon>
              </div>
            </el-dropdown-item>
            <el-dropdown-item @click="showHeatMap">
              <div :class="rcxj=='病虫害风险热力图'?'user-dropdown-item active':'user-dropdown-item'">
                <span>病虫害风险热力图</span>
                <el-icon v-if="rcxj=='病虫害风险热力图'"><Select /></el-icon>
              </div>
            </el-dropdown-item>
            <el-dropdown-item @click="startIntrusionDetection">
              <div :class="rcxj=='入侵检测'?'user-dropdown-item active':'user-dropdown-item'">
                <span>入侵检测</span>
                <el-icon v-if="rcxj=='入侵检测'"><Select /></el-icon>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, ref } from 'vue'
import '../style/el-dropdown.scss'
import { useStore } from '@/store'
import useLayoutControl from '@/views/home/industries/useLayoutControl'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import IntrusionDetection from '@/libs/cesium/libs/intrusion-detection/IntrusionDetection'
import { ElMessage } from 'element-plus'
import WrjControlModel from '@/views/home/industries/carbon-neutral-bigscreen/components/wrj-control-model.vue'
import { TemplateMutationTypes } from '@/store/modules/template/mutation-types'
import { WeatherType } from '@/share/weather-type.enum'

export default defineComponent({
  name: 'bottom-control',
  components: { WrjControlModel },
  props: {
    show: {
      type: Boolean
    },
    modelParams: {
      type: Object // 指定为 Object 类型
    }
  },
  emits: ['showWrjDialogVisible'],
  setup(props, {emit}) {
    const store = useStore()
    const layoutControl = useLayoutControl()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer
    const dialogVisible =ref(false)
    const rcxj=ref<string>('');
    const isProcessing = ref<boolean>(false);
    const wrjDialogVisible =ref(false)

    onMounted(() => {
      layoutControl.hideAllLayout(store)
    })
    /**
     * 入侵检测
     * */
    const startIntrusionDetection = () => {
      if (!viewer) return;
      if(isProcessing.value){
        ElMessage({
          message: `当前正在进行${rcxj.value}中，请等待其完成`,
          type: 'warning',
        })
        return;
      }
      showHeatMap(false);
      rcxj.value='入侵检测';
      const borderlayer = viewer?.jt?.layerManager.getLayer('border-layer')
      const intrusionDetection =viewer.jt?.intrusionDetection
      if(intrusionDetection){
        intrusionDetection.isInsideCallback = function() {
          borderlayer?.instance.ctx.setIntrude(true)
        }
        intrusionDetection.noInsideCallback = function() {
          isProcessing.value = false;
          rcxj.value='';
          borderlayer?.instance.ctx.setIntrude(false)
        }
        setTimeout(() => {
          isProcessing.value=true
          intrusionDetection.startPersonTrack()
        }, 500)
      }
    }
    /**
     * 风险热力图
     * */
    const showHeatMap=(show:boolean=true)=>{
      if (!viewer) return;
      if(isProcessing.value){
        ElMessage({
          message: `当前正在进行${rcxj.value}中，请等待其完成`,
          type: 'warning',
        })
        return;
      }
      rcxj.value='病虫害风险热力图';
      const headtMap=viewer.jt?.heatMap;
      if(headtMap){
        headtMap.setHeatMapVisible(show)
      }
    }
    const home = () => {
      viewer?.jt?.flyTo.flyToHome()
    }
    const  showWrjDialogVisible=()=>{
      if(isProcessing.value){
        ElMessage({
          message: `当前正在进行${rcxj.value}中，请等待其完成`,
          type: 'warning',
        })
        return;
      }
      rcxj.value='无人机巡航';
      isProcessing.value=true;
      emit('showWrjDialogVisible',true);
    }
    const wrjEnd=()=>{
      isProcessing.value=false;
      rcxj.value='';
    }

    const setWeather=(type:string)=>{
      switch (type) {
        case '晴天':
          viewer?.jt?.weatherEffects.setPostProcessStage('晴天','sun')
          store.commit(`template/${TemplateMutationTypes.SET_WEATHER}`,WeatherType.Sun)
          break;
        case '雨天':
          viewer?.jt?.weatherEffects.setPostProcessStage('雨','rain')
          store.commit(`template/${TemplateMutationTypes.SET_WEATHER}`,WeatherType.Rain)
          break;
        case '下雪':
          viewer?.jt?.weatherEffects.setPostProcessStage('雪','snow')
          store.commit(`template/${TemplateMutationTypes.SET_WEATHER}`,WeatherType.Snow)
          break;
      }
    }

    return {
      home,
      startIntrusionDetection,
      showHeatMap,
      showWrjDialogVisible,
      wrjEnd,
      wrjDialogVisible,
      setWeather,
      rcxj
      // setModel,
    }
  }
})
</script>
<style lang="scss" scoped>
.bottom-control {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  padding: 0 20px;
  color: #fff;
  display: flex;
  border: 1px solid #0d7a72;
  background-color: #333333;
  justify-content: space-between;
  align-items: center;

  &-item {
    text-align: center;
    cursor: pointer;
    flex: 1;
    height: 100%;
    img{
      width: 24px;
      margin-right: 10px;
    }
    .bottom-control-item-text{
      display: flex;
      align-items: center;
    }
    .el-dropdown {
      --el-dropdown-menu-box-shadow: none;
      --el-dropdown-menuItem-hover-fill: none;
      --el-dropdown-menuItem-hover-color: none;
      --el-dropdown-menu-index: 10;
      color: #fff;
      font-size: 16px;
      line-height: 50px;

      .bottom-control-item-text.el-tooltip__trigger.el-tooltip__trigger:focus-visible {
        outline: unset;
      }

    }
  }
}
</style>
