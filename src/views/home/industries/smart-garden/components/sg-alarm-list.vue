<template>
  <div class="sg-panel sg-alarm-list">
    <div class="sg-panel-header">实时告警</div>
    <div class="alarm-body">
      <div v-if="gardenAlarms.length === 0" class="empty">暂无告警，园区运行正常</div>
      <div class="alarm-item" v-for="alarm in gardenAlarms" :key="alarm.key" :class="alarm.level">
        <span class="time">{{ alarm.time }}</span>
        <span class="text">{{ alarm.text }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { gardenAlarms } from '@/libs/smart-garden/simulator'

export default defineComponent({
  name: 'sg-alarm-list',
  setup() {
    return { gardenAlarms }
  }
})
</script>

<style scoped lang="scss">
.sg-alarm-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .alarm-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 10px;
    .empty {
      color: #7ba28f;
      font-size: 12px;
      text-align: center;
      padding-top: 18px;
    }
    .alarm-item {
      display: flex;
      gap: 8px;
      font-size: 12px;
      padding: 5px 8px;
      margin-bottom: 6px;
      border-left: 2px solid #faad14;
      background: rgba(250, 173, 20, 0.08);
      color: #ffe58f;
      &.high {
        border-left-color: #ff4d4f;
        background: rgba(255, 77, 79, 0.1);
        color: #ffa39e;
      }
      .time {
        flex-shrink: 0;
        color: #9fd8b4;
      }
    }
  }
}
</style>
