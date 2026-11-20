<template>
  <div class="overview-page">
    <div class="ov-kpis">
      <div class="ov-kpi" v-for="kpi in kpis" :key="kpi.key" @click="emit('navigate', kpi.target)">
        <div class="kpi-title">{{ kpi.title }}</div>
        <div class="kpi-value" :style="kpi.color ? { color: kpi.color } : {}">{{ kpi.value }}</div>
        <div class="kpi-sub">{{ kpi.sub }}</div>
      </div>
    </div>

    <div class="ov-charts">
      <div class="ov-card">
        <div class="ov-card-title">近 7 天运营趋势</div>
        <div ref="trendEl" class="ov-chart"></div>
        <div class="ov-caliber">口径：告警按 raised_at、识别/病害按 ai_results.ts，服务器本地日界分桶，含已恢复/已归档数据</div>
      </div>
      <div class="ov-card">
        <div class="ov-card-title">工单状态分布</div>
        <div ref="funnelEl" class="ov-chart"></div>
        <div class="ov-caliber">口径：全部工单按当前状态计数；超期 = due_date < 今日且状态 ≠ 已归档</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { apiJson } from '@/libs/manage/api'

const emit = defineEmits<{ (e: 'navigate', key: string): void }>()

const kpis = ref<{ key: string; target: string; title: string; value: string; sub: string; color?: string }[]>([])
const trendEl = ref<HTMLElement>()
const funnelEl = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let funnelChart: echarts.ECharts | null = null

const STATUS_ORDER = ['pending', 'assigned', 'in_progress', 'verifying', 'done', 'closed']
const STATUS_TEXT: Record<string, string> = {
  pending: '待派发', assigned: '已派发', in_progress: '处置中', verifying: '待验收', done: '已完成', closed: '已归档'
}
const TODO_STATUSES = ['pending', 'assigned', 'in_progress', 'verifying']

function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

async function loadKpis(): Promise<void> {
  const [health, alarms, aiStats, ordersRes, kb] = await Promise.all([
    apiJson<any>('/api/health'),
    apiJson<any>('/api/alarms?active=1'),
    apiJson<any>('/api/ai/stats'),
    apiJson<any>('/api/work-orders'),
    apiJson<any>('/api/kb/stats')
  ])

  const rate = health.devices ? Math.round((health.online / health.devices) * 100) : 0
  const activeAlarms = alarms.alarms || []
  const high = activeAlarms.filter((a: any) => a.level === 'high').length
  const mid = activeAlarms.filter((a: any) => a.level === 'mid').length

  const orders = ordersRes.orders || []
  const todo = orders.filter((o: any) => TODO_STATUSES.includes(o.status)).length
  const today = todayStr()
  const overdue = orders.filter((o: any) => o.status !== 'closed' && o.dueDate && o.dueDate < today).length

  kpis.value = [
    {
      key: 'health', target: 'devices', title: '设备在线率',
      value: `${rate}%`, sub: `在线 ${health.online} / 共 ${health.devices} 台`,
      color: rate >= 80 ? '#389e0d' : '#d46b08'
    },
    {
      key: 'alarms', target: 'alarms', title: '活跃告警',
      value: String(activeAlarms.length), sub: `高级 ${high} · 中级 ${mid}`,
      color: high > 0 ? '#cf1322' : '#123f36'
    },
    {
      key: 'ai', target: 'reports', title: '今日 AI 识别',
      value: String(aiStats.stats?.today ?? 0), sub: `病虫害 ${aiStats.stats?.pests ?? 0} 次 · 均值 ${aiStats.stats?.avgConfidence ?? 0}%`
    },
    {
      key: 'orders', target: 'orders', title: '待办工单',
      value: String(todo), sub: `超期 ${overdue} 单`,
      color: overdue > 0 ? '#d46b08' : '#123f36'
    },
    {
      key: 'kb', target: 'kb', title: '知识库条目',
      value: String(kb.total ?? 0), sub: `苗木 ${kb.tree ?? 0} · 病虫害 ${kb.pest ?? 0} · 标准 ${kb.maintenance_standard ?? 0}`
    }
  ]
}

async function loadTrend(): Promise<void> {
  const res = await apiJson<any>('/api/reports/overview?days=7')
  if (!trendEl.value) return
  trendChart = trendChart || echarts.init(trendEl.value)
  const days = res.days || []
  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['告警', 'AI 识别', '病虫害'], textStyle: { color: '#4d6b62', fontSize: 11 }, top: 0 },
    grid: { left: 36, right: 16, top: 32, bottom: 24 },
    xAxis: { type: 'category', data: days.map((d: any) => d.date.slice(5)), axisLabel: { color: '#4d6b62', fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#4d6b62', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(13,122,114,0.15)' } } },
    series: [
      { name: '告警', type: 'line', smooth: true, data: days.map((d: any) => d.alarmCount), lineStyle: { color: '#cf1322' }, itemStyle: { color: '#cf1322' } },
      { name: 'AI 识别', type: 'line', smooth: true, data: days.map((d: any) => d.aiCount), lineStyle: { color: '#0d7a72' }, itemStyle: { color: '#0d7a72' } },
      { name: '病虫害', type: 'line', smooth: true, data: days.map((d: any) => d.pestCount), lineStyle: { color: '#ffa940' }, itemStyle: { color: '#ffa940' } }
    ]
  }, true)
}

async function loadFunnel(): Promise<void> {
  const res = await apiJson<any>('/api/work-orders')
  const orders = res.orders || []
  if (!funnelEl.value) return
  funnelChart = funnelChart || echarts.init(funnelEl.value)
  funnelChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: STATUS_ORDER.map(s => STATUS_TEXT[s]), axisLabel: { color: '#4d6b62', fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#4d6b62', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(13,122,114,0.15)' } } },
    series: [{
      name: '工单数',
      type: 'bar',
      barMaxWidth: 40,
      data: STATUS_ORDER.map((s, i) => ({
        value: orders.filter((o: any) => o.status === s).length,
        itemStyle: { color: ['#d46b08', '#4aa3ff', '#0d7a72', '#b8860b', '#389e0d', '#8a8a8a'][i] }
      }))
    }]
  }, true)
}

const onResize = (): void => {
  trendChart?.resize()
  funnelChart?.resize()
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  try {
    await Promise.all([loadKpis(), loadTrend(), loadFunnel()])
  } catch (err: any) {
    ElMessage.error(err?.message || '总览数据加载失败')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  trendChart?.dispose()
  funnelChart?.dispose()
})
</script>

<style scoped lang="scss">
.overview-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ov-kpis {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  flex-shrink: 0;
}
.ov-kpi {
  background: #fff;
  border: 1px solid #e3ebe7;
  border-radius: 6px;
  padding: 14px 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  &:hover {
    border-color: #0d7a72;
    box-shadow: 0 2px 12px rgba(13, 122, 114, 0.15);
  }
  .kpi-title {
    font-size: 13px;
    color: #4d6b62;
  }
  .kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: #123f36;
    margin: 6px 0 2px;
  }
  .kpi-sub {
    font-size: 12px;
    color: #8aa39a;
  }
}
.ov-charts {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.ov-card {
  background: #fff;
  border: 1px solid #e3ebe7;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.ov-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #123f36;
  margin-bottom: 8px;
}
.ov-chart {
  flex: 1;
  min-height: 200px;
}
.ov-caliber {
  margin-top: 8px;
  font-size: 11px;
  color: #8aa39a;
}
</style>
