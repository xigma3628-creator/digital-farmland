import { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { State } from './state'
import { TemplateMutationTypes } from './mutation-types'
import { WeatherType } from '@/share/weather-type.enum'
import { ModelParams } from '@/share/interface'

export const mutations: MutationTree<State> = {
  [TemplateMutationTypes.RESET_STATE](state: State) {
    Object.assign(state, defaultState())
  },
  [TemplateMutationTypes.SET_WEATHER](state:State,weather: WeatherType.Sun|WeatherType.Cloudy|WeatherType.Snow|WeatherType.OvercastSky|WeatherType.Rain) {
    state.weather = weather
  },

  [TemplateMutationTypes.SET_EQUIPMENT_DETAIL_MODEL](state:State,model:ModelParams) {
    state.equipmentDetailModelState=model
  },
}
