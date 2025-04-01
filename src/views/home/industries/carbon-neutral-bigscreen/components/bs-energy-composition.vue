bs-energy-composition
<template>
  <div class="bs-energy-composition">
    <div class="bs-energy-composition-header">
      <img src="/static/imgs/图像.png">
      <div class="bs-energy-composition-header-text">近四年作物产量</div>
    </div>
    <div class="bs-energy-composition-main">
      <div id="myEcharts2" :style="{ width: '100%', height: '100%' }"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'bs-energy-composition',
  setup(props, { emit }) {
    let echart:any = echarts;
    let  chart:any=null;
    const initEcharts = () => {
      const option =  {
        backgroundColor:'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // Use axis to trigger tooltip
            type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
          }
        },
        legend: {
          textStyle:{
            color:'white'
          }
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '10',
          top:'10%',
          containLabel: true
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category',
          data: ['2021', '2022', '2023', '2024']
        },
        series: [
          {
            name: '香蕉',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [32.0, 30.2, 30.1, 33.4,]
          },
          {
            name: '葡萄',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [12.0, 13.2, 10.1, 13.4,]
          },
          {
            name: '猕猴桃',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [22.0, 18.2, 19.1, 23.4,]
          },
          {
            name: '草莓',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [15.0, 21.2, 20.1, 15.4]
          }
        ]
      };

      chart = echart.init(document.getElementById("myEcharts2"), "dark");
      chart.setOption(option)
    }
    onMounted(() => {
      initEcharts();
    });

    onUnmounted(() => {
      // echart&&echart.dispose();
    });
  }
})
</script>
<style scoped lang="scss">
.bs-energy-composition{
  width: 100%;
  height: 100%;
  ////background-image: url("/static/imgs/echarts/u5.svg");
  //background-repeat: no-repeat;
  //background-size: cover;
  //background-color: rgba(48, 48, 48, 0.75) !important;
  background-color: #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #0d7a72;
  color: #fff;
  &-header{
    height: 50px;
    background-image: url("/static/imgs/echarts/u7.svg");
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    align-items: center;
    padding-left: 10px;
    img{
      width: 25px;
      margin-right: 5px;
    }
    line-height: 50px;
    font-size: 20px;
  }
  &-main{
    flex: 1;
    width: 100%;
  }
}
</style>
