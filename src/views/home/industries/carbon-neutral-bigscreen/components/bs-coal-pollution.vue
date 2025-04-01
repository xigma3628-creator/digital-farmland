<!--bs-coal-pollution-->
<template>
  <div class="bs-energy-composition">
    <div class="bs-energy-composition-header">
      <img src="/static/imgs/数据.png">
      <div class="bs-energy-composition-header-text">气象监测</div>
    </div>
    <div class="bs-energy-composition-main">
      <div id="myEcharts" :style="{ width: '100%', height: '100%' }"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from "echarts";
export default defineComponent({
  name: 'bs-energy-composition',
  setup(props, { emit }) {
    let echart:any = echarts;
    let  chart:any=null;
    const initEcharts = () => {
     const option = {
        backgroundColor:'transparent',
        tooltip: {},
        toolbox: {
          show: false,
        },
        series: [
          {
            name: '温度',
            type: 'gauge',
            min: 0,
            max: 100,
            splitNumber: 5,
            center: ['75%', '50%'],
            radius: '60%',

            title: {
              fontWeight: 'bolder',
              fontSize: 12,
              color: '#FF6B6B',
              offsetCenter: [0, '70%'],
            },
            itemStyle: {
              normal: {
                color: '#595959',
              },
            },
            axisLine: {
              show: true,
              lineStyle: {
                width: 10,
                color: [
                  [
                    1,
                    new echarts.graphic.LinearGradient(
                      0,
                      0,
                      1,
                      0,
                      [
                        {
                          offset: 0.9,
                          color: '#FF8116', // 50% 处的颜色
                        },
                        {
                          offset: 0.7,
                          color: '#FFE200', // 50% 处的颜色
                        },
                        {
                          offset: 0.35,
                          color: '#2ED568', // 40% 处的颜色
                        },
                        {
                          offset: 0.1,
                          color: '#14B7FF', // 50% 处的颜色
                        },
                      ],
                      false
                    ),
                  ],
                ],
              }
              },
            axisTick: {
              length: 4,
            },
            splitLine: {
              length: 7.5,
            },
            pointer: {
              length: 48,
              width: 4,
            },
            detail: {
              fontSize: 14,
              color: '#FF6B6B',
              formatter: '{value}℃',
              offsetCenter: [0, '100%'],
            },
            data: [
              {
                value: 24,
                name: '温度',
              },
            ],
          },
          {
            name: '湿度',
            type: 'gauge',
            min: 0,
            max: 100,
            splitNumber: 5,
            center: ['25%', '50%'],
            radius: '60%',

            title: {
              fontWeight: 'bolder',
              fontSize: 12,
              color: '#4ECDC4',
              offsetCenter: [0, '70%'],
            },
            itemStyle: {
              normal: {
                color: '#595959',
              },
            },
            axisLine: {
              show: true,
              lineStyle: {
                width: 10,
                color: [
                  [
                    1,
                    new echarts.graphic.LinearGradient(
                      0,
                      0,
                      1,
                      0,
                      [
                        {
                          offset: 0.9,
                          color: '#FF8116', // 50% 处的颜色
                        },
                        {
                          offset: 0.7,
                          color: '#FFE200', // 50% 处的颜色
                        },
                        {
                          offset: 0.35,
                          color: '#2ED568', // 40% 处的颜色
                        },
                        {
                          offset: 0.1,
                          color: '#14B7FF', // 50% 处的颜色
                        },
                      ],
                      false
                    ),
                  ],
                ],
              }
            },
            axisTick: {
              length: 4,
            },
            splitLine: {
              length: 7.5,
            },
            pointer: {
              length: 48,
              width: 4,
            },
            detail: {
              fontSize: 14,
              color: '#4ECDC4',
              formatter: '{value}% RH',
              offsetCenter: [0, '100%'],
            },
            data: [
              {
                value: 65,
                name: '湿度',
              },
            ],
          },
        ],
      };

      chart = echart.init(document.getElementById("myEcharts"), "dark");
      chart.setOption(option)
    }
    onMounted(() => {
      initEcharts();
    });

    onUnmounted(() => {
      // echart&&echart.dispose();
    });
    return{

    }
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
