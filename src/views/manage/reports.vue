<template>
  <div class="reports-page">
    <div class="rp-toolbar">
      <el-date-picker
        v-model="range"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        :clearable="false"
        @change="loadAll"
      />
      <el-select v-model="groupBy" style="width: 120px" @change="loadTrends">
        <el-option label="按日" value="day" />
        <el-option label="按周" value="week" />
        <el-option label="按月" value="month" />
      </el-select>
      <el-button :loading="loading" @click="loadAll">刷新</el-button>
    </div>

    <div class="rp-cards">
      <div class="rp-card">
        <div class="rp-card-title">病虫害识别趋势</div>
        <div v-show="hasTrends" ref="trendEl" class="rp-chart"></div>
        <el-empty v-if="!hasTrends && !loading" description="该时间窗内无病虫害识别记录" :image-size="80" />
        <div class="rp-caliber">{{ trendsCaliber }}</div>
      </div>

      <div class="rp-card">
        <div class="rp-card-title">
          养护成本
          <span class="rp-extra">合计 ¥{{ costs?.totalCost ?? 0 }} · 灌溉水量 {{ costs?.irrigationWater?.totalLiters ?? 0 }} L（单列）</span>
        </div>
        <div v-show="hasCosts" ref="costEl" class="rp-chart"></div>
        <el-empty v-if="!hasCosts && !loading" description="该时间窗内无成本记录" :image-size="80" />
        <div class="rp-water" v-if="costs?.irrigationWater?.byZone?.length">
          <span v-for="z in costs.irrigationWater.byZone" :key="z.zoneId" class="water-item">{{ z.zoneName }} {{ z.liters }}L</span>
        </div>
        <div class="rp-caliber">{{ costsCaliber }}</div>
      </div>

      <div class="rp-card">
        <div class="rp-card-title">
          识别覆盖
          <span class="rp-extra">{{ coverage?.withRecords ?? 0 }}/{{ coverage?.onlineTotal ?? 0 }} 在线摄像头有记录 · 覆盖率 {{ coverage?.rate ?? 0 }}%</span>
        </div>
        <div v-show="hasCoverage" ref="coverEl" class="rp-chart"></div>
        <el-empty v-if="!hasCoverage && !loading" description="该时间窗内无识别记录" :image-size="80" />
        <div class="rp-caliber">{{ coverageCaliber }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { apiJson } from '@/libs/manage/api'

const zoneColors = ['#38e08a', '#36cfc9', '#ffa940', '#7cfc9c', '#4aa3ff', '#ff7875']

const range = ref<[string, string]>(defaultRange())
const groupBy = ref<'day' | 'week' | 'month'>('day')
const loading = ref(false)

const trends = ref<any>(null)
const costs = ref<any>(null)
const coverage = ref<any>(null)

const trendEl = ref<HTMLElement>()
const costEl = ref<HTMLElement>()
const coverEl = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let costChart: echarts.ECharts | null = null
let coverChart: echarts.ECharts | null = null

const hasTrends = computed(() => (trends.value?.buckets || []).some((b: any) => b.count > 0))
const hasCosts = computed(() => (costs.value?.rows || []).length > 0)
const hasCoverage = computed(() => (coverage.value?.cameras || []).some((c: any) => c.count > 0))

const trendsCaliber = computed(() => {
  const c = trends.value?.caliber
  return c ? `口径：${c.source}；按 ${c.timeField} ${c.bucketBy === 'day' ? '按日' : c.bucketBy === 'week' ? '按周（周一为起点）' : '按月'}分桶（${c.timeZone}）；窗口 ${c.window.start} ~ ${c.window.end}（含End）` : ''
})
const costsCaliber = computed(() => {
  const c = costs.value?.caliber
  return c ? `口径：${c.costSource}；窗口 ${c.window.start} ~ ${c.window.end}（含End）` : ''
})
const coverageCaliber = computed(() => {
  const c = coverage.value?.caliber
  return c ? `口径：${c.numerator}；${c.denominator}；窗口 ${c.window.start} ~ ${c.window.end}（含End）` : ''
})

function defaultRange(): [string, string] {
  const p = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  const end = new Date()
  const start = new Date(Date.now() - 29 * 86400_000)
  return [fmt(start), fmt(end)]
}

async function loadTrends(): Promise<void> {
  const [start, end] = range.value || []
  if (!start || !end) return
  const res = await apiJson<any>(`/api/reports/pest-trends?start=${start}&end=${end}&groupBy=${groupBy.value}`)
  trends.value = res
  await nextTick()
  renderTrends()
}

async function loadCosts(): Promise<void> {
  const [start, end] = range.value || []
  if (!start || !end) return
  costs.value = await apiJson<any>(`/api/reports/costs?start=${start}&end=${end}`)
  await nextTick()
  renderCosts()
}

async function loadCoverage(): Promise<void> {
  const [start, end] = range.value || []
  if (!start || !end) return
  coverage.value = await apiJson<any>(`/api/reports/coverage?start=${start}&end=${end}`)
  await nextTick()
  renderCoverage()
}

async function loadAll(): Promise<void> {
  loading.value = true
  try {
    await Promise.all([loadTrends(), loadCosts(), loadCoverage()])
  } catch (err: any) {
    ElMessage.error(err?.message || '报表加载失败')
  } finally {
    loading.value = false
  }
}

function renderTrends(): void {
  if (!trendEl.value) return
  trendChart = trendChart || echarts.init(trendEl.value)
  const buckets = trends.value?.buckets || []
  // 取窗口内累计次数最多的 3 个标签作为细分线，避免图例过长
  const labelTotals = new Map<string, number>()
  for (const b of buckets) for (const [label, n] of Object.entries(b.byLabel || {})) labelTotals.set(label, (labelTotals.get(label) || 0) + (n as number))
  const topLabels = [...labelTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l)
  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['合计', ...topLabels], textStyle: { color: '#4d6b62', fontSize: 11 }, top: 0 },
    grid: { left: 40, right: 16, top: 32, bottom: 24 },
    xAxis: { type: 'category', data: buckets.map((b: any) => b.bucket), axisLabel: { color: '#4d6b62', fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#4d6b62', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(13,122,114,0.15)' } } },
    series: [
      { name: '合计', type: 'line', smooth: true, data: buckets.map((b: any) => b.count), lineStyle: { color: '#0d7a72', width: 3 }, itemStyle: { color: '#0d7a72' } },
      ...topLabels.map((label, i) => ({
        name: label,
        type: 'line',
        smooth: true,
        data: buckets.map((b: any) => b.byLabel?.[label] || 0),
        lineStyle: { color: zoneColors[i + 1], type: 'dashed' },
        itemStyle: { color: zoneColors[i + 1] }
      }))
    ]
  }, true)
}

function renderCosts(): void {
  if (!costEl.value) return
  costChart = costChart || echarts.init(costEl.value)
  const months = [...new Set((costs.value?.rows || []).map((r: any) => r.month))].sort()
  const zones = [...new Set((costs.value?.rows || []).map((r: any) => r.zone))]
  costChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: zones, textStyle: { color: '#4d6b62', fontSize: 11 }, top: 0 },
    grid: { left: 48, right: 16, top: 32, bottom: 24 },
    xAxis: { type: 'category', data: months, axisLabel: { color: '#4d6b62', fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: '#4d6b62', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(13,122,114,0.15)' } } },
    series: zones.map((zone, i) => ({
      name: zone,
      type: 'bar',
      stack: 'cost',
      barMaxWidth: 36,
      data: months.map(m => {
        const row = (costs.value?.rows || []).find((r: any) => r.zone === zone && r.month === m)
        return row ? row.cost : 0
      }),
      itemStyle: { color: zoneColors[i % zoneColors.length] }
    }))
  }, true)
}

function renderCoverage(): void {
  if (!coverEl.value) return
  coverChart = coverChart || echarts.init(coverEl.value)
  const cameras = coverage.value?.cameras || []
  coverChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: cameras.map((c: any) => c.cameraId), axisLabel: { color: '#4d6b62', fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#4d6b62', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(13,122,114,0.15)' } } },
    series: [{
      name: '识别次数',
      type: 'bar',
      barMaxWidth: 36,
      data: cameras.map((c: any) => ({
        value: c.count,
        itemStyle: { color: c.count > 0 ? (c.online ? '#38e08a' : '#ffa940') : '#c0c4cc' }
      }))
    }]
  }, true)
}

const onResize = (): void => {
  trendChart?.resize()
  costChart?.resize()
  coverChart?.resize()
}

onMounted(() => {
  loadAll()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  trendChart?.dispose()
  costChart?.dispose()
  coverChart?.dispose()
})
</script>

<style scoped lang="scss">
.reports-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rp-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}
.rp-cards {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.rp-card {
  background: #fff;
  border: 1px solid #e3ebe7;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.rp-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #123f36;
  margin-bottom: 8px;
  .rp-extra {
    float: right;
    font-size: 12px;
    font-weight: normal;
    color: #4d6b62;
  }
}
.rp-chart {
  flex: 1;
  min-height: 200px;
}
.rp-water {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  .water-item {
    font-size: 11px;
    color: #0d7a72;
    background: rgba(13, 122, 114, 0.08);
    border: 1px solid rgba(13, 122, 114, 0.25);
    border-radius: 3px;
    padding: 1px 6px;
  }
}
.rp-caliber {
  margin-top: 8px;
  font-size: 11px;
  color: #8aa39a;
  line-height: 1.5;
}
</style>
