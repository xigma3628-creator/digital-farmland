bs-energy-composition
<template>
  <div class="bs-energy-composition">
    <div class="bs-energy-composition-header">
      <img src="/static/imgs/图像.png">
      <div class="bs-energy-composition-header-text">农田汇总3</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'bs-energy-composition',
})
</script>
<style scoped lang="scss">
.bs-energy-composition{
  width: 100%;
  height: 100%;
  ////background-image: url("/static/imgs/echarts/u5.svg");
  //background-repeat: no-repeat;
  //background-size: cover;
  //background-color: rgba(48, 48, 48, 0.75) !important;
  background-color: #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #0d7a72;
  color: #fff;
  &-header{
    height: 50px;
    background-image: url("/static/imgs/echarts/u7.svg");
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    align-items: center;
    padding-left: 10px;
    img{
      width: 25px;
      margin-right: 5px;
    }
    line-height: 50px;
    font-size: 20px;
  }
}
</style>
