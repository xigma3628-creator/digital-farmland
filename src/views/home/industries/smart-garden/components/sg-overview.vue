<template>
  <div class="sg-panel sg-overview">
    <div class="sg-panel-header">园区概况</div>
    <div class="cards">
      <div class="card">
        <div class="card-value">{{ deviceTotal }}</div>
        <div class="card-label">接入设备（台）</div>
      </div>
      <div class="card">
        <div class="card-value">{{ onlineRate }}<span class="unit">%</span></div>
        <div class="card-label">设备在线率</div>
      </div>
      <div class="card">
        <div class="card-value">{{ irrigationToday }}<span class="unit">m³</span></div>
        <div class="card-label">今日灌溉量</div>
      </div>
      <div class="card" :class="{ warn: alarmCount > 0 }">
        <div class="card-value">{{ alarmCount }}</div>
        <div class="card-label">活动告警（条）</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { gardenDevices, gardenAlarms, irrigationToday } from '@/libs/smart-garden/simulator'

export default defineComponent({
  name: 'sg-overview',
  setup() {
    const deviceTotal = computed(() => gardenDevices.length)
    const onlineRate = computed(() => {
      const online = gardenDevices.filter(d => d.status === 'online').length
      return Math.round((online / gardenDevices.length) * 100)
    })
    const alarmCount = computed(() => gardenAlarms.length)
    return { deviceTotal, onlineRate, alarmCount, irrigationToday }
  }
})
</script>

<style scoped lang="scss">
.sg-overview {
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 12px;
    .card {
      background: rgba(13, 122, 114, 0.15);
      border: 1px solid rgba(13, 122, 114, 0.5);
      border-radius: 4px;
      padding: 10px 12px;
      .card-value {
        color: #7cfc9c;
        font-size: 26px;
        font-weight: bold;
        .unit {
          font-size: 13px;
          margin-left: 4px;
          color: #9fd8b4;
        }
      }
      .card-label {
        color: #b7d8c8;
        font-size: 13px;
        margin-top: 2px;
      }
      &.warn .card-value {
        color: #ff6b6b;
      }
    }
  }
}
</style>
