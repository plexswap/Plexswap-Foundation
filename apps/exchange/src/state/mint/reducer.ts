import { createReducer } from '@reduxjs/toolkit'
import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithReducer } from 'jotai/utils'
import { createContext, useContext } from 'react'
import { Field, resetMintState, typeInput } from './actions'

export interface MintState {
  readonly independentField: Field
  readonly typedValue: string
  readonly otherTypedValue: string // for the case when there's no liquidity
}

const initialState: MintState = {
  independentField: Field.CURRENCY_A,
  typedValue: '',
  otherTypedValue: '',
}

export const reducer = createReducer<MintState>(initialState, (builder) =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity } }) => {
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        if (field === state.independentField) {
          return {
            ...state,
            independentField: field,
            typedValue,
          }
        }
        // they're typing into a new field, store the other value

        return {
          ...state,
          independentField: field,
          typedValue,
          otherTypedValue: state.typedValue,
        }
      }
      return {
        ...state,
        independentField: field,
        typedValue,
        otherTypedValue: '',
      }
    }),
)

export const createFormAtom = () => atomWithReducer(initialState, reducer)

const AddLiquidityCoreAtomContext = createContext({
  formAtom: createFormAtom(),
})

export const AddLiquidityAtomProvider = AddLiquidityCoreAtomContext.Provider

export function useAddLiquidityFormState() {
  const ctx = useContext(AddLiquidityCoreAtomContext)
  return useAtomValue(ctx.formAtom)
}

export function useAddLiquidityFormDispatch() {
  const ctx = useContext(AddLiquidityCoreAtomContext)
  return useSetAtom(ctx.formAtom)
}
