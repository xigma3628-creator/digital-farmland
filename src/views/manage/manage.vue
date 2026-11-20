<template>
  <div class="manage-shell">
    <aside class="manage-aside">
      <div class="manage-brand">
        <div class="brand-name">智慧园林</div>
        <div class="brand-sub">管理端</div>
      </div>
      <el-menu :default-active="active" class="manage-menu" @select="onSelect">
        <el-menu-item index="overview">运营总览</el-menu-item>
        <el-menu-item index="orders">工单管理</el-menu-item>
        <el-menu-item index="alarms">告警记录</el-menu-item>
        <el-menu-item index="devices">设备状态</el-menu-item>
        <el-menu-item index="kb">知识库</el-menu-item>
        <el-menu-item index="kb-qa">智能问答</el-menu-item>
        <el-menu-item index="reports">报表中心</el-menu-item>
      </el-menu>
    </aside>
    <div class="manage-main">
      <header class="manage-header">
        <div class="manage-crumb">{{ titleMap[active] }}</div>
        <div class="manage-user">
          <a class="bigscreen-link" href="#/smart-garden">查看大屏</a>
          <span class="user-name">{{ user?.displayName || '-' }}（{{ roleText[user?.role || 'viewer'] }}）</span>
          <el-button size="small" @click="onLogout">退出登录</el-button>
        </div>
      </header>
      <main v-if="authed" class="manage-content">
        <overview-page v-if="active === 'overview'" @navigate="onSelect" />
        <work-orders v-else-if="active === 'orders'" />
        <kb-page v-else-if="active === 'kb'" />
        <kb-qa-page v-else-if="active === 'kb-qa'" />
        <reports-page v-else-if="active === 'reports'" />

        <el-table v-else-if="active === 'alarms'" v-loading="alarmsLoading" :data="alarms" border stripe height="100%">
          <el-table-column prop="key" label="告警标识" width="180" />
          <el-table-column prop="level" label="级别" width="90" />
          <el-table-column prop="text" label="内容" min-width="320" show-overflow-tooltip />
          <el-table-column prop="raised_at" label="触发时间" width="200" />
          <el-table-column prop="cleared_at" label="恢复时间" width="200" />
        </el-table>

        <div v-else-if="active === 'devices'" class="devices-pane">
          <div class="devices-toolbar">
            <span class="devices-hint">共 {{ devices.length }} 台设备；新设备注册后即刻生效，传感器按 smart-garden/{type}/{id}/status 上报即可被摄取。</span>
            <el-button v-if="isAdmin" type="primary" size="small" @click="openDeviceCreate">新增设备</el-button>
          </div>
          <div class="devices-table-wrap">
            <el-table v-loading="devicesLoading" :data="devices" border stripe height="100%">
              <el-table-column prop="id" label="设备 ID" width="130" />
              <el-table-column prop="name" label="名称" min-width="200" />
              <el-table-column label="类型" width="100">
                <template #default="{ row }">{{ typeText[row.type] || row.type }}</template>
              </el-table-column>
              <el-table-column prop="zone" label="分区" width="130">
                <template #default="{ row }">{{ row.zone || '—' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'online' ? 'success' : 'info'" size="small">
                    {{ row.status === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastSeen" label="最后上报" width="200" />
              <el-table-column v-if="isAdmin" label="操作" width="130">
                <template #default="{ row }">
                  <el-button size="small" link type="primary" @click="openDeviceEdit(row)">编辑</el-button>
                  <el-button size="small" link type="danger" @click="removeDevice(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </main>
      <el-dialog v-model="deviceDialogVisible" :title="deviceEditing ? '编辑设备' : '新增设备'" width="480px">
        <el-form label-width="72px">
          <el-form-item label="设备 ID">
            <el-input v-model="deviceForm.id" :disabled="deviceEditing" placeholder="如 soil-07 / cam-06" />
            <div class="form-hint">命名：类型-序号；注册后 ID 与类型不可修改</div>
          </el-form-item>
          <el-form-item label="名称">
            <el-input v-model="deviceForm.name" maxlength="50" placeholder="如 农田东侧土壤传感器" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="deviceForm.type" :disabled="deviceEditing" style="width: 100%">
              <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="分区">
            <el-select v-model="deviceForm.zone" clearable style="width: 100%" placeholder="可选">
              <el-option v-for="z in zoneOptions" :key="z" :label="z" :value="z" />
            </el-select>
          </el-form-item>
          <el-form-item label="经纬度">
            <div class="lonlat-row">
              <el-input-number v-model="deviceForm.lon" :precision="6" :step="0.0001" controls-position="right" style="width: 150px" />
              <el-input-number v-model="deviceForm.lat" :precision="6" :step="0.0001" controls-position="right" style="width: 150px" />
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="deviceDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="deviceSaving" @click="saveDevice">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiJson, clearSession, getToken, getUser, type ManageUser } from '@/libs/manage/api'
import { CAMPUS_CENTER } from '@/libs/smart-garden/campus-data'
import WorkOrders from './work-orders.vue'
import KbPage from './kb.vue'
import KbQaPage from './kb-qa.vue'
import OverviewPage from './overview.vue'
import ReportsPage from './reports.vue'

type MenuKey = 'overview' | 'orders' | 'alarms' | 'devices' | 'kb' | 'kb-qa' | 'reports'

const router = useRouter()
const user = ref<ManageUser | null>(getUser())
const authed = ref(getToken() !== '')
const active = ref<MenuKey>('overview')

// 未登录时不渲染子页面，避免子页 onMounted 抢跑触发 401
if (!authed.value) router.replace('/manage-login')

const roleText: Record<string, string> = { admin: '管理员', worker: '工人', engineer: '工程师', viewer: '访客' }
const isAdmin = computed(() => user.value?.role === 'admin')
const typeText: Record<string, string> = { soil: '土壤', weather: '气象', water: '水质', irrigation: '灌溉', camera: '监控', insect: '虫情' }
const titleMap: Record<MenuKey, string> = {
  overview: '运营总览',
  orders: '工单管理',
  alarms: '告警记录',
  devices: '设备状态',
  kb: '知识库',
  'kb-qa': '智能问答',
  reports: '报表中心'
}

const alarms = ref<any[]>([])
const devices = ref<any[]>([])
const alarmsLoading = ref(false)
const devicesLoading = ref(false)

async function loadAlarms(): Promise<void> {
  alarmsLoading.value = true
  try {
    const res = await apiJson<{ alarms: any[] }>('/api/alarms')
    alarms.value = res.alarms || []
  } catch (err: any) {
    ElMessage.error(err?.message || '告警加载失败')
  } finally {
    alarmsLoading.value = false
  }
}

async function loadDevices(): Promise<void> {
  devicesLoading.value = true
  try {
    const res = await apiJson<{ devices: any[] }>('/api/devices')
    devices.value = res.devices || []
  } catch (err: any) {
    ElMessage.error(err?.message || '设备加载失败')
  } finally {
    devicesLoading.value = false
  }
}

// ---------- 十二期：设备动态注册 ----------
const typeOptions = [
  { value: 'soil', label: '土壤传感' },
  { value: 'weather', label: '气象站' },
  { value: 'water', label: '水质监测' },
  { value: 'irrigation', label: '灌溉阀' },
  { value: 'camera', label: '视频监控' },
  { value: 'insect', label: '虫情测报' }
]
const zoneOptions = ['教学科研区', '学生生活区', '图书信息区', '运动场馆区', '景观湖区', '校外农田区', '全园']
const deviceDialogVisible = ref(false)
const deviceEditing = ref(false)
const deviceSaving = ref(false)
const deviceForm = reactive({ id: '', name: '', type: 'soil', zone: '', lon: CAMPUS_CENTER.lon, lat: CAMPUS_CENTER.lat })

function openDeviceCreate(): void {
  deviceEditing.value = false
  Object.assign(deviceForm, { id: '', name: '', type: 'soil', zone: '', lon: CAMPUS_CENTER.lon, lat: CAMPUS_CENTER.lat })
  deviceDialogVisible.value = true
}

function openDeviceEdit(row: any): void {
  deviceEditing.value = true
  Object.assign(deviceForm, {
    id: row.id, name: row.name, type: row.type, zone: row.zone || '',
    lon: row.lon ?? CAMPUS_CENTER.lon, lat: row.lat ?? CAMPUS_CENTER.lat
  })
  deviceDialogVisible.value = true
}

async function saveDevice(): Promise<void> {
  if (!deviceForm.id.trim() || !deviceForm.name.trim()) {
    ElMessage.warning('请填写设备 ID 与名称')
    return
  }
  deviceSaving.value = true
  try {
    if (deviceEditing.value) {
      await apiJson(`/api/devices/${encodeURIComponent(deviceForm.id)}`, {
        method: 'PUT',
        body: { name: deviceForm.name, zone: deviceForm.zone, lon: deviceForm.lon, lat: deviceForm.lat }
      })
      ElMessage.success('设备已更新')
    } else {
      await apiJson('/api/devices', { method: 'POST', body: { ...deviceForm } })
      ElMessage.success('设备已注册，开始上报即会被摄取')
    }
    deviceDialogVisible.value = false
    loadDevices()
  } catch (err: any) {
    ElMessage.error(err?.message || '保存失败')
  } finally {
    deviceSaving.value = false
  }
}

async function removeDevice(row: any): Promise<void> {
  const extra = row.type === 'irrigation' ? '该设备是灌溉阀，删除后对应分区自动控制将失效。' : ''
  try {
    await ElMessageBox.confirm(`确定删除设备「${row.name}」（${row.id}）？${extra}历史数据保留。`, '删除设备', { type: 'warning' })
  } catch {
    return
  }
  try {
    await apiJson(`/api/devices/${encodeURIComponent(row.id)}`, { method: 'DELETE' })
    ElMessage.success('设备已删除')
    loadDevices()
  } catch (err: any) {
    ElMessage.error(err?.message || '删除失败')
  }
}

watch(active, value => {
  if (value === 'alarms') loadAlarms()
  if (value === 'devices') loadDevices()
})

onMounted(() => {
  if (!authed.value) return
  loadAlarms()
  loadDevices()
})

function onSelect(index: string): void {
  active.value = index as MenuKey
}

function onLogout(): void {
  clearSession()
  router.replace('/manage-login')
}
</script>

<style scoped>
.manage-shell {
  height: 100vh;
  display: flex;
  background: #f2f6f4;
}
.manage-aside {
  width: 210px;
  flex-shrink: 0;
  background: #0b3d35;
  display: flex;
  flex-direction: column;
}
.manage-brand {
  padding: 20px 16px;
  color: #d9f2ea;
  border-bottom: 1px solid rgba(124, 252, 156, 0.15);
}
.brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}
.brand-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #7fb3a6;
}
.manage-menu {
  border-right: none;
  background: transparent;
}
.manage-menu :deep(.el-menu-item) {
  color: #bcd9d0;
}
.manage-menu :deep(.el-menu-item.is-active),
.manage-menu :deep(.el-menu-item:hover) {
  color: #7cfc9c;
  background: rgba(124, 252, 156, 0.1);
}
.manage-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.manage-header {
  height: 56px;
  flex-shrink: 0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e3ebe7;
}
.manage-crumb {
  font-size: 16px;
  font-weight: 600;
  color: #123f36;
}
.manage-user {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #4d6b62;
}
.bigscreen-link {
  font-size: 13px;
  color: #0d4f45;
  text-decoration: none;
}
.bigscreen-link:hover {
  text-decoration: underline;
}
.manage-content {
  flex: 1;
  min-height: 0;
  padding: 16px;
}
.devices-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.devices-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.devices-hint {
  font-size: 12px;
  color: #7a8b87;
}
.devices-table-wrap {
  flex: 1;
  min-height: 0;
}
.form-hint {
  font-size: 12px;
  line-height: 18px;
  color: #98a8a3;
}
.lonlat-row {
  display: flex;
  gap: 8px;
}
</style>
