<template>
  <div class="now-date">
    <div class="time item">{{ time }}</div>
    <div class="week item">{{ date.week }}</div>
    <div class="date item">{{ dateAndWeek}}</div>
    <div class="weather item">
      <img :src="weather.iconUrl"/>
      <span>{{weather.name}}</span>
    </div>
    <div class="air-quality item">
      空气良
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useStore } from '@/store'
import { WeatherType } from '@/share/weather-type.enum'

export default defineComponent({
  name: 'now-date',
  setup(props, context) {
    const store = useStore()
    const x = '日一二三四五六'
    const date = reactive({
      year: '',
      month: '',
      day: '',
      hour: '',
      minute: '',
      second: '',
      week: '',
    })

    const time = computed(() => {
      return `${date.hour}:${date.minute}:${date.second}`
    })

    const dateAndWeek = computed(() => {
      return `${date.year}/${date.month}/${date.day}`
    })
    const  weather = computed(() => {
     let obj={
       name:'',
       iconUrl:''
     }
      switch (store.state.template.weather) {
        case WeatherType.Cloudy:
          obj.name='多云';
          obj.iconUrl=(window as any).resourceBaseUrl+'/static/imgs/多云.png';
          break;
        case WeatherType.Sun:
          obj.name='晴';
          obj.iconUrl=(window as any).resourceBaseUrl+'/static/imgs/晴天.png';
          break;
        case WeatherType.Rain:
          obj.name='雨'
          obj.iconUrl=(window as any).resourceBaseUrl+'/static/imgs/雨.png';
          break;
        case WeatherType.Snow:
          obj.name='雪'
          obj.iconUrl=(window as any).resourceBaseUrl+'/static/imgs/雪.png';
          break;
        case WeatherType.OvercastSky:
          obj.name='阴';
          obj.iconUrl=(window as any).resourceBaseUrl+'/static/imgs/阴.png';
          break;
      }
      return {
       name: obj.name,
        iconUrl: obj.iconUrl,
      }

    })


    const calc = (): void => {
      const now = new Date()
      date.year = now.getFullYear().toString().padStart(4, '0')
      date.month = (now.getMonth() + 1).toString().padStart(2, '0')
      date.day = now.getDate().toString().padStart(2, '0')
      date.hour = now.getHours().toString().padStart(2, '0')
      date.minute = now.getMinutes().toString().padStart(2, '0')
      date.second = now.getSeconds().toString().padStart(2, '0')
      date.week = '星期' + x[now.getDay()]
    }

    onMounted(() => {
      calc()
      setInterval(() => {
        calc()
      }, 1000)
    })

    return {
      date,
      time,
      dateAndWeek,
      weather
    }
  },
})
</script>

<style scoped lang="scss">
.now-date{
  display: flex;
  width: 100%;
  height: 32px;
  margin-top: 5px;
  color: #ccc;
  justify-content: right;
  font-size: 14px;
  align-items: stretch;
  line-height: 32px;
  img{
    width: 28px;
  }
  .item{
    padding-right: 10px;
    margin-left: 10px;
    border-right: 1px solid #666;
  }
  .item:last-child{
    border: none;
    padding: 0;
  }
  .weather{
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 60px;
  }
  .time{
    font-size: 24px;
  }
}
</style>
