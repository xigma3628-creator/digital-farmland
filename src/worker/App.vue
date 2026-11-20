<script setup lang="ts">
// 十一期工人端根组件：手写 hash 路由（#/worker-login、#/worker、#/worker/order/:id），
// 不复用管理端 router，避免把大屏/管理端路由带进工人端产物。
import { computed, onMounted, onUnmounted, ref } from 'vue'
import WorkerLogin from './views/WorkerLogin.vue'
import WorkerHome from './views/WorkerHome.vue'
import OrderDetail from './views/OrderDetail.vue'
import { getToken } from './api'

const hash = ref(window.location.hash)
function onHashChange() {
  hash.value = window.location.hash
}
onMounted(() => window.addEventListener('hashchange', onHashChange))
onUnmounted(() => window.removeEventListener('hashchange', onHashChange))

const route = computed(() => {
  const h = hash.value.replace(/^#/, '')
  const m = /^\/worker\/order\/(\d+)$/.exec(h)
  if (m) return { name: 'detail' as const, id: Number(m[1]) }
  if (h === '/worker') return { name: 'home' as const, id: 0 }
  return { name: 'login' as const, id: 0 }
})

const showLogin = computed(() => route.value.name === 'login' || !getToken())
</script>

<template>
  <div class="worker-shell">
    <WorkerLogin v-if="showLogin" />
    <OrderDetail v-else-if="route.name === 'detail'" :order-id="route.id" />
    <WorkerHome v-else />
  </div>
</template>
