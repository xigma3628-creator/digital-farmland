<template>
  <div class="bigscreen fixed top-0 bottom-0 left-0 right-0 overflow-hidden flex flex-col">
    <div
      class="header px-6 h-20 flex-grow-0 flex-shrink-0 pointer-events-auto flex flex-row items-center justify-between"
    >
      <div class="title text-white font-bold text-2xl">数字农田</div>
    </div>
    <div class="bigscreen-body">
      <div class="bigscreen-left"></div>
      <div class="bigscreen-right"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import nowDate from '@/views/home/industries/carbon-neutral-bigscreen/components/now-date.vue'

export default defineComponent({
  name: 'bigscreen',
  components: { nowDate },
  props: {},
  setup(props, context) {
    // const store = useStore()
    // const router = useRouter()
    // const layoutControl = useLayoutControl()
    // onMounted(() => {
    //   layoutControl.hideAllLayout(store)
    // })
    //
    // const backToHome = (): void => {
    //   layoutControl.defaultLayout(store)
    //   router.push('/')
    // }
    //
    // const goToCarbonNeutralBigscreen = (): void => {
    //   layoutControl.hideAllLayout(store)
    //   router.push('/carbon-neutral-bigscreen')
    // }
    //
    // return { backToHome, goToCarbonNeutralBigscreen }
  }
})
</script>

<style lang="scss" scoped>
.bigscreen {


  &-header {
    z-index: 999;
    width: 100%;
    height: 70px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-image: url('static/imgs/echarts/header.png');
    background-size: contain;

    .title {
      margin-left: 20px;
    }

    .time {
      margin-right: 20px;
    }
  }

  &-body {
    width: 100%;
    flex: 1;
    // background-color: red;
    display: flex;
    justify-content: space-between;
    padding-top: 5px;
  }

  &-left {
    //z-index: 999;
    width: 30%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
  }
}
</style>
