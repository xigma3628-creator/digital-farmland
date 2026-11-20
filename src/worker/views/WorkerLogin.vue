<script setup lang="ts">
// 十一期工人端登录页：复用 /api/auth/login，但仅 role==='worker' 放行；
// 其他角色（admin/engineer/viewer）提示后停留在本页。
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { loginWorker, getToken } from '../api'
import { ApiError } from '../api'

const form = reactive({ username: '', password: '' })
const loading = ref(false)

onMounted(() => {
  // 已登录直接进主页
  if (getToken()) window.location.hash = '#/worker'
})

async function submit() {
  if (!form.username.trim() || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await loginWorker(form.username.trim(), form.password)
    window.location.hash = '#/worker'
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page safe-top">
    <div class="login-hero">
      <div class="login-logo">🌿</div>
      <h1 class="login-title">智慧园林 · 工人端</h1>
      <p class="login-sub">智慧园林 · 现场养护作业</p>
    </div>

    <div class="login-card">
      <div class="field">
        <label>账号</label>
        <input v-model="form.username" type="text" placeholder="请输入工人账号" autocomplete="username" />
      </div>
      <div class="field">
        <label>密码</label>
        <input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
          @keyup.enter="submit"
        />
      </div>
      <button class="login-btn" :disabled="loading" @click="submit">
        {{ loading ? '登录中…' : '登 录' }}
      </button>
      <p class="login-tip">仅限工人账号登录，管理账号请使用管理端</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: 24px;
  padding-right: 24px;
}

.login-hero {
  text-align: center;
  margin-top: 8vh;
}

.login-logo {
  font-size: 52px;
  line-height: 1;
}

.login-title {
  margin: 14px 0 6px;
  font-size: 22px;
  color: #1f7a55;
}

.login-sub {
  margin: 0;
  font-size: 12px;
  color: #8a97a3;
}

.login-card {
  margin-top: 6vh;
  background: #fff;
  border-radius: 14px;
  padding: 22px 18px;
  box-shadow: 0 6px 18px rgba(31, 122, 85, 0.08);
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 13px;
  color: #5c6b7a;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  height: 44px;
  border: 1px solid #dfe6ec;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
  outline: none;
  background: #fafbfc;
}

.field input:focus {
  border-color: #2f9e6e;
  background: #fff;
}

.login-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: #2f9e6e;
  color: #fff;
  font-size: 16px;
  letter-spacing: 6px;
  margin-top: 4px;
}

.login-btn:disabled {
  opacity: 0.6;
}

.login-tip {
  text-align: center;
  color: #9aa7b2;
  font-size: 12px;
  margin: 14px 0 0;
}
</style>
