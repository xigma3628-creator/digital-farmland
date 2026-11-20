<template>
  <div class="sg-panel sg-ai">
    <div class="sg-panel-header">
      AI 识别
      <span class="ai-hint">今日 {{ aiStats.today }} 次 · 病虫害 {{ aiStats.pests }} · 均值 {{ aiStats.avgConfidence }}%</span>
    </div>
    <div class="ai-toolbar">
      <button class="scan" :disabled="aiScanning" @click="scanAllCameras()">
        {{ aiScanning ? '巡检中…' : '全园巡检' }}
      </button>
      <span class="tip">对全部在线摄像头执行病虫害 / 长势识别</span>
    </div>
    <div class="ai-body">
      <div v-if="aiResults.length === 0" class="empty">暂无识别结果，点击「全园巡检」开始</div>
      <div v-else class="ai-item" v-for="r in aiResults" :key="(r.id || r.ts) + r.cameraId" :class="r.kind">
        <div class="ai-row">
          <span class="badge">{{ r.kind === 'pest' ? '病虫害' : '长势' }}</span>
          <span v-if="r.source === 'mock-fallback' || r.source === 'mock'" class="mock-tag">模拟</span>
          <span class="label">{{ r.label }}</span>
          <span class="cam">{{ r.cameraName }}</span>
          <span class="time">{{ fmtIsoTime(r.ts) }}</span>
        </div>
        <div class="ai-row2">
          <div class="bar">
            <div class="fill" :style="{ width: Math.round(r.confidence * 100) + '%' }"></div>
          </div>
          <span class="conf">{{ Math.round(r.confidence * 100) }}%</span>
          <span class="src">{{ sourceLabel(r.source) }}</span>
        </div>
        <div class="advice" :title="r.advice">{{ r.advice }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue'
import {
  aiResults, aiStats, aiScanning, scanAllCameras, fetchAiResults,
  startMockAi, stopMockAi
} from '@/libs/smart-garden/ai-recognition'
import { dataSourceState } from '@/libs/smart-garden/simulator'
import { fmtIsoTime } from '@/libs/smart-garden/format'

export default defineComponent({
  name: 'sg-ai',
  setup() {
    const isMock = () => dataSourceState.mode === 'mock'
    const SOURCE_LABELS: Record<string, string> = {
      model: '模型',
      'mock-fallback': '模拟',
      mock: '模拟',
      auto: '巡检',
      manual: '手动'
    }
    const sourceLabel = (source: string): string => SOURCE_LABELS[source] || source
    onMounted(() => {
      if (!isMock()) fetchAiResults()
    })
    onUnmounted(() => {
      stopMockAi()
    })
    return { aiResults, aiStats, aiScanning, scanAllCameras, fmtIsoTime, sourceLabel }
  }
})
</script>

<style scoped lang="scss">
.sg-ai {
  height: 252px;
  display: flex;
  flex-direction: column;
  .ai-hint {
    float: right;
    margin-right: 12px;
    font-size: 12px;
    font-weight: normal;
    color: #9fd8b4;
  }
  .ai-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px 0;
    .scan {
      padding: 2px 12px;
      font-size: 12px;
      border: 1px solid #0d7a72;
      border-radius: 3px;
      background: rgba(13, 122, 114, 0.3);
      color: #7cfc9c;
      cursor: pointer;
      &:hover:not(:disabled) { background: rgba(13, 122, 114, 0.6); }
      &:disabled { color: #6f9c88; cursor: not-allowed; }
    }
    .tip { color: #6f9c88; font-size: 11px; }
  }
  .ai-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px 10px;
    .empty {
      color: #7ba28f;
      font-size: 12px;
      text-align: center;
      padding-top: 16px;
    }
    .ai-item {
      border-left: 2px solid #0d7a72;
      background: rgba(13, 122, 114, 0.12);
      padding: 4px 8px;
      margin-bottom: 5px;
      font-size: 12px;
      &.pest {
        border-left-color: #ff4d4f;
        background: rgba(255, 77, 79, 0.10);
        .badge { background: rgba(255, 77, 79, 0.25); color: #ff8f8f; border-color: #a33; }
        .fill { background: #ff7875; }
      }
      &.growth {
        .badge { background: rgba(56, 224, 138, 0.18); color: #7cfc9c; border-color: #2a7; }
        .fill { background: #38e08a; }
      }
      .ai-row {
        display: flex;
        align-items: center;
        gap: 8px;
        .badge {
          font-size: 10px;
          padding: 0 6px;
          border: 1px solid;
          border-radius: 2px;
          line-height: 16px;
          flex-shrink: 0;
        }
        .mock-tag {
          font-size: 10px;
          padding: 0 5px;
          border: 1px solid #b8860b;
          border-radius: 2px;
          line-height: 16px;
          color: #ffd666;
          background: rgba(255, 214, 102, 0.12);
          flex-shrink: 0;
        }
        .label { color: #fff; font-weight: bold; }
        .cam { color: #b7d8c8; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .time { color: #8fbfa8; font-family: monospace; font-size: 11px; }
      }
      .ai-row2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 3px;
        .bar {
          flex: 1;
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
          .fill { height: 100%; border-radius: 3px; }
        }
        .conf { color: #87e8de; font-family: monospace; font-size: 11px; width: 34px; text-align: right; }
        .src { color: #6f9c88; font-size: 10px; min-width: 26px; white-space: nowrap; text-align: right; }
      }
      .advice {
        margin-top: 2px;
        color: #8fbfa8;
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
