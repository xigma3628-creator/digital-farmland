<script setup lang="ts">
// 十一期工人端工单详情：字段 + 处置留痕时间线 + 状态操作。
// assigned → 「开始处置」；in_progress → 提交表单（处置说明必填、费用选填、拍照逐张上传收集 images）。
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiJson, uploadImage, resolveUrl } from '../api'
import { ApiError } from '../api'
import type { WorkOrder, WorkOrderEvent } from '../api'

const props = defineProps<{ orderId: number }>()

const order = ref<WorkOrder | null>(null)
const events = ref<WorkOrderEvent[]>([])
const loading = ref(false)

const STATUS_LABEL: Record<string, string> = {
  pending: '待派发',
  assigned: '待开始',
  in_progress: '处置中',
  verifying: '待验收',
  done: '已完成',
  closed: '已归档'
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
    order.value = data.orders.find(o => o.id === props.orderId) || null
    const ev = await apiJson<{ events: WorkOrderEvent[] }>(`/api/work-orders/${props.orderId}/events`)
    events.value = ev.events
  } catch (err: any) {
    ElMessage.error(err?.message || '工单加载失败')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ---- 开始处置 ----
const starting = ref(false)
async function startOrder() {
  starting.value = true
  try {
    await apiJson(`/api/work-orders/${props.orderId}/start`, { method: 'POST', body: {} })
    ElMessage.success('已开始处置')
    await load()
  } catch (err: any) {
    ElMessage.error(err?.message || '开始处置失败')
  } finally {
    starting.value = false
  }
}

// ---- 提交表单 ----
const resolution = ref('')
const cost = ref('')
const submitting = ref(false)
const photos = ref<{ url: string; name: string }[]>([])
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function pickFiles() {
  fileInputRef.value?.click()
}

async function onFilesPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return
  uploading.value = true
  try {
    for (const f of files) {
      const url = await uploadImage(f)
      photos.value.push({ url, name: f.name })
    }
    ElMessage.success(`已上传 ${files.length} 张照片`)
  } catch (err: any) {
    ElMessage.error(err instanceof ApiError ? err.message : '照片上传失败')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function removePhoto(idx: number) {
  photos.value.splice(idx, 1)
}

async function submitOrder() {
  if (!resolution.value.trim()) { ElMessage.warning('请填写处置说明'); return }
  if (submitting.value) return
  const costValue = cost.value === '' ? undefined : Number(cost.value)
  if (costValue !== undefined && (!Number.isFinite(costValue) || costValue < 0)) {
    ElMessage.warning('费用需为非负数字')
    return
  }
  submitting.value = true
  try {
    await apiJson(`/api/work-orders/${props.orderId}/submit`, {
      method: 'POST',
      body: {
        resolution: resolution.value.trim(),
        cost: costValue,
        images: photos.value.map(p => p.url)
      }
    })
    ElMessage.success('已提交，等待验收')
    resolution.value = ''
    cost.value = ''
    photos.value = []
    await load()
  } catch (err: any) {
    ElMessage.error(err?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function fmtTime(ts?: string | null) {
  return ts ? ts.replace('T', ' ').slice(0, 16) : '-'
}
function back() {
  window.location.hash = '#/worker'
}
const canStart = computed(() => order.value?.status === 'assigned')
const canSubmit = computed(() => order.value?.status === 'in_progress')
const historyImages = computed(() => (order.value?.images || []).map(resolveUrl))
</script>

<template>
  <div class="detail-page">
    <header class="detail-header safe-top">
      <button class="back-btn" @click="back">‹ 返回</button>
      <div class="detail-title">工单详情</div>
      <div class="header-space" />
    </header>

    <div v-loading="loading" class="detail-body">
      <template v-if="order">
        <div class="card">
          <div class="card-top">
            <span class="o-title">{{ order.title }}</span>
            <span class="status-tag" :class="'st-' + order.status">{{ STATUS_LABEL[order.status] || order.status }}</span>
          </div>
          <div class="rows">
            <div class="row"><span class="k">工单号</span><span>{{ order.orderNo }}</span></div>
            <div class="row"><span class="k">类型</span><span>{{ TYPE_LABEL[order.orderType] || order.orderType }}</span></div>
            <div class="row"><span class="k">优先级</span><span>{{ PRIORITY_LABEL[order.priority] || '一般' }}</span></div>
            <div class="row"><span class="k">区域</span><span>{{ order.zone }}</span></div>
            <div class="row"><span class="k">位置</span><span>{{ order.location || '-' }}</span></div>
            <div class="row"><span class="k">指派给</span><span>{{ order.assignee || '-' }}</span></div>
            <div class="row"><span class="k">限期</span><span>{{ order.dueDate || '-' }}</span></div>
            <div class="row"><span class="k">创建时间</span><span>{{ fmtTime(order.createdAt) }}</span></div>
          </div>
          <div v-if="order.description" class="desc">{{ order.description }}</div>
          <div v-if="historyImages.length" class="his-images">
            <div class="sub-title">已上传照片</div>
            <div class="thumbs">
              <img v-for="(img, i) in historyImages" :key="i" :src="img" class="thumb" alt="现场照片" />
            </div>
          </div>
        </div>

        <!-- 开始处置 -->
        <div v-if="canStart" class="card">
          <button class="btn primary" :disabled="starting" @click="startOrder">
            {{ starting ? '处理中…' : '开始处置' }}
          </button>
        </div>

        <!-- 提交表单 -->
        <div v-if="canSubmit" class="card">
          <div class="sub-title">提交处置结果</div>
          <div class="field">
            <label>处置说明 <i class="req">*</i></label>
            <textarea
              v-model="resolution"
              rows="3"
              maxlength="2000"
              placeholder="说明处置过程与结果（必填）"
            />
          </div>
          <div class="field">
            <label>费用（选填）</label>
            <input v-model="cost" type="number" inputmode="decimal" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>现场照片</label>
            <div class="thumbs">
              <div v-for="(p, i) in photos" :key="p.url" class="thumb-wrap">
                <img :src="resolveUrl(p.url)" class="thumb" alt="待提交照片" />
                <span class="thumb-del" @click="removePhoto(i)">×</span>
              </div>
              <button class="pick-btn" :disabled="uploading" @click="pickFiles">
                {{ uploading ? '上传中…' : '＋ 拍照/选图' }}
              </button>
            </div>
            <!-- capture 调起手机相机；accept 限制图片；multiple 允许一次多张；屏外定位而非 display:none，保留无障碍可达性 -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              aria-label="选择现场照片"
              style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0"
              @change="onFilesPicked"
            />
          </div>
          <button class="btn primary" :disabled="submitting || uploading" @click="submitOrder">
            {{ submitting ? '提交中…' : '提交验收' }}
          </button>
        </div>

        <div v-else-if="order.status === 'verifying'" class="card tip-card">
          已提交，等待管理员验收
        </div>
        <div v-else-if="order.status === 'done'" class="card tip-card ok">
          验收通过{{ order.resolution ? '：' + order.resolution : '' }}
        </div>

        <!-- 处置留痕 -->
        <div class="card">
          <div class="sub-title">处置留痕</div>
          <div class="timeline">
            <div v-for="ev in events" :key="ev.id" class="tl-item">
              <div class="tl-dot" />
              <div class="tl-body">
                <div class="tl-note">{{ ev.note }}</div>
                <div class="tl-meta">{{ ev.operator }} · {{ fmtTime(ev.ts) }}</div>
              </div>
            </div>
            <div v-if="!events.length" class="tl-empty">暂无记录</div>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="工单不存在或已被删除" />
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 10px;
  padding-right: 14px;
  padding-bottom: 10px;
  background: linear-gradient(135deg, #2f9e6e, #27875f);
  color: #fff;
}

.back-btn {
  border: none;
  background: none;
  color: #fff;
  font-size: 15px;
  padding: 4px 6px;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.header-space {
  width: 52px;
}

.detail-body {
  flex: 1;
  padding: 12px 14px calc(20px + env(safe-area-inset-bottom));
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(38, 50, 61, 0.05);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.o-title {
  font-size: 16px;
  font-weight: 600;
}

.status-tag {
  flex-shrink: 0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
  background: #909399;
}

.st-assigned { background: #e6a23c; }
.st-in_progress { background: #409eff; }
.st-verifying { background: #b88bf0; }
.st-done { background: #67c23a; }
.st-closed { background: #909399; }

.rows {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.row {
  display: flex;
  font-size: 13px;
}

.k {
  width: 72px;
  color: #8a97a3;
  flex-shrink: 0;
}

.desc {
  margin-top: 10px;
  font-size: 13px;
  color: #5c6b7a;
  background: #f6f8fa;
  border-radius: 8px;
  padding: 8px 10px;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.his-images {
  margin-top: 12px;
}

.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e7ecf0;
  background: #f4f6f8;
}

.thumb-wrap {
  position: relative;
}

.thumb-del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}

.pick-btn {
  width: 72px;
  height: 72px;
  border: 1px dashed #b9c6d1;
  border-radius: 8px;
  background: #fafbfc;
  color: #7d8b97;
  font-size: 12px;
}

.pick-btn:disabled {
  opacity: 0.6;
}

.field {
  margin-bottom: 12px;
}

.field label {
  display: block;
  font-size: 12px;
  color: #7d8b97;
  margin-bottom: 4px;
}

.req {
  color: #f56c6c;
  font-style: normal;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #dfe6ec;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  background: #fafbfc;
  font-family: inherit;
  resize: none;
}

.field input:focus,
.field textarea:focus {
  border-color: #2f9e6e;
  background: #fff;
}

.btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 9px;
  font-size: 15px;
}

.btn.primary {
  background: #2f9e6e;
  color: #fff;
}

.btn.primary:disabled {
  opacity: 0.6;
}

.tip-card {
  text-align: center;
  color: #8a6d1f;
  background: #fdf6e7;
}

.tip-card.ok {
  color: #1f7a55;
  background: #eef8f3;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tl-item {
  display: flex;
  gap: 10px;
}

.tl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2f9e6e;
  margin-top: 5px;
  flex-shrink: 0;
}

.tl-note {
  font-size: 13px;
  color: #26323d;
}

.tl-meta {
  font-size: 11px;
  color: #a5b0ba;
  margin-top: 2px;
}

.tl-empty {
  font-size: 12px;
  color: #a5b0ba;
}
</style>
