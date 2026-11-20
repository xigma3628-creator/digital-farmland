<template>
  <div class="sg-panel sg-sensor-chart">
    <div class="sg-panel-header">环境监测实时曲线</div>
    <div class="chart-wrap">
      <div id="sg-sensor-chart-el" :style="{ width: '100%', height: '100%' }"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { sensorHistory } from '@/libs/smart-garden/simulator'

export default defineComponent({
  name: 'sg-sensor-chart',
  setup() {
    let chart: echarts.ECharts | null = null

    const buildOption = (): echarts.EChartsOption => {
      const times = sensorHistory.map(p => p.time)
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['土壤湿度(%)', '空气温度(℃)', '空气湿度(%)'],
          textStyle: { color: '#b7d8c8', fontSize: 11 },
          top: 0
        },
        grid: { left: 40, right: 12, top: 30, bottom: 22 },
        xAxis: { type: 'category', data: times, axisLabel: { color: '#7ba28f', fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { color: '#7ba28f', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(13,122,114,0.3)' } } },
        series: [
          {
            name: '土壤湿度(%)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: sensorHistory.map(p => +p.soil.toFixed(1)),
            lineStyle: { color: '#ffa940' },
            itemStyle: { color: '#ffa940' }
          },
          {
            name: '空气温度(℃)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: sensorHistory.map(p => +p.air.toFixed(1)),
            lineStyle: { color: '#36cfc9' },
            itemStyle: { color: '#36cfc9' }
          },
          {
            name: '空气湿度(%)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: sensorHistory.map(p => +p.humidity.toFixed(1)),
            lineStyle: { color: '#7cfc9c' },
            itemStyle: { color: '#7cfc9c' }
          }
        ]
      }
    }

    onMounted(() => {
      chart = echarts.init(document.getElementById('sg-sensor-chart-el'), 'dark')
      chart.setOption(buildOption())
    })

    watch(
      () => sensorHistory.length,
      () => {
        chart?.setOption(buildOption())
      }
    )

    onUnmounted(() => {
      chart?.dispose()
      chart = null
    })
  }
})
</script>

<style scoped lang="scss">
.sg-sensor-chart {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .chart-wrap {
    flex: 1;
    min-height: 0;
  }
}
</style>
