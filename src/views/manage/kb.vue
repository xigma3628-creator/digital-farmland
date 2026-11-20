<template>
  <div class="kb-page">
    <div class="kb-toolbar">
      <el-tabs v-model="categoryKey" class="kb-tabs" @tab-change="onCategoryChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="苗木" name="tree" />
        <el-tab-pane label="病虫害" name="pest" />
        <el-tab-pane label="养护标准" name="maintenance_standard" />
      </el-tabs>
      <div class="kb-search">
        <el-input
          v-model="keyword"
          class="kb-search-input"
          placeholder="输入植物名、病虫害或养护关键词"
          clearable
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-button type="primary" @click="onSearch">搜索</el-button>
      </div>
    </div>

    <div class="kb-table-wrap">
      <el-table v-loading="loading" :data="items" border stripe height="100%" @row-click="openDetail">
        <el-table-column prop="name" label="名称" width="170" />
        <el-table-column label="分类" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="tagType(row.category)">{{ categoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="latin" label="学名" width="230" show-overflow-tooltip />
        <el-table-column prop="summary" label="简介" min-width="360" show-overflow-tooltip />
        <el-table-column prop="id" label="编号" width="130" />
      </el-table>
    </div>

    <div class="kb-footer">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>

    <el-drawer v-model="drawerOpen" size="620px" :title="detailTitle">
      <div v-if="detailLoading" class="kb-detail-loading">
        <el-skeleton :rows="8" animated />
      </div>
      <div v-else-if="detail" class="kb-detail">
        <div class="kb-detail-head">
          <el-tag :type="tagType(detail.category)" size="small">{{ categoryLabel(detail.category) }}</el-tag>
          <span class="kb-detail-id">{{ detail.id }}</span>
        </div>

        <el-descriptions v-if="detail.category === 'tree'" :column="1" border size="small">
          <el-descriptions-item label="学名">{{ detail.latin || '-' }}</el-descriptions-item>
          <el-descriptions-item label="科 / 属">
            {{ [detail.family, detail.genus].filter(Boolean).join(' / ') || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="叶">{{ detail.morphology?.leaf || '-' }}</el-descriptions-item>
          <el-descriptions-item label="花">{{ detail.morphology?.flower || '-' }}</el-descriptions-item>
          <el-descriptions-item label="果">{{ detail.morphology?.fruit || '-' }}</el-descriptions-item>
          <el-descriptions-item label="树皮">{{ detail.morphology?.bark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="生长习性">{{ detail.growth_habit || '-' }}</el-descriptions-item>
          <el-descriptions-item label="适宜环境">{{ detail.suitable_environment || '-' }}</el-descriptions-item>
          <el-descriptions-item label="常见病虫害">{{ pestNamesText }}</el-descriptions-item>
          <el-descriptions-item label="修剪周期">{{ detail.maintenance?.pruning_cycle || '-' }}</el-descriptions-item>
          <el-descriptions-item label="施肥">{{ detail.maintenance?.fertilization || '-' }}</el-descriptions-item>
          <el-descriptions-item label="浇水">{{ detail.maintenance?.watering || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions v-else-if="detail.category === 'pest'" :column="1" border size="small">
          <el-descriptions-item label="学名">{{ detail.scientific_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detail.type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="寄主植物">{{ detail.host_species || '-' }}</el-descriptions-item>
          <el-descriptions-item label="识别特征">{{ detail.identification || '-' }}</el-descriptions-item>
          <el-descriptions-item label="症状">{{ detail.symptoms || '-' }}</el-descriptions-item>
          <el-descriptions-item label="物理防治">{{ detail.control?.physical || '-' }}</el-descriptions-item>
          <el-descriptions-item label="化学防治">{{ detail.control?.chemical || '-' }}</el-descriptions-item>
          <el-descriptions-item label="生物防治">{{ detail.control?.biological || '-' }}</el-descriptions-item>
          <el-descriptions-item label="推荐药剂">{{ detail.recommended_pesticide || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions v-else :column="1" border size="small">
          <el-descriptions-item label="适用树种">{{ detail.applicable_species || '-' }}</el-descriptions-item>
          <el-descriptions-item label="修剪周期">{{ detail.pruning_cycle || '-' }}</el-descriptions-item>
          <el-descriptions-item label="修剪方法">{{ detail.pruning_method || '-' }}</el-descriptions-item>
          <el-descriptions-item label="施肥计划">{{ detail.fertilization_schedule || '-' }}</el-descriptions-item>
          <el-descriptions-item label="浇水频率">{{ detail.watering_frequency || '-' }}</el-descriptions-item>
          <el-descriptions-item label="防寒措施">{{ detail.winter_protection || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="kb-source">来源：参考项目 smart-garden-ai knowledge-base（garden_kb.json）</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiJson } from '@/libs/manage/api'

interface KbItem {
  id: string
  category: string
  name: string
  latin: string
  summary: string
}

interface KbDetail {
  id: string
  category: string
  name: string
  latin?: string
  [key: string]: any
}

type CategoryKey = 'all' | 'tree' | 'pest' | 'maintenance_standard'

const CATEGORY_TEXT: Record<string, string> = { tree: '苗木', pest: '病虫害', maintenance_standard: '养护标准' }

const categoryKey = ref<CategoryKey>('all')
const keyword = ref('')
const items = ref<KbItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)

const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<KbDetail | null>(null)

const detailTitle = computed(() => detail.value?.name || '条目详情')
const pestNamesText = computed(() => {
  const names = detail.value?.common_pest_names
  if (Array.isArray(names) && names.length) return names.join('、')
  const ids = detail.value?.common_pests
  return Array.isArray(ids) && ids.length ? ids.join('、') : '-'
})

function categoryLabel(category: string): string {
  return CATEGORY_TEXT[category] || category
}

function tagType(category: string): 'success' | 'warning' | 'info' {
  if (category === 'tree') return 'success'
  if (category === 'pest') return 'warning'
  return 'info'
}

async function loadEntries(): Promise<void> {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (categoryKey.value !== 'all') params.set('category', categoryKey.value)
    const q = keyword.value.trim()
    if (q) params.set('q', q)
    params.set('limit', String(pageSize))
    params.set('offset', String((page.value - 1) * pageSize))
    const res = await apiJson<{ total: number; items: KbItem[] }>(`/api/kb/entries?${params.toString()}`)
    items.value = res.items || []
    total.value = res.total || 0
  } catch (err: any) {
    ElMessage.error(err?.message || '知识库加载失败')
  } finally {
    loading.value = false
  }
}

function onCategoryChange(): void {
  page.value = 1
  loadEntries()
}

function onSearch(): void {
  page.value = 1
  loadEntries()
}

function onPageChange(value: number): void {
  page.value = value
  loadEntries()
}

async function openDetail(row: KbItem): Promise<void> {
  drawerOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await apiJson<{ entry: KbDetail }>(`/api/kb/entries/${encodeURIComponent(row.id)}`)
    detail.value = res.entry
  } catch (err: any) {
    ElMessage.error(err?.message || '条目详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

onMounted(loadEntries)
</script>

<style scoped>
.kb-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kb-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  background: #fff;
  border-radius: 8px;
}

.kb-tabs {
  flex: 1;
  min-width: 0;
}

.kb-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.kb-search {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.kb-search-input {
  width: 300px;
}

.kb-table-wrap {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-sizing: border-box;
}

.kb-table-wrap :deep(.el-table__row) {
  cursor: pointer;
}

.kb-footer {
  display: flex;
  justify-content: flex-end;
}

.kb-detail-loading {
  padding: 8px;
}

.kb-detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.kb-detail-id {
  color: #8a9a94;
  font-size: 12px;
}

.kb-source {
  margin-top: 16px;
  color: #8a9a94;
  font-size: 12px;
}
</style>
