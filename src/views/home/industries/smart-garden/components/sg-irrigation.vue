<template>
  <div class="sg-panel sg-irrigation">
    <div class="sg-panel-header">
      灌溉闭环控制
      <span class="mode-hint">{{ autoCount }} 个分区自动运行中</span>
    </div>
    <div class="zone-body">
      <div v-if="!irrigationReady.ok" class="empty">灌溉服务未连接（{{ irrigationReady.error || '后端离线' }}）</div>
      <div v-else-if="irrigationZones.length === 0" class="empty">暂无灌溉分区</div>
      <div v-else class="zone-item" v-for="z in irrigationZones" :key="z.id" :class="z.state">
        <div class="zone-head">
          <span class="zone-name">{{ z.name }}</span>
          <span class="zone-state">{{ stateText(z.state) }}</span>
        </div>
        <div class="zone-metrics">
          <span class="m">墒情 <b :class="{ low: z.moisture !== null && z.moisture < z.moistureLow }">{{ z.moisture === null ? '——' : z.moisture.toFixed(1) + '%' }}</b></span>
          <span class="m">用水 {{ z.todayLiters.toFixed(1) }} L</span>
          <span class="m">阀门 {{ z.valveOpen ? z.flow.toFixed(1) + ' m³/h' : '关闭' }}</span>
        </div>
        <div class="zone-reason" :title="z.lastReason">{{ z.lastReason || '——' }}</div>
        <div class="zone-actions">
          <button class="mini" :class="{ active: z.mode === 'manual' }" @click="toggleMode(z)">
            {{ z.mode === 'auto' ? '转手动' : '转自动' }}
          </button>
          <button class="mini valve" :class="{ open: z.valveOpen }" @click="toggleValve(z)">
            {{ z.valveOpen ? '关阀' : '开阀' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, onUnmounted } from 'vue'
import {
  irrigationZones, irrigationReady, fetchIrrigationZones, setZoneMode, setZoneValve, IrrigationZone,
  mockSetMode, mockSetValve, stopMockIrrigation
} from '@/libs/smart-garden/irrigation'
import { dataSourceState } from '@/libs/smart-garden/simulator'

const STATE_TEXT: Record<string, string> = {
  idle: '待机',
  watering: '灌溉中',
  cooldown: '冷却中'
}

export default defineComponent({
  name: 'sg-irrigation',
  setup() {
    const autoCount = computed(() => irrigationZones.filter(z => z.mode === 'auto').length)
    const stateText = (s: string): string => STATE_TEXT[s] || s
    const isMock = computed(() => dataSourceState.mode === 'mock')

    const toggleMode = async (z: IrrigationZone): Promise<void> => {
      const target = z.mode === 'auto' ? 'manual' : 'auto'
      if (isMock.value) mockSetMode(z.id, target)
      else await setZoneMode(z.id, target)
    }
    const toggleValve = async (z: IrrigationZone): Promise<void> => {
      if (isMock.value) mockSetValve(z.id, !z.valveOpen)
      else await setZoneValve(z.id, !z.valveOpen)
    }

    onMounted(() => {
      if (!isMock.value) fetchIrrigationZones()
    })

    onUnmounted(() => {
      stopMockIrrigation()
    })

    return { irrigationZones, irrigationReady, autoCount, stateText, toggleMode, toggleValve, isMock }
  }
})
</script>

<style scoped lang="scss">
.sg-irrigation {
  height: 250px;
  display: flex;
  flex-direction: column;
  .mode-hint {
    float: right;
    margin-right: 12px;
    font-size: 12px;
    font-weight: normal;
    color: #9fd8b4;
  }
  .zone-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px 10px;
    .empty {
      color: #7ba28f;
      font-size: 12px;
      text-align: center;
      padding-top: 18px;
    }
    .zone-item {
      border-left: 2px solid #0d7a72;
      background: rgba(13, 122, 114, 0.12);
      padding: 6px 8px;
      margin-bottom: 6px;
      font-size: 12px;
      &.watering {
        border-left-color: #36cfc9;
        background: rgba(54, 207, 201, 0.12);
        box-shadow: inset 0 0 12px rgba(54, 207, 201, 0.15);
      }
      &.cooldown { border-left-color: #faad14; }
      .zone-head {
        display: flex;
        justify-content: space-between;
        .zone-name { color: #d9f7e8; font-weight: bold; }
        .zone-state { color: #7cfc9c; }
      }
      .zone-metrics {
        display: flex;
        gap: 12px;
        color: #b7d8c8;
        margin-top: 2px;
        b { color: #e8ffef; }
        b.low { color: #ffa39e; }
      }
      .zone-reason {
        margin-top: 2px;
        color: #8fbfa8;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .zone-actions {
        margin-top: 4px;
        display: flex;
        gap: 6px;
        .mini {
          padding: 1px 8px;
          font-size: 11px;
          border: 1px solid #0d7a72;
          border-radius: 2px;
          background: rgba(13, 122, 114, 0.3);
          color: #7cfc9c;
          cursor: pointer;
          &:hover { background: rgba(13, 122, 114, 0.6); }
          &.active { border-color: #faad14; color: #ffe58f; }
          &.valve.open { border-color: #36cfc9; color: #87e8de; }
        }
      }
    }
  }
}
</style>
