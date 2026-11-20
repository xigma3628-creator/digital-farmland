<script setup lang="ts">
// 十一期工人端主页：底部三 Tab（待办/已提交/我的）。
// 待办按 assigned/in_progress/verifying 分组，支持触摸下拉刷新；
// 已提交 Tab 从 events 里提取验收结果与退回原因。
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { apiJson, getUser } from '../api'
import type { WorkOrder, WorkOrderEvent } from '../api'
import MinePane from './MinePane.vue'

const active = ref<'todo' | 'submitted' | 'mine'>('todo')
const orders = ref<WorkOrder[]>([])
const loading = ref(false)
const user = getUser()

const STATUS_LABEL: Record<string, string> = {
  assigned: '待开始',
  in_progress: '处置中',
  verifying: '待验收',
  done: '已完成'
}
const TYPE_LABEL: Record<string, string> = {
  pest: '虫害',
  disease: '病害',
  growth: '长势',
  facility: '设施',
  other: '其他'
}
const PRIORITY_LABEL = ['低', '一般', '紧急']

async function load() {
  loading.value = true
  try {
    const data = await apiJson<{ orders: WorkOrder[] }>('/api/work-orders')
    orders.value = data.orders
  } catch (err: any) {
    ElMessage.error(err?.message || '工单加载失败')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const todoGroups = computed(() => [
  { key: 'assigned', title: '待开始', orders: orders.value.filter(o => o.status === 'assigned') },
  { key: 'in_progress', title: '处置中', orders: orders.value.filter(o => o.status === 'in_progress') },
  { key: 'verifying', title: '待验收', orders: orders.value.filter(o => o.status === 'verifying') }
])
const todoCount = computed(() => todoGroups.value.reduce((n, g) => n + g.orders.length, 0))

const submittedOrders = computed(() =>
  orders.value.filter(o => o.status === 'verifying' || o.status === 'done')
)

// 验收结果从 events 反查：最新一条 done 或“验收退回”事件
const verifyInfo = ref<Record<number, { state: string; note: string; returned: boolean }>>({})
const verifyLoading = ref(false)
async function loadVerifyInfo() {
  verifyLoading.value = true
  await Promise.all(
    submittedOrders.value.map(async o => {
      try {
        const data = await apiJson<{ events: WorkOrderEvent[] }>(`/api/work-orders/${o.id}/events`)
        const ev = [...data.events].reverse().find(e => e.toStatus === 'done' || (e.note || '').includes('验收退回'))
        if (!ev) {
          verifyInfo.value[o.id] = { state: '待验收', note: '', returned: false }
        } else if (ev.toStatus === 'done') {
          verifyInfo.value[o.id] = { state: '验收通过', note: ev.note || '', returned: false }
        } else {
          verifyInfo.value[o.id] = {
            state: '验收退回',
            note: (ev.note || '').replace(/^验收退回[:：]?/, ''),
            returned: true
          }
        }
      } catch {
        /* 单条失败不阻塞列表 */
      }
    })
  )
  verifyLoading.value = false
}
watch(
  active,
  v => {
    if (v === 'submitted') loadVerifyInfo()
  },
  { immediate: true }
)

// ---- 触摸下拉刷新（仅待办 Tab 滚动容器，无需第三方组件） ----
const listRef = ref<HTMLElement | null>(null)
const pullDistance = ref(0)
const refreshing = ref(false)
let touchStartY = 0
let pulling = false

function onTouchStart(e: TouchEvent) {
  const el = listRef.value
  if (!el || el.scrollTop > 0 || refreshing.value) return
  touchStartY = e.touches[0].clientY
  pulling = true
}
function onTouchMove(e: TouchEvent) {
  if (!pulling) return
  const dy = e.touches[0].clientY - touchStartY
  if (dy > 0) {
    // 阻尼系数 0.5，最多拉 70px，避免页面被整页拖走
    pullDistance.value = Math.min(dy * 0.5, 70)
    if (e.cancelable) e.preventDefault()
  } else {
    pullDistance.value = 0
  }
}
async function onTouchEnd() {
  if (!pulling) return
  pulling = false
  const dist = pullDistance.value
  pullDistance.value = 0
  if (dist >= 40) {
    refreshing.value = true
    try {
      await load()
      ElMessage.success('已刷新')
    } finally {
      refreshing.value = false
    }
  }
}

function openOrder(o: WorkOrder) {
  window.location.hash = `#/worker/order/${o.id}`
}
function fmtTime(ts?: string | null) {
  return ts ? ts.replace('T', ' ').slice(0, 16) : '-'
}
</script>

<template>
  <div class="home-page">
    <header class="home-header safe-top">
      <div class="home-title">智慧园林 · 工人端</div>
      <div class="home-user" @click="active = 'mine'">
        {{ user?.displayName || user?.username || '未登录' }}
      </div>
    </header>

    <div class="home-body">
      <!-- 待办 -->
      <div
        v-show="active === 'todo'"
        ref="listRef"
        class="scroll-pane"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="pull-indicator" :style="{ height: pullDistance + 'px' }">
          <span v-if="pullDistance > 0">{{ pullDistance >= 40 ? '松手刷新' : '下拉刷新' }}</span>
        </div>
        <div v-loading="loading || refreshing" class="pull-body">
          <div v-for="g in todoGroups" :key="g.key" class="group">
            <template v-if="g.orders.length">
              <div class="group-title">{{ g.title }}（{{ g.orders.length }}）</div>
              <div
                v-for="o in g.orders"
                :key="o.id"
                class="order-card"
                @click="openOrder(o)"
              >
                <div class="order-top">
                  <span class="order-title">{{ o.title }}</span>
                  <span class="status-tag" :class="'st-' + o.status">{{ STATUS_LABEL[o.status] || o.status }}</span>
                </div>
                <div class="order-meta">
                  <span>{{ TYPE_LABEL[o.orderType] || o.orderType }}</span>
                  <span>{{ o.zone }}</span>
                  <span>{{ PRIORITY_LABEL[o.priority] || '一般' }}</span>
                  <span v-if="o.dueDate">限期 {{ o.dueDate }}</span>
                </div>
                <div class="order-bottom">
                  <span>{{ o.orderNo }}</span>
                  <span>{{ fmtTime(o.updatedAt) }}</span>
                </div>
              </div>
            </template>
          </div>
          <el-empty v-if="!loading && todoCount === 0" description="暂无待办工单" />
          <div class="refresh-hint">下拉可刷新</div>
        </div>
      </div>

      <!-- 已提交 -->
      <div v-show="active === 'submitted'" class="scroll-pane">
        <div v-loading="verifyLoading" class="pull-body page-pad">
          <div
            v-for="o in submittedOrders"
            :key="o.id"
            class="order-card"
            @click="openOrder(o)"
          >
            <div class="order-top">
              <span class="order-title">{{ o.title }}</span>
              <span class="status-tag" :class="'st-' + o.status">{{ STATUS_LABEL[o.status] || o.status }}</span>
            </div>
            <div class="order-meta">
              <span>{{ o.orderNo }}</span>
              <span>{{ fmtTime(o.updatedAt) }}</span>
            </div>
            <div v-if="verifyInfo[o.id]" class="verify-line" :class="{ bad: verifyInfo[o.id].returned }">
              <template v-if="verifyInfo[o.id].returned">
                已退回：{{ verifyInfo[o.id].note || '请查看处置留痕' }}
              </template>
              <template v-else-if="o.status === 'done'">
                验收通过{{ verifyInfo[o.id].note ? '：' + verifyInfo[o.id].note : '' }}
              </template>
              <template v-else>已提交，等待管理员验收</template>
            </div>
          </div>
          <el-empty v-if="!verifyLoading && submittedOrders.length === 0" description="暂无已提交工单" />
        </div>
      </div>

      <!-- 我的 -->
      <div v-show="active === 'mine'" class="scroll-pane">
        <MinePane />
      </div>
    </div>

    <nav class="tab-bar safe-bottom">
      <button class="tab-item" :class="{ on: active === 'todo' }" @click="active = 'todo'">
        <span class="tab-icon">📋</span>待办<i v-if="todoCount" class="badge">{{ todoCount }}</i>
      </button>
      <button class="tab-item" :class="{ on: active === 'submitted' }" @click="active = 'submitted'">
        <span class="tab-icon">📮</span>已提交
      </button>
      <button class="tab-item" :class="{ on: active === 'mine' }" @click="active = 'mine'">
        <span class="tab-icon">👤</span>我的
      </button>
    </nav>
  </div>
</template>

<style scoped>
.home-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
  background: linear-gradient(135deg, #2f9e6e, #27875f);
  color: #fff;
}

.home-title {
  font-size: 17px;
  font-weight: 600;
}

.home-user {
  font-size: 13px;
  opacity: 0.92;
}

.home-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scroll-pane {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

.pull-indicator {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7d8b97;
  font-size: 12px;
  transition: height 0.15s ease-out;
}

.pull-body {
  min-height: 60vh;
}

.group-title {
  font-size: 13px;
  color: #7d8b97;
  padding: 10px 14px 4px;
}

.order-card {
  margin: 8px 14px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 2px 8px rgba(38, 50, 61, 0.05);
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.order-title {
  font-size: 15px;
  font-weight: 600;
  color: #26323d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  flex-shrink: 0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
  background: #909399;
}

.st-assigned {
  background: #e6a23c;
}

.st-in_progress {
  background: #409eff;
}

.st-verifying {
  background: #b88bf0;
}

.st-done {
  background: #67c23a;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #7d8b97;
}

.order-bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #a5b0ba;
}

.verify-line {
  margin-top: 8px;
  font-size: 12px;
  color: #1f7a55;
  background: #eef8f3;
  border-radius: 8px;
  padding: 6px 10px;
}

.verify-line.bad {
  color: #c45656;
  background: #fdf0f0;
}

.refresh-hint {
  text-align: center;
  color: #b7c0c9;
  font-size: 11px;
  padding: 8px 0 16px;
}

.tab-bar {
  display: flex;
  border-top: 1px solid #e7ecf0;
  background: #fff;
}

.tab-item {
  flex: 1;
  border: none;
  background: none;
  padding: 8px 0 2px;
  font-size: 12px;
  color: #8a97a3;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.tab-item.on {
  color: #1f7a55;
}

.tab-icon {
  font-size: 20px;
  line-height: 1;
}

.badge {
  position: absolute;
  top: 0;
  right: calc(50% - 22px);
  background: #f56c6c;
  color: #fff;
  border-radius: 9px;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  font-style: normal;
  padding: 0 4px;
}
</style>
