<template>
  <div class="bs-energy-consumption-per-person">
    <div class="bs-energy-consumption-per-person-header">
      <img src="/static/imgs/中心.png">
      <div class="bs-energy-consumption-per-person-header-text">病虫害风险预警</div>
    </div>
    <div class="bs-energy-consumption-per-person-main">
      <div id="myEcharts3" :style="{ width: '100%', height: '100%' }"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
export default defineComponent({
  name: 'bs-energy-consumption-per-person',
  setup(props, { emit }) {
    let echart:any = echarts;
    let  chart:any=null;
    const fomateDate=(bitem:Date)=>{
      return `${bitem.getFullYear()}-${bitem.getMonth()>8?(bitem.getMonth()+1):'0'+(bitem.getMonth()+1)}-${bitem.getDate()>9?bitem.getDate():'0'+bitem.getDate()}`
    }
    const date=new Date();
    const f:any[]=[];
    const b:any[]=[];
    for(let i=0;i<7;i++){
      const fitem=new Date(date.getTime()-((i+1)*1000*60*60*24))
      const bitem=new Date(date.getTime()+((i+1)*1000*60*60*24))
      f.push(fomateDate(fitem))
      b.push(fomateDate(bitem))
    }
    const xAxis=[...f,fomateDate(date),...b];
    const yAxisData:number[][]=[[],[]];
    xAxis.forEach((v,i)=>{
      yAxisData[0].push((Math.cos(i*0.4)*0.5+0.5)*0.3+0.1);
      yAxisData[1].push((Math.sin(i*0.8)*0.5+0.5)*0.45+0.05);
    })
    const initEcharts = () => {
      const option = {
        backgroundColor:'transparent',
        tooltip: {
          trigger: 'axis',
        },
        color:['#fcba62','#69f0ff'],
        legend: {
          top: '5%',
          right:'5%',
          textStyle: {
            color: '#fff',
            fontSize: 14,
            padding:[0,8,0,8]
          }
        },
        grid: {
          top: '15%',
          left: '10%',
          right: '5%',
          bottom: '15%',
        },
        xAxis: [
          {
            type: 'category',
            axisLine: {
              // lineStyle: {
              //   color: '#425b78'
              // },
              // 显示所有标签
            },
            axisLabel: {
              color: '#b9bec6',
              // 换行显示
              // formatter: function (value:any) {
              //   return value.split('').join('\n');
              // },
              // 旋转标签
              // rotate: 45
            },
            splitLine: {
              show: false
            },
            interval: 0,
            boundaryGap: false,
            data: xAxis, //this.$moment(data.times).format("HH-mm") ,
          },
        ],

        yAxis: [
          {
            type: 'value',
            min:0,
            max:1,
            nameTextStyle:{
              color:"#b9bec6",
              fontSize:12,
            },
            axisLine: {
              lineStyle: {
                color: '#425b78',
                fontSize: 14
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#587485',
              },
            },
            axisLabel: {
              show: true,
              textStyle: {
                color: '#b9bec6',

              },
            },
          },
        ],
        series: [
          {
            name: '病害风险系数',
            type: 'line',
            showSymbol: false,
            lineStyle: {
              normal: {
                color: '#fcba62',
              },
            },
            areaStyle: {
              normal: {
                color: new echarts.graphic.LinearGradient(
                  0,
                  0,
                  0,
                  1,
                  [
                    {
                      offset: 0,
                      color: 'rgba(223,172,105,0.5)',
                    },
                    {
                      offset: 1,
                      color: 'rgba(212,190,161,0)',
                    },
                  ],
                  false
                ),
              },
            },
            data: yAxisData[0], //data.values
          },
          {
            name: '虫害风险系数',
            type: 'line',
            showSymbol: false,
            lineStyle: {
              normal: {
                color: '#69f0ff',
              },
            },
            areaStyle: {
              normal: {
                color: new echarts.graphic.LinearGradient(
                  0,
                  0,
                  0,
                  1,
                  [
                    {
                      offset: 0,
                      color: 'rgba(107,205,216,0.5)',
                    },
                    {
                      offset: 1,
                      color: 'rgba(143,192,127,0)',
                    },
                  ],
                  false
                ),
              },
            },
            data: yAxisData[1], //data.values
          },
        ],
      };

      chart = echart.init(document.getElementById("myEcharts3"), "dark");
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
.bs-energy-consumption-per-person{
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
