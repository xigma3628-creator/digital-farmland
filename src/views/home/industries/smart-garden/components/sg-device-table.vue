<template>
  <div class="sg-panel sg-device-table">
    <div class="sg-panel-header">设备运行状态</div>
    <div class="table-head">
      <span class="c-idx">序号</span>
      <span class="c-name">设备名称</span>
      <span class="c-type">类型</span>
      <span class="c-status">状态</span>
      <span class="c-metric">实时指标</span>
    </div>
    <div class="table-body">
      <div class="table-row" v-for="(dev, idx) in gardenDevices" :key="dev.id">
        <span class="c-idx">{{ idx + 1 }}</span>
        <span class="c-name" :title="dev.name">{{ dev.name }}</span>
        <span class="c-type">{{ deviceTypeText[dev.type] }}</span>
        <span class="c-status">
          <i class="dot" :class="dev.status"></i>{{ dev.status === 'online' ? '在线' : '离线' }}
        </span>
        <span class="c-metric">{{ deviceMetricText(dev) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { gardenDevices, deviceTypeText, deviceMetricText } from '@/libs/smart-garden/simulator'

export default defineComponent({
  name: 'sg-device-table',
  setup() {
    return { gardenDevices, deviceTypeText, deviceMetricText }
  }
})
</script>

<style scoped lang="scss">
.sg-device-table {
  height: 320px;
  display: flex;
  flex-direction: column;
  .table-head,
  .table-row {
    display: flex;
    align-items: center;
    padding: 0 10px;
    .c-idx { width: 36px; }
    .c-name { flex: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .c-type { width: 64px; }
    .c-status { width: 56px; }
    .c-metric { flex: 1.4; text-align: right; }
  }
  .table-head {
    height: 34px;
    color: #9fd8b4;
    background: rgba(13, 122, 114, 0.25);
    font-size: 13px;
  }
  .table-body {
    flex: 1;
    overflow-y: auto;
    .table-row {
      height: 34px;
      color: #d7efe2;
      font-size: 12px;
      border-bottom: 1px solid rgba(13, 122, 114, 0.2);
      .dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        margin-right: 4px;
        &.online { background: #52c41a; box-shadow: 0 0 6px #52c41a; }
        &.offline { background: #ff4d4f; box-shadow: 0 0 6px #ff4d4f; }
      }
    }
  }
}
</style>
