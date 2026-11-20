<template>
  <div class="sg fixed top-0 bottom-0 left-0 right-0 overflow-hidden flex flex-col">
    <div class="sg-header px-6 flex-grow-0 flex-shrink-0 pointer-events-auto flex flex-row items-center justify-between">
      <div class="sg-header-side"></div>
      <div class="sg-title text-white font-bold text-2xl">智慧园林监测大屏</div>
      <div class="sg-header-side flex justify-end items-center">
        <a class="sg-manage-link" href="#/manage-login">管理入口</a>
        <div class="sg-datasource pointer-events-auto flex items-center">
          <span class="dot" :class="statusDotClass"></span>
          <span class="label">{{ dataSourceState.mode === 'real' ? '后端实时' : '离线演示' }}</span>
          <button class="switch" :title="dataSourceState.lastError || ''" @click="toggle">
            {{ dataSourceState.mode === 'real' ? '切换离线' : '切换实时' }}
          </button>
        </div>
        <nowDate />
      </div>
    </div>
    <div class="content flex-grow flex flex-row overflow-hidden">
      <div class="sg-col pointer-events-auto flex flex-col">
        <sg-overview></sg-overview>
        <sg-ai></sg-ai>
        <sg-sensor-chart></sg-sensor-chart>
      </div>
      <div class="center flex-grow">
        <div class="tree-layer-panel sg-panel pointer-events-auto">
          <label class="tree-toggle">
            <input type="checkbox" :checked="treesVisible" @change="onTreeToggle" />
            <span>植被一张图</span>
          </label>
          <span v-if="treesVisible" class="tree-hint">{{ trees.length }} 棵 · 点击圆点查看档案</span>
        </div>
        <div class="drone-layer-panel sg-panel pointer-events-auto">
          <label class="drone-toggle">
            <input type="checkbox" :checked="droneEnabled" @change="onDroneToggle" />
            <span>巡检回放</span>
          </label>
          <template v-if="droneEnabled">
            <select class="drone-mission" :value="droneMissionId ?? ''" @change="onDroneMission">
              <option value="" disabled>选择任务</option>
              <option v-for="m in droneMissions" :key="m.id" :value="m.id">
                {{ m.missionNo }}（{{ missionStatusText[m.status] || m.status }}）
              </option>
            </select>
            <button class="drone-play" @click="toggleDronePlay">{{ dronePlaying ? '暂停' : '播放' }}</button>
            <input
              class="drone-slider" type="range" min="0" :max="droneDuration" step="0.5"
              :value="droneClock" @input="onDroneSlider"
            />
            <span class="drone-clock">{{ droneClock.toFixed(0) }}/{{ droneDuration }}s</span>
          </template>
        </div>
      </div>
      <div class="sg-col pointer-events-auto flex flex-col">
        <sg-irrigation></sg-irrigation>
        <sg-camera></sg-camera>
        <sg-device-table></sg-device-table>
        <sg-alarm-list></sg-alarm-list>
      </div>
    </div>
    <teleport to="body">
      <div class="tree-modal-mask" v-if="activeTree" @click.self="closeTree()">
        <div class="tree-modal">
          <div class="tree-modal-head">
            <span class="t-code">{{ activeTree.code }}</span>
            <span class="t-name">{{ activeTree.species }}</span>
            <span v-if="activeTree.ancient === 1" class="t-ancient">古树</span>
            <button class="close" @click="closeTree()">×</button>
          </div>
          <div class="tree-modal-body">
            <div class="t-row"><span class="k">学名</span><span class="v latin">{{ activeTree.latin || '-' }}</span></div>
            <div class="t-row"><span class="k">分区</span><span class="v">{{ activeTree.zone }}</span></div>
            <div class="t-row"><span class="k">树龄</span><span class="v">{{ activeTree.age }} 年</span></div>
            <div class="t-row"><span class="k">健康分</span><span class="v" :style="{ color: healthColor(activeTree.healthScore) }">{{ activeTree.healthScore }}</span></div>
            <div class="t-row"><span class="k">最近养护</span><span class="v">{{ fmtCare(activeTree.lastCareAt) }}</span></div>
            <div class="t-row" v-if="activeTree.note"><span class="k">备注</span><span class="v">{{ activeTree.note }}</span></div>
          </div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div class="drone-modal-mask" v-if="activeDroneFrame" @click.self="closeDroneFrame()">
        <div class="drone-modal">
          <div class="drone-modal-head">
            <span class="d-seq">第 {{ activeDroneFrame.seq }} 帧</span>
            <span class="d-time">{{ fmtTaken(activeDroneFrame.takenAt) }}</span>
            <span v-if="activeDroneFrame.priority === 1" class="d-priority">边缘标记</span>
            <button class="close" @click="closeDroneFrame()">×</button>
          </div>
          <img class="d-img" :src="frameImageUrl(activeDroneFrame)" alt="航拍帧" />
          <div class="drone-modal-body">
            <div class="t-row">
              <span class="k">坐标</span>
              <span class="v">{{ activeDroneFrame.lon }}, {{ activeDroneFrame.lat }}（{{ activeDroneFrame.alt }}m）</span>
            </div>
            <div class="t-row">
              <span class="k">来源</span>
              <span class="v">{{ activeDroneFrame.source === 'edge' ? '边缘盒子' : '云端回传' }} · {{ activeDroneFrame.inferStatus === 'pending' ? '识别待补跑' : '已识别' }}</span>
            </div>
            <div class="t-row" v-if="activeDroneFrame.aiResult">
              <span class="k">识别</span>
              <span class="v">{{ activeDroneFrame.aiResult.label }}（置信度 {{ Math.round((activeDroneFrame.aiResult.confidence || 0) * 100) }}%）</span>
            </div>
            <div class="t-row" v-if="activeDroneFrame.aiResult?.advice">
              <span class="k">建议</span>
              <span class="v">{{ activeDroneFrame.aiResult.advice }}</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, onMounted, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import useLayoutControl from '../useLayoutControl'
import { useStore } from '@/store'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'
import { startDataSource, stopSimulator, switchDataSource, dataSourceState, PARK_CENTER } from '@/libs/smart-garden/simulator'
import { treesVisible, trees, activeTree, closeTree, setTreesVisible, healthColor } from '@/libs/smart-garden/tree-layer'
import {
  droneEnabled, droneMissions, droneMissionId, droneClock, droneDuration, dronePlaying,
  activeDroneFrame, setDroneEnabled, selectDroneMission, setDroneClock, toggleDronePlay,
  closeDroneFrame, frameImageUrl, MISSION_STATUS_TEXT
} from '@/libs/smart-garden/drone-layer'
import nowDate from '../carbon-neutral-bigscreen/components/now-date.vue'
import sgOverview from './components/sg-overview.vue'
import sgSensorChart from './components/sg-sensor-chart.vue'
import sgDeviceTable from './components/sg-device-table.vue'
import sgAlarmList from './components/sg-alarm-list.vue'
import sgIrrigation from './components/sg-irrigation.vue'
import sgCamera from './components/sg-camera.vue'
import sgAi from './components/sg-ai.vue'

export default defineComponent({
  name: 'smart-garden-bigscreen',
  components: { nowDate, sgOverview, sgSensorChart, sgDeviceTable, sgAlarmList, sgIrrigation, sgCamera, sgAi },
  setup() {
    const store = useStore()
    const layoutControl = useLayoutControl()
    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const viewer = (cesiumRef || {}).viewer

    const statusDotClass = computed(() => {
      if (dataSourceState.mode === 'mock') return 'mock'
      return dataSourceState.wsConnected ? 'ok' : 'warn'
    })

    const toggle = async (): Promise<void> => {
      await switchDataSource(dataSourceState.mode === 'real' ? 'mock' : 'real')
    }

    const onTreeToggle = (): void => {
      setTreesVisible(!treesVisible.value)
    }
    const fmtCare = (iso: string): string => (iso ? iso.slice(0, 10) : '暂无记录')

    const onDroneToggle = (): void => {
      setDroneEnabled(!droneEnabled.value)
    }
    const onDroneMission = (e: Event): void => {
      const id = Number((e.target as HTMLSelectElement).value)
      if (Number.isInteger(id) && id > 0) selectDroneMission(id)
    }
    const onDroneSlider = (e: Event): void => {
      setDroneClock(Number((e.target as HTMLInputElement).value))
    }
    const fmtTaken = (iso: string): string => (iso ? iso.replace('T', ' ').slice(0, 19) : '-')

    onMounted(() => {
      layoutControl.hideAllLayout(store)
      startDataSource()
      if (viewer) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(PARK_CENTER.lon, PARK_CENTER.lat - 0.003, 2600),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-55),
            roll: 0
          },
          duration: 1.5
        })
      }
    })

    onUnmounted(() => {
      stopSimulator()
      import('@/libs/smart-garden/realtime').then(m => m.stopRealtime()).catch(() => {})
    })

    return { dataSourceState, statusDotClass, toggle, treesVisible, trees, activeTree, closeTree, onTreeToggle, healthColor, fmtCare,
      droneEnabled, droneMissions, droneMissionId, droneClock, droneDuration, dronePlaying, activeDroneFrame,
      toggleDronePlay, closeDroneFrame, frameImageUrl, missionStatusText: MISSION_STATUS_TEXT,
      onDroneToggle, onDroneMission, onDroneSlider, fmtTaken }
  }
})
</script>

<style scoped lang="scss">
.sg {
  pointer-events: none;
  .sg-header {
    height: 72px;
    background: linear-gradient(180deg, rgba(4, 24, 20, 0.9), rgba(4, 24, 20, 0));
    .sg-title {
      letter-spacing: 4px;
      text-shadow: 0 0 12px rgba(50, 205, 50, 0.6);
    }
    .sg-header-side {
      width: 400px;
    }
    .sg-manage-link {
      margin-right: 14px;
      padding: 2px 10px;
      border: 1px solid #0d7a72;
      border-radius: 3px;
      background: rgba(13, 122, 114, 0.3);
      color: #7cfc9c;
      font-size: 12px;
      text-decoration: none;
      white-space: nowrap;
      &:hover { background: rgba(13, 122, 114, 0.6); }
    }
    .sg-datasource {
      margin-right: 16px;
      gap: 8px;
      color: #cdeee3;
      font-size: 13px;      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #8a8a8a;
        &.ok { background: #38e08a; box-shadow: 0 0 8px #38e08a; }
        &.warn { background: #ffb454; box-shadow: 0 0 8px #ffb454; }
        &.mock { background: #4aa3ff; box-shadow: 0 0 8px #4aa3ff; }
      }
      .label { white-space: nowrap; }
      .switch {
        padding: 2px 10px;
        border: 1px solid #0d7a72;
        border-radius: 3px;
        background: rgba(13, 122, 114, 0.3);
        color: #7cfc9c;
        cursor: pointer;
        font-size: 12px;
        &:hover { background: rgba(13, 122, 114, 0.6); }
      }
    }
  }
  .content {
    .center {
      position: relative;
    }
    .sg-col {
      width: 380px;
      padding: 0 12px 12px;
      gap: 12px;
      overflow-y: auto;
      min-height: 0;
      &::-webkit-scrollbar { width: 0; }
    }
  }
}
</style>

<style lang="scss">
.sg .sg-panel {
  background: rgba(6, 39, 33, 0.85);
  border: 1px solid #0d7a72;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  .sg-panel-header {
    height: 40px;
    line-height: 40px;
    padding-left: 12px;
    color: #fff;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 2px;
    background: linear-gradient(90deg, rgba(13, 122, 114, 0.6), rgba(13, 122, 114, 0));
    border-bottom: 1px solid rgba(13, 122, 114, 0.5);
    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: #7cfc9c;
      margin-right: 8px;
      border-radius: 2px;
      vertical-align: -2px;
    }
  }
}

/* 植被一张图开关面板（地图底部居中） */
.tree-layer-panel {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  .tree-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #cdeee3;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
    input[type='checkbox'] {
      width: 14px;
      height: 14px;
      accent-color: #38e08a;
      cursor: pointer;
    }
  }
  .tree-hint {
    color: #8fbfa8;
    font-size: 11px;
  }
}

/* 苗木档案弹窗（teleport 到 body，需全局样式） */
.tree-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.tree-modal {
  width: 360px;
  background: rgba(6, 39, 33, 0.96);
  border: 1px solid #0d7a72;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  .tree-modal-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: linear-gradient(90deg, rgba(13, 122, 114, 0.6), rgba(13, 122, 114, 0));
    border-bottom: 1px solid rgba(13, 122, 114, 0.5);
    .t-code { color: #7cfc9c; font-family: monospace; font-size: 13px; }
    .t-name { color: #fff; font-size: 15px; font-weight: bold; flex: 1; }
    .t-ancient {
      font-size: 10px;
      padding: 1px 6px;
      border: 1px solid #b8860b;
      border-radius: 2px;
      color: #ffd666;
      background: rgba(255, 214, 102, 0.12);
    }
    .close {
      background: none;
      border: none;
      color: #8fbfa8;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      &:hover { color: #fff; }
    }
  }
  .tree-modal-body {
    padding: 10px 14px;
    .t-row {
      display: flex;
      padding: 4px 0;
      font-size: 13px;
      .k { width: 72px; color: #8fbfa8; flex-shrink: 0; }
      .v {
        color: #e8f5ee;
        &.latin { font-style: italic; color: #b7d8c8; }
      }
    }
  }
}

/* 巡检回放开关面板（地图底部，植被面板上方） */
.drone-layer-panel {
  position: absolute;
  bottom: 64px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  .drone-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #cdeee3;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
    input[type='checkbox'] {
      width: 14px;
      height: 14px;
      accent-color: #38e08a;
      cursor: pointer;
    }
  }
  .drone-mission {
    max-width: 260px;
    padding: 2px 6px;
    border: 1px solid #0d7a72;
    border-radius: 3px;
    background: rgba(4, 24, 20, 0.9);
    color: #cdeee3;
    font-size: 12px;
  }
  .drone-play {
    padding: 2px 10px;
    border: 1px solid #0d7a72;
    border-radius: 3px;
    background: rgba(13, 122, 114, 0.3);
    color: #7cfc9c;
    cursor: pointer;
    font-size: 12px;
    &:hover { background: rgba(13, 122, 114, 0.6); }
  }
  .drone-slider {
    width: 180px;
    accent-color: #38e08a;
    cursor: pointer;
  }
  .drone-clock {
    color: #8fbfa8;
    font-size: 11px;
    white-space: nowrap;
  }
}

/* 巡检照片弹窗（teleport 到 body，需全局样式） */
.drone-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.drone-modal {
  width: 420px;
  background: rgba(6, 39, 33, 0.96);
  border: 1px solid #0d7a72;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  .drone-modal-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: linear-gradient(90deg, rgba(13, 122, 114, 0.6), rgba(13, 122, 114, 0));
    border-bottom: 1px solid rgba(13, 122, 114, 0.5);
    .d-seq { color: #7cfc9c; font-size: 14px; font-weight: bold; }
    .d-time { color: #8fbfa8; font-size: 12px; flex: 1; }
    .d-priority {
      font-size: 10px;
      padding: 1px 6px;
      border: 1px solid #b8860b;
      border-radius: 2px;
      color: #ffd666;
      background: rgba(255, 214, 102, 0.12);
    }
    .close {
      background: none;
      border: none;
      color: #8fbfa8;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      &:hover { color: #fff; }
    }
  }
  .d-img {
    display: block;
    width: 100%;
    max-height: 260px;
    object-fit: contain;
    background: #04120e;
  }
  .drone-modal-body {
    padding: 10px 14px;
    .t-row {
      display: flex;
      padding: 4px 0;
      font-size: 13px;
      .k { width: 72px; color: #8fbfa8; flex-shrink: 0; }
      .v { color: #e8f5ee; }
    }
  }
}
</style>
