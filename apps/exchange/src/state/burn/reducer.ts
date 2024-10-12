import { createReducer } from '@reduxjs/toolkit'
import { atomWithReducer } from 'jotai/utils'
import { createContext, useContext } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Field, typeInput } from './actions'

export interface BurnState {
  readonly independentField: Field
  readonly typedValue: string
}

const initialState: BurnState = {
  independentField: Field.LIQUIDITY_PERCENT,
  typedValue: '0',
}

const reducer = createReducer<BurnState>(initialState, (builder) =>
  builder.addCase(typeInput, (state, { payload: { field, typedValue } }) => {
    return {
      ...state,
      independentField: field,
      typedValue,
    }
  }),
)

export const createFormAtom = () => atomWithReducer(initialState, reducer)

const RemoveLiquidityAtomContext = createContext({
  formAtom: createFormAtom(),
})

export const RemoveLiquidityAtomProvider = RemoveLiquidityAtomContext.Provider

export function useRemoveLiquidityFormState() {
  const ctx = useContext(RemoveLiquidityAtomContext)
  return useAtomValue(ctx.formAtom)
}

export function useRemoveLiquidityFormDispatch() {
  const ctx = useContext(RemoveLiquidityAtomContext)
  return useSetAtom(ctx.formAtom)
}
