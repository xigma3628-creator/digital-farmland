<template>
  <div class="bs-energy-consumption-per-person">
    <div class="bs-energy-consumption-per-person-header">
      <img src="/static/imgs/中心.png">
      <div class="bs-energy-consumption-per-person-header-text">农田汇总5</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'bs-energy-consumption-per-person',
})
</script>
<style scoped lang="scss">
.bs-energy-consumption-per-person{
  width: 100%;
  height: 100%;
  ////background-image: url("/static/imgs/echarts/u5.svg");
  //background-repeat: no-repeat;
  //background-size: cover;
  background-color: rgba(150, 150, 150, 0.1) !important;
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
