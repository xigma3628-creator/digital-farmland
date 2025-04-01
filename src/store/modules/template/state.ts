import { WeatherType } from '@/share/weather-type.enum'
import { ModelParams } from '@/share/interface'
import { Cartesian2 } from 'cesium'

export type State = {
  weather: WeatherType.Sun|WeatherType.Cloudy|WeatherType.Snow|WeatherType.OvercastSky|WeatherType.Rain,
  equipmentDetailModelState:ModelParams
}
export const defaultState = (): State => {
  return {
    weather: WeatherType.Sun,
    equipmentDetailModelState:{
      pos:new Cartesian2(400,400),
      show:false,
      data:null
    }
  }
}
export const state: State = defaultState()
