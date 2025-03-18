import { WeatherType } from '@/share/weather-type.enum'

export type State = {
  weather: WeatherType.Sun|WeatherType.Cloudy|WeatherType.Snow|WeatherType.OvercastSky|WeatherType.Rain
}
export const defaultState = (): State => {
  return {
    weather: WeatherType.Rain,
  }
}
export const state: State = defaultState()
