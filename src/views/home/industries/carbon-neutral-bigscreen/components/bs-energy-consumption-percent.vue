
<template>
  <div class="bs-energy-consumption-percent">
    <div class="bs-energy-consumption-percent-header">
      <img src="/static/imgs/分布.png">
      <div class="bs-energy-consumption-percent-header-text">经济收益</div>
    </div>
    <div class="bs-energy-consumption-percent-main">
      <div id="myEcharts6" :style="{ width: '100%', height: '100%' }"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'bs-energy-consumption-percent',
  setup(props, { emit }) {
    let echart:any = echarts;
    let  chart:any=null;
    const initEcharts = () => {
      let color = ['#6597FB', '#5FF5E8', '#18BEF7', '#F67C2D'];
      let echartData = [
        {
          name: '香蕉',
          value: '37.2',
        },
        {
          name: '猕猴桃',
          value: '29.2',
        },
        {
          name: '葡萄',
          value: '22.0',
        },
        {
          name: '草莓',
          value: '14.2',
        },
      ];

      let total = echartData.reduce((a, b:any) => {
        return a + b.value * 1;
      }, 0).toFixed(2);

    const  option = {
        backgroundColor: 'transparent',
        color: color,
        title: [
          {
            text: '{val|' + total +'万元'+ '}',
            top: 'center',
            left: 'center',
            textStyle: {
              rich: {
                val: {
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#FFF',
                },
              },
            },
          },
        ],
        series: [
          {
            type: 'pie',
            radius: ['35%', '65%'],
            center: ['50%', '50%'],
            data: echartData,
            hoverAnimation: false,
            labelLine: {
              normal: {
                length: 10,
                length2: 20,
                lineStyle: {
                  color: 'rgba(75, 219, 198, 1)',
                },
              },
            },
            label: {
              normal: {
                formatter: (params:any) => {
                  return '{name|' + params.name + '}'+ '\n' +' {value|' + params.value +'万元'+ '}';
                },
                rich: {
                  name: {
                    fontSize: 10,
                    fontFamily: 'PingFang SC',
                    fontWeight: 400,
                    color: 'auto',
                    lineHeight:20,
                    align: 'center'
                  },
                  value: {
                    fontSize: 13,
                    fontFamily: 'Source Han Sans CN',
                    color: '#FFF',
                    fontWeight: 400,
                    lineHeight:16,
                    align: 'center'
                  },
                },
              },
            },
          },
        ],
      };

      chart = echart.init(document.getElementById("myEcharts6"), "dark");
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
.bs-energy-consumption-percent{
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

