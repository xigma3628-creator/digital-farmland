import { ActionTree } from 'vuex'
import { RootState } from '@/store'

import type { State } from './state'
import { TemplateMutationTypes } from './mutation-types'
import { TemplateActionTypes } from './action-types'

export const actions: ActionTree<State, RootState> = {
  async [TemplateActionTypes.RESET_STATE]({ commit }) {
    commit(TemplateMutationTypes.RESET_STATE)
  },
  async [TemplateActionTypes.SET_WEATHER]({ commit }) {
    commit(TemplateMutationTypes.SET_WEATHER)
  },
  async [TemplateActionTypes.SET_EQUIPMENT_DETAIL_MODEL]({ commit }) {
    commit(TemplateMutationTypes.SET_EQUIPMENT_DETAIL_MODEL)
  }
}
