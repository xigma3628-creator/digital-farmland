<script setup lang="ts">
// 十一期工人端“我的”页：账号信息、修改密码、退出登录
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiJson, getUser, clearSession } from '../api'

const user = getUser()
const form = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const changing = ref(false)

async function changePassword() {
  if (!form.oldPassword) { ElMessage.warning('请输入原密码'); return }
  if (form.newPassword.length < 6) { ElMessage.warning('新密码至少 6 位'); return }
  if (form.newPassword !== form.confirm) { ElMessage.warning('两次输入的新密码不一致'); return }
  changing.value = true
  try {
    await apiJson('/api/auth/change-password', {
      method: 'POST',
      body: { oldPassword: form.oldPassword, newPassword: form.newPassword }
    })
    ElMessage.success('密码修改成功')
    form.oldPassword = ''
    form.newPassword = ''
    form.confirm = ''
  } catch (err: any) {
    ElMessage.error(err?.message || '密码修改失败')
  } finally {
    changing.value = false
  }
}

function logout() {
  clearSession()
  window.location.hash = '#/worker-login'
}
</script>

<template>
  <div class="mine-page page-pad">
    <div class="user-card">
      <div class="avatar">{{ (user?.displayName || user?.username || '?').slice(0, 1) }}</div>
      <div>
        <div class="uname">{{ user?.displayName || '-' }}</div>
        <div class="uaccount">{{ user?.username || '-' }} · 工人</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">修改密码</div>
      <div class="field">
        <label>原密码</label>
        <input v-model="form.oldPassword" type="password" placeholder="请输入原密码" autocomplete="current-password" />
      </div>
      <div class="field">
        <label>新密码</label>
        <input v-model="form.newPassword" type="password" placeholder="至少 6 位" autocomplete="new-password" />
      </div>
      <div class="field">
        <label>确认新密码</label>
        <input v-model="form.confirm" type="password" placeholder="再次输入新密码" autocomplete="new-password" />
      </div>
      <button class="btn primary" :disabled="changing" @click="changePassword">
        {{ changing ? '保存中…' : '保存新密码' }}
      </button>
    </div>

    <button class="btn danger" @click="logout">退出登录</button>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 14px;
  box-shadow: 0 2px 8px rgba(38, 50, 61, 0.05);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #2f9e6e;
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uname {
  font-size: 16px;
  font-weight: 600;
}

.uaccount {
  font-size: 12px;
  color: #8a97a3;
  margin-top: 2px;
}

.panel {
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 14px;
  box-shadow: 0 2px 8px rgba(38, 50, 61, 0.05);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
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

.field input {
  width: 100%;
  height: 40px;
  border: 1px solid #dfe6ec;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 14px;
  outline: none;
  background: #fafbfc;
}

.field input:focus {
  border-color: #2f9e6e;
  background: #fff;
}

.btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 9px;
  font-size: 15px;
  margin-top: 4px;
}

.btn.primary {
  background: #2f9e6e;
  color: #fff;
}

.btn.primary:disabled {
  opacity: 0.6;
}

.btn.danger {
  margin-top: 16px;
  background: #fff;
  color: #c45656;
  border: 1px solid #f3c7c7;
}
</style>
