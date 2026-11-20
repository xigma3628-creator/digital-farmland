<template>
  <div class="manage-login">
    <el-card class="login-card" shadow="always">
      <template #header>
        <div class="login-head">
          <div>
            <div class="login-title">智慧园林 · 管理端</div>
            <div class="login-sub">管理端登录</div>
          </div>
          <a class="login-back" href="#/smart-garden">← 返回大屏</a>
        </div>
      </template>
      <el-form :model="form" label-width="56px" @submit.prevent="submit">
        <el-form-item label="账号">
          <el-input v-model="form.username" autocomplete="username" placeholder="请输入账号" @keyup.enter="submit" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password autocomplete="current-password" placeholder="请输入密码" @keyup.enter="submit" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="submit">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-hint">
        <div>演示账号：admin / admin123（管理员）</div>
        <div>worker1 / worker123（工人） · engineer1 / engineer123（工程师）</div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getToken, login } from '@/libs/manage/api'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

onMounted(() => {
  if (getToken()) router.replace('/manage')
})

async function submit(): Promise<void> {
  if (!form.username.trim() || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const user = await login(form.username.trim(), form.password)
    ElMessage.success(`欢迎，${user.displayName}`)
    router.replace('/manage')
  } catch (err: any) {
    ElMessage.error(err?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.manage-login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #04241c 0%, #0d4f45 100%);
}
.login-card {
  width: 420px;
  border-radius: 8px;
}
.login-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.login-back {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 20px;
  color: #0d4f45;
  text-decoration: none;
}
.login-back:hover {
  text-decoration: underline;
}
.login-title {
  font-size: 18px;
  font-weight: 700;
  color: #0d4f45;
  letter-spacing: 1px;
}
.login-sub {
  margin-top: 6px;
  font-size: 13px;
  color: #7a8b87;
}
.login-btn {
  width: 100%;
}
.login-hint {
  font-size: 12px;
  line-height: 20px;
  color: #8a9a96;
  border-top: 1px dashed #dbe6e2;
  padding-top: 10px;
}
</style>
