<template>
  <div class="bs-overview">
      <div class="bs-overview-header">
        <img src="/static/imgs/多功能.png">
        <div class="bs-overview-header-text">农田概况</div>
      </div>
      <div class="bs-overview-main">
          <div class="bs-overview-item">
              <div class="bs-overview-icon">
<!--                #8bc34a-->
                <img src="/static/imgs/农田.png" />
              </div>
              <div class="bs-overview-right">
                <div class="bs-overview-value">
                  <span>152.2</span>
                  <span class="bs-overview-unit">公顷</span>
                </div>
                <div class="bs-overview-label">农田面积</div>
              </div>
          </div>
        <div class="bs-overview-item">
          <div class="bs-overview-icon">
            <img src="/static/imgs/拖拉机.png"/>
          </div>
          <div class="bs-overview-right">
            <div class="bs-overview-value">
              <span>95.7</span>
              <span class="bs-overview-unit">%</span>
            </div>
            <div class="bs-overview-label">农机覆盖率</div>
          </div>
        </div>
        <div class="bs-overview-item">
          <div class="bs-overview-icon">
            <img src="/static/imgs/灌溉计划.png"/>
          </div>
          <div class="bs-overview-right">
            <div class="bs-overview-value">
              <span>148.1</span>
              <span class="bs-overview-unit">公顷</span>
            </div>
            <div class="bs-overview-label">灌溉面积</div>
          </div>
        </div>
        <div class="bs-overview-item">
          <div class="bs-overview-icon">
            <img src="/static/imgs/绿化.png"/>
          </div>
          <div class="bs-overview-right">
            <div class="bs-overview-value">
              <span>3.1</span>
              <span class="bs-overview-unit">级</span>
            </div>
            <div class="bs-overview-label">耕地质量等级</div>
          </div>
        </div>
        <div class="bs-overview-item">
          <div class="bs-overview-icon">
            <img src="/static/imgs/有机质.png"/>
          </div>
          <div class="bs-overview-right">
            <div class="bs-overview-value">
              <span>28</span>
              <span class="bs-overview-unit">g/kg</span>
            </div>
            <div class="bs-overview-label">土壤有机质含量</div>
          </div>
        </div>
        <div class="bs-overview-item">
          <div class="bs-overview-icon">
            <img src="/static/imgs/农民.png"/>
          </div>
          <div class="bs-overview-right">
            <div class="bs-overview-value">
              <span>91.4</span>
              <span class="bs-overview-unit">%</span>
            </div>
            <div class="bs-overview-label">农田复种率</div>
          </div>
        </div>
      </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted } from 'vue'

export default defineComponent({
  name: 'bs-overview',
})
</script>
<style scoped lang="scss">
  .bs-overview{
    width: 100%;
    height: 100%;
    ////background-image: url("/static/imgs/echarts/u5.svg");
    //background-repeat: no-repeat;
    //background-size: cover;
    //background-color: rgba(150, 150, 150, 0.1) !important;
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
    &-main{
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr;
      grid-row-gap: 24px;
      grid-column-gap: 24px;
      padding: 12px;
    }
    &-item{
      display: flex;
      align-items: center;
    }
    &-icon{
      width: 26px;
      height: 26px;
      margin-right: 10px;
    }

    &-right{
      display: flex;
      flex-direction: column;
    }
    &-label{
      font-size: 14px;
    }
    &-value{
      font-size: 24px;
      //color: #8bc34a;
      font-weight: bold;

      /* 基础渐变样式 */
      background: linear-gradient(45deg, #1ABC9C, #8BC34A);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
    &-unit{
      color: #fff;
      font-size: 12px;
      margin-left: 10px;
      font-weight: normal;
    }
  }
</style>
