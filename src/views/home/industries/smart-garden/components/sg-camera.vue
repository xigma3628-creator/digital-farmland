<template>
  <div class="sg-panel sg-camera">
    <div class="sg-panel-header">
      视频监控
      <span class="cam-hint">{{ cameraOnlineCount }}/{{ cameraDevices.length }} 在线</span>
    </div>
    <div class="cam-body">
      <div class="cam-item" v-for="cam in cameraDevices" :key="cam.id" :class="cam.status">
        <span class="dot"></span>
        <div class="cam-info">
          <div class="cam-name">{{ cam.name }}</div>
          <div class="cam-meta">
            <span>{{ streamLabel(cam.id) }}</span>
            <span>{{ streamCfg(cam.id)?.resolution }}</span>
            <span>{{ streamCfg(cam.id)?.fps }}fps</span>
          </div>
        </div>
        <button class="mini" :disabled="cam.status !== 'online'" @click="openCamera(cam.id)">
          {{ cam.status === 'online' ? '预览' : '离线' }}
        </button>
      </div>
    </div>

    <teleport to="body">
      <div class="cam-modal-mask" v-if="activeCamera" @click.self="onMaskClick">
        <div class="cam-modal">
          <div class="cam-modal-head">
            <span class="live-dot" :class="{ off: activeCamera.status !== 'online' }"></span>
            <span class="cam-title">{{ activeCamera.name }}</span>
            <span class="cam-time">{{ clock }}</span>
            <button class="close" @click="closeCamera">×</button>
          </div>
          <div class="cam-screen">
            <video
              v-if="activeCamera.status === 'online'"
              :key="activeCamera.id"
              class="player"
              :src="activeStreamUrl"
              autoplay
              muted
              loop
              playsinline
            ></video>
            <div v-else class="player-offline">
              <div class="off-icon">⚠</div>
              <div>摄像头离线，无法取流</div>
              <div class="off-sub">请检查设备供电与网络后重试</div>
            </div>
            <div class="screen-tag">
              <span class="rec">● LIVE</span>
              <span>{{ streamLabel(activeCamera.id) }}</span>
              <span>{{ activeCamera.id.toUpperCase() }}</span>
            </div>
          </div>
          <div class="cam-ctrl">
            <div class="ptz-pad">
              <button class="ptz up" @click="adjustPtz(activeCamera.id, 0, 5, 0)" title="俯仰上抬">↑</button>
              <button class="ptz left" @click="adjustPtz(activeCamera.id, -15, 0, 0)" title="方位左转">←</button>
              <button class="ptz center" @click="resetPtz(activeCamera.id)" title="云台复位">◎</button>
              <button class="ptz right" @click="adjustPtz(activeCamera.id, 15, 0, 0)" title="方位右转">→</button>
              <button class="ptz down" @click="adjustPtz(activeCamera.id, 0, -5, 0)" title="俯仰下压">↓</button>
            </div>
            <div class="ptz-zoom">
              <button class="ptz" @click="adjustPtz(activeCamera.id, 0, 0, -0.5)">−</button>
              <span class="zoom-val">{{ ptzZoom }}x</span>
              <button class="ptz" @click="adjustPtz(activeCamera.id, 0, 0, 0.5)">＋</button>
            </div>
            <div class="ptz-readout">
              <div>方位 {{ ptz?.pan.toFixed(0) }}°</div>
              <div>俯仰 {{ ptz?.tilt.toFixed(0) }}°</div>
              <div>变倍 {{ ptz?.zoom }}x</div>
            </div>
          </div>
          <div class="cam-foot">
            码流 {{ streamCfg(activeCamera.id)?.resolution }}@{{ streamCfg(activeCamera.id)?.fps }}fps ·
            演示环境为本地 MP4 循环流，生产环境经 GB28181/WebRTC 由流媒体服务器取流
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue'
import {
  cameraDevices, cameraOnlineCount, streamCfg, streamLabel,
  activeCamera, activeStreamUrl, openCamera, closeCamera, maskClickShouldClose,
  adjustPtz, resetPtz, ptzState
} from '@/libs/smart-garden/camera'

export default defineComponent({
  name: 'sg-camera',
  setup() {
    const ptz = computed(() => (activeCamera.value ? ptzState[activeCamera.value.id] : null))
    const ptzZoom = computed(() => (ptz.value ? ptz.value.zoom : 1))
    const onMaskClick = (): void => {
      if (maskClickShouldClose()) closeCamera()
    }

    let clockTimer: ReturnType<typeof setInterval> | null = null
    const clock = ref('')
    const tickClock = (): void => {
      const d = new Date()
      const p = (n: number): string => String(n).padStart(2, '0')
      clock.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    }

    onMounted(() => {
      tickClock()
      clockTimer = setInterval(tickClock, 1000)
    })
    onUnmounted(() => {
      if (clockTimer !== null) clearInterval(clockTimer)
    })

    return {
      cameraDevices, cameraOnlineCount, streamCfg, streamLabel,
      activeCamera, activeStreamUrl, openCamera, closeCamera, onMaskClick,
      adjustPtz, resetPtz, ptz, ptzZoom, clock
    }
  }
})
</script>

<style scoped lang="scss">
.sg-camera {
  height: 218px;
  display: flex;
  flex-direction: column;
  .cam-hint {
    float: right;
    margin-right: 12px;
    font-size: 12px;
    font-weight: normal;
    color: #9fd8b4;
  }
  .cam-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px 10px;
    .cam-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 8px;
      margin-bottom: 5px;
      font-size: 12px;
      background: rgba(13, 122, 114, 0.12);
      border-left: 2px solid #0d7a72;
      &.offline {
        border-left-color: #ff4d4f;
        opacity: 0.75;
        .dot { background: #ff4d4f; }
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #38e08a;
        box-shadow: 0 0 6px #38e08a;
        flex-shrink: 0;
      }
      .cam-info { flex: 1; min-width: 0; }
      .cam-name { color: #d9f7e8; font-weight: bold; }
      .cam-meta {
        display: flex;
        gap: 8px;
        color: #8fbfa8;
        font-size: 11px;
        margin-top: 1px;
      }
      .mini {
        padding: 2px 10px;
        font-size: 11px;
        border: 1px solid #0d7a72;
        border-radius: 2px;
        background: rgba(13, 122, 114, 0.3);
        color: #7cfc9c;
        cursor: pointer;
        flex-shrink: 0;
        &:hover:not(:disabled) { background: rgba(13, 122, 114, 0.6); }
        &:disabled { color: #ff8f8f; border-color: #7a3230; cursor: not-allowed; }
      }
    }
  }
}

.cam-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 10, 8, 0.72);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  .cam-modal {
    width: 760px;
    max-width: 92vw;
    background: rgba(4, 24, 20, 0.96);
    border: 1px solid #0d7a72;
    border-radius: 6px;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.6), 0 0 18px rgba(50, 205, 50, 0.25);
    overflow: hidden;
    .cam-modal-head {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 44px;
      padding: 0 14px;
      border-bottom: 1px solid rgba(13, 122, 114, 0.5);
      .live-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #ff4d4f;
        box-shadow: 0 0 8px #ff4d4f;
        animation: cam-blink 1.2s infinite;
        &.off { background: #8a8a8a; box-shadow: none; animation: none; }
      }
      .cam-title { color: #fff; font-weight: bold; font-size: 15px; flex: 1; }
      .cam-time { color: #7cfc9c; font-family: monospace; font-size: 14px; }
      .close {
        width: 28px;
        height: 28px;
        border: 1px solid #0d7a72;
        border-radius: 3px;
        background: rgba(13, 122, 114, 0.3);
        color: #cdeee3;
        font-size: 16px;
        cursor: pointer;
        &:hover { background: rgba(13, 122, 114, 0.6); }
      }
    }
    .cam-screen {
      position: relative;
      background: #000;
      .player {
        display: block;
        width: 100%;
        height: 400px;
        object-fit: cover;
      }
      .player-offline {
        height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #b7d8c8;
        font-size: 15px;
        .off-icon { font-size: 42px; color: #ffb454; }
        .off-sub { font-size: 12px; color: #7ba28f; }
      }
      .screen-tag {
        position: absolute;
        left: 10px;
        bottom: 10px;
        display: flex;
        gap: 10px;
        padding: 3px 10px;
        background: rgba(0, 0, 0, 0.55);
        border-radius: 3px;
        color: #cdeee3;
        font-size: 12px;
        font-family: monospace;
        .rec { color: #ff4d4f; }
      }
    }
    .cam-ctrl {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 10px 14px;
      border-top: 1px solid rgba(13, 122, 114, 0.5);
      .ptz-pad {
        display: grid;
        grid-template-columns: repeat(3, 34px);
        grid-template-rows: repeat(3, 30px);
        gap: 4px;
        .ptz {
          border: 1px solid #0d7a72;
          border-radius: 3px;
          background: rgba(13, 122, 114, 0.3);
          color: #7cfc9c;
          cursor: pointer;
          font-size: 14px;
          &:hover { background: rgba(13, 122, 114, 0.6); }
        }
        .up { grid-column: 2; grid-row: 1; }
        .left { grid-column: 1; grid-row: 2; }
        .center { grid-column: 2; grid-row: 2; }
        .right { grid-column: 3; grid-row: 2; }
        .down { grid-column: 2; grid-row: 3; }
      }
      .ptz-zoom {
        display: flex;
        align-items: center;
        gap: 8px;
        .ptz {
          width: 34px;
          height: 30px;
          border: 1px solid #0d7a72;
          border-radius: 3px;
          background: rgba(13, 122, 114, 0.3);
          color: #7cfc9c;
          cursor: pointer;
          font-size: 15px;
          &:hover { background: rgba(13, 122, 114, 0.6); }
        }
        .zoom-val { color: #87e8de; font-family: monospace; min-width: 34px; text-align: center; }
      }
      .ptz-readout {
        margin-left: auto;
        display: flex;
        gap: 14px;
        color: #8fbfa8;
        font-size: 12px;
        font-family: monospace;
      }
    }
    .cam-foot {
      padding: 7px 14px;
      color: #6f9c88;
      font-size: 11px;
      border-top: 1px solid rgba(13, 122, 114, 0.3);
    }
  }
}
@keyframes cam-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
</style>
