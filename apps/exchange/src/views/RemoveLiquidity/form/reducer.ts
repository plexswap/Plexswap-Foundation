import { createReducer } from '@reduxjs/toolkit'

import { selectPercent } from './actions'

interface BurnExtendedState {
  readonly percent: number
}

const initialState: BurnExtendedState = {
  percent: 0,
}

export default createReducer<BurnExtendedState>(initialState, (builder) =>
  builder.addCase(selectPercent, (state, { payload: { percent } }) => {
    return {
      ...state,
      percent,
    }
  }),
)
