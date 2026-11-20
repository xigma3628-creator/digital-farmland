<template>
  <div class="wo-page">
    <div class="wo-toolbar">
      <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 150px" @change="loadOrders">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select v-model="filters.zone" placeholder="全部分区" clearable style="width: 160px" @change="loadOrders">
        <el-option v-for="zone in zoneOptions" :key="zone" :label="zone" :value="zone" />
      </el-select>
      <el-button :loading="loading" @click="loadOrders">刷新</el-button>
      <div class="wo-spacer"></div>
      <el-button v-if="canCreate" type="primary" @click="openCreate">新建工单</el-button>
    </div>

    <div class="wo-table-wrap">
      <el-table v-loading="loading" :data="orders" border stripe height="100%" @row-click="openDetail">
        <el-table-column prop="orderNo" label="单号" width="160" />
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ typeText[row.orderType] || row.orderType }}</template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="priorityTag[row.priority] || 'info'" size="small">{{ priorityText[row.priority] || row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status] || 'info'" size="small">{{ statusText[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="zone" label="分区" width="120" />
        <el-table-column prop="assignee" label="处理人" width="110" />
        <el-table-column prop="dueDate" label="截止日期" width="120" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerOpen" size="560px" :title="detail ? `工单详情 · ${detail.orderNo}` : '工单详情'">
      <div v-if="detail" class="wo-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="标题" :span="2">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ typeText[detail.orderType] || detail.orderType }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ priorityText[detail.priority] || detail.priority }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag[detail.status] || 'info'" size="small">{{ statusText[detail.status] || detail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分区">{{ detail.zone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="位置" :span="2">{{ detail.location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上报人">{{ detail.reporter || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ detail.assignee || '-' }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ detail.dueDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源告警">{{ detail.sourceAlarm || '-' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.resolution" label="处置结果" :span="2">{{ detail.resolution }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.cost !== null && detail.cost !== undefined" label="处置费用" :span="2">￥{{ detail.cost }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.images && detail.images.length" class="wo-images">
          <div class="wo-section-title">现场图片</div>
          <div class="wo-image-list">
            <a
              v-for="(img, idx) in detail.images"
              :key="idx"
              class="wo-image-thumb"
              :href="resolveImg(img)"
              target="_blank"
              rel="noopener"
              :title="img"
            >
              <img :src="resolveImg(img)" alt="现场图片" loading="lazy" />
            </a>
          </div>
        </div>

        <div class="wo-events">
          <div class="wo-section-title">处置留痕</div>
          <el-timeline v-loading="eventsLoading">
            <el-timeline-item
              v-for="ev in events"
              :key="ev.id"
              :timestamp="fmtTime(ev.ts)"
              :type="eventTag[ev.toStatus] || 'primary'"
            >
              <div class="wo-event-head">{{ statusText[ev.toStatus] || ev.toStatus }} · {{ ev.operator }}</div>
              <div v-if="ev.note" class="wo-event-note">{{ ev.note }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="wo-actions">
          <el-button v-if="canDispatch" type="primary" @click="openDispatch">派发工单</el-button>
          <el-button v-if="canStart" type="primary" :loading="acting" @click="doStart">开始处置</el-button>
          <el-button v-if="canSubmit" type="primary" @click="openSubmit">提交处置</el-button>
          <el-button v-if="canVerify" type="success" @click="openVerify">验收</el-button>
          <el-button v-if="canClose" type="info" :loading="acting" @click="doClose">归档关闭</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="createVisible" title="新建工单" width="520px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="createForm.title" maxlength="120" placeholder="如：中心绿地发现蚜虫" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="createForm.orderType" style="width: 100%">
            <el-option v-for="(text, value) in typeText" :key="value" :label="text" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="createForm.priority" style="width: 100%">
            <el-option label="低" :value="0" />
            <el-option label="中" :value="1" />
            <el-option label="高" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="分区">
          <el-select v-model="createForm.zone" style="width: 100%">
            <el-option v-for="zone in zoneOptions" :key="zone" :label="zone" :value="zone" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="createForm.location" maxlength="200" placeholder="具体点位描述" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" maxlength="2000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="doCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dispatchVisible" title="派发工单" width="460px">
      <el-form :model="dispatchForm" label-width="80px">
        <el-form-item label="处理人" required>
          <el-input v-model="dispatchForm.assignee" placeholder="工人账号，如 worker1" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="dispatchForm.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dispatchForm.note" type="textarea" :rows="2" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="doDispatch">派发</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="submitVisible" title="提交处置结果" width="480px">
      <el-form :model="submitForm" label-width="80px">
        <el-form-item label="处置结果" required>
          <el-input v-model="submitForm.resolution" type="textarea" :rows="3" maxlength="2000" placeholder="说明处置过程与结果" />
        </el-form-item>
        <el-form-item label="费用">
          <el-input-number v-model="submitForm.cost" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="图片">
          <el-input v-model="submitForm.imagesText" type="textarea" :rows="2" placeholder="每行一个图片 URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="doSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyVisible" title="验收工单" width="460px">
      <el-form :model="verifyForm" label-width="80px">
        <el-form-item label="验收结果">
          <el-radio-group v-model="verifyForm.pass">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">退回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!verifyForm.pass" label="退回原因" required>
          <el-input v-model="verifyForm.reason" type="textarea" :rows="2" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="doVerify">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CAMPUS_ZONES } from '@/libs/smart-garden/campus-data'
import {
  apiJson,
  getUser,
  type WorkOrder,
  type WorkOrderEvent
} from '@/libs/manage/api'

type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

const user = getUser()
const role = computed(() => user?.role || 'viewer')
const canCreate = computed(() => role.value === 'admin' || role.value === 'engineer')

const statusOptions = [
  { value: 'pending', label: '待派发' },
  { value: 'assigned', label: '已派发' },
  { value: 'in_progress', label: '处置中' },
  { value: 'verifying', label: '待验收' },
  { value: 'done', label: '已完成' },
  { value: 'closed', label: '已归档' }
]
const statusText: Record<string, string> = Object.fromEntries(statusOptions.map(o => [o.value, o.label]))
const statusTag: Record<string, TagType> = {
  pending: 'warning',
  assigned: 'primary',
  in_progress: 'primary',
  verifying: 'warning',
  done: 'success',
  closed: 'info'
}
const typeText: Record<string, string> = {
  pest: '病虫害',
  disease: '病害',
  growth: '长势',
  facility: '设施',
  other: '其他'
}
const priorityText: Record<number, string> = { 0: '低', 1: '中', 2: '高' }
const priorityTag: Record<number, TagType> = { 0: 'info', 1: 'warning', 2: 'danger' }
const eventTag: Record<string, TagType> = {
  pending: 'warning',
  assigned: 'primary',
  in_progress: 'primary',
  verifying: 'warning',
  done: 'success',
  closed: 'info'
}
const zoneOptions = ['全园', ...CAMPUS_ZONES.map(z => z.name)]

const filters = reactive({ status: '', zone: '' })
const orders = ref<WorkOrder[]>([])
const loading = ref(false)
const acting = ref(false)

const drawerOpen = ref(false)
const detail = ref<WorkOrder | null>(null)
const events = ref<WorkOrderEvent[]>([])
const eventsLoading = ref(false)

const createVisible = ref(false)
const createForm = reactive({ title: '', orderType: 'pest', priority: 1, zone: '全园', location: '', description: '' })

const dispatchVisible = ref(false)
const dispatchForm = reactive({ assignee: 'worker1', dueDate: '', note: '' })

const submitVisible = ref(false)
const submitForm = reactive({ resolution: '', cost: undefined as number | undefined, imagesText: '' })

const verifyVisible = ref(false)
const verifyForm = reactive({ pass: true, reason: '' })

const canDispatch = computed(() => detail.value?.status === 'pending' && (role.value === 'admin' || role.value === 'engineer'))
const canStart = computed(() => detail.value?.status === 'assigned' && role.value === 'worker' && detail.value.assignee === user?.username)
const canSubmit = computed(() => detail.value?.status === 'in_progress' && role.value === 'worker' && detail.value.assignee === user?.username)
const canVerify = computed(() => detail.value?.status === 'verifying' && role.value === 'admin')
const canClose = computed(() => detail.value?.status === 'done' && role.value === 'admin')

// 工单 images 里存的是 /api/uploads 相对路径，缩略图/原图都要拼成后端绝对地址
function resolveImg(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  const base = (import.meta.env as any).VITE_API_BASE || 'http://localhost:3100'
  return url.startsWith('/') ? base + url : `${base}/${url}`
}

function fmtTime(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

async function loadOrders(): Promise<void> {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.zone) params.set('zone', filters.zone)
    const qs = params.toString()
    const res = await apiJson<{ orders: WorkOrder[] }>(`/api/work-orders${qs ? '?' + qs : ''}`)
    orders.value = res.orders || []
  } catch (err: any) {
    ElMessage.error(err?.message || '工单加载失败')
  } finally {
    loading.value = false
  }
}

async function loadEvents(orderId: number): Promise<void> {
  eventsLoading.value = true
  try {
    const res = await apiJson<{ events: WorkOrderEvent[] }>(`/api/work-orders/${orderId}/events`)
    events.value = res.events || []
  } catch (err: any) {
    ElMessage.error(err?.message || '留痕加载失败')
  } finally {
    eventsLoading.value = false
  }
}

function openDetail(row: WorkOrder): void {
  detail.value = { ...row }
  drawerOpen.value = true
  loadEvents(row.id)
}

async function refreshAfterAction(): Promise<void> {
  const id = detail.value?.id
  await loadOrders()
  if (id) {
    const fresh = orders.value.find(o => o.id === id)
    if (fresh) detail.value = { ...fresh }
    await loadEvents(id)
  }
}

function openCreate(): void {
  createForm.title = ''
  createForm.orderType = 'pest'
  createForm.priority = 1
  createForm.zone = '全园'
  createForm.location = ''
  createForm.description = ''
  createVisible.value = true
}

async function doCreate(): Promise<void> {
  if (!createForm.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  acting.value = true
  try {
    await apiJson('/api/work-orders', {
      method: 'POST',
      body: {
        title: createForm.title.trim(),
        description: createForm.description,
        orderType: createForm.orderType,
        priority: createForm.priority,
        zone: createForm.zone,
        location: createForm.location
      }
    })
    ElMessage.success('工单已创建')
    createVisible.value = false
    await loadOrders()
  } catch (err: any) {
    ElMessage.error(err?.message || '创建失败')
  } finally {
    acting.value = false
  }
}

function openDispatch(): void {
  dispatchForm.assignee = 'worker1'
  dispatchForm.dueDate = ''
  dispatchForm.note = ''
  dispatchVisible.value = true
}

async function doDispatch(): Promise<void> {
  if (!detail.value) return
  if (!dispatchForm.assignee.trim()) {
    ElMessage.warning('请填写处理人账号')
    return
  }
  acting.value = true
  try {
    await apiJson(`/api/work-orders/${detail.value.id}/dispatch`, {
      method: 'POST',
      body: {
        assignee: dispatchForm.assignee.trim(),
        dueDate: dispatchForm.dueDate || undefined,
        note: dispatchForm.note || undefined
      }
    })
    ElMessage.success('已派发')
    dispatchVisible.value = false
    await refreshAfterAction()
  } catch (err: any) {
    ElMessage.error(err?.message || '派发失败')
  } finally {
    acting.value = false
  }
}

async function doStart(): Promise<void> {
  if (!detail.value) return
  acting.value = true
  try {
    await apiJson(`/api/work-orders/${detail.value.id}/start`, { method: 'POST' })
    ElMessage.success('已开始处置')
    await refreshAfterAction()
  } catch (err: any) {
    ElMessage.error(err?.message || '操作失败')
  } finally {
    acting.value = false
  }
}

function openSubmit(): void {
  submitForm.resolution = ''
  submitForm.cost = undefined
  submitForm.imagesText = ''
  submitVisible.value = true
}

async function doSubmit(): Promise<void> {
  if (!detail.value) return
  if (!submitForm.resolution.trim()) {
    ElMessage.warning('请填写处置结果')
    return
  }
  const images = submitForm.imagesText.split('\n').map(s => s.trim()).filter(Boolean)
  acting.value = true
  try {
    await apiJson(`/api/work-orders/${detail.value.id}/submit`, {
      method: 'POST',
      body: {
        resolution: submitForm.resolution.trim(),
        cost: submitForm.cost,
        images
      }
    })
    ElMessage.success('已提交，等待验收')
    submitVisible.value = false
    await refreshAfterAction()
  } catch (err: any) {
    ElMessage.error(err?.message || '提交失败')
  } finally {
    acting.value = false
  }
}

function openVerify(): void {
  verifyForm.pass = true
  verifyForm.reason = ''
  verifyVisible.value = true
}

async function doVerify(): Promise<void> {
  if (!detail.value) return
  if (!verifyForm.pass && !verifyForm.reason.trim()) {
    ElMessage.warning('退回必须填写原因')
    return
  }
  acting.value = true
  try {
    await apiJson(`/api/work-orders/${detail.value.id}/verify`, {
      method: 'POST',
      body: { pass: verifyForm.pass, reason: verifyForm.reason || undefined }
    })
    ElMessage.success(verifyForm.pass ? '验收通过' : '已退回')
    verifyVisible.value = false
    await refreshAfterAction()
  } catch (err: any) {
    ElMessage.error(err?.message || '验收失败')
  } finally {
    acting.value = false
  }
}

async function doClose(): Promise<void> {
  if (!detail.value) return
  try {
    await ElMessageBox.confirm(`确认归档工单 ${detail.value.orderNo}？`, '归档确认', { type: 'warning' })
  } catch {
    return
  }
  acting.value = true
  try {
    await apiJson(`/api/work-orders/${detail.value.id}/close`, { method: 'POST' })
    ElMessage.success('已归档')
    await refreshAfterAction()
  } catch (err: any) {
    ElMessage.error(err?.message || '归档失败')
  } finally {
    acting.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.wo-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wo-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}
.wo-spacer {
  flex: 1;
}
.wo-table-wrap {
  flex: 1;
  min-height: 0;
}
.wo-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.wo-section-title {
  font-weight: 600;
  color: #123f36;
  margin-bottom: 8px;
}
.wo-event-head {
  font-size: 13px;
  color: #123f36;
  font-weight: 500;
}
.wo-event-note {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7f79;
}
.wo-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wo-image-thumb {
  display: block;
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e3ebe7;
  background: #f4f7f5;
}
.wo-image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.wo-actions {
  display: flex;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #e3ebe7;
}
</style>
