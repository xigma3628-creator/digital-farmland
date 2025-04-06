<template>
  <div class="loading-page">
        <p>加载中。。。。</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'loading-page',
  props: {},
  setup(props, context) {
  }
})
</script>

<style lang="scss" scoped>
  .loading-page{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: black;
    color: white;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
