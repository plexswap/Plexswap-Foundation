import { Price, Token } from '@plexswap/sdk-core';
import { createAction } from '@reduxjs/toolkit';

export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export const typeInput = createAction<{ field: Field; typedValue: string | undefined; noLiquidity: boolean }>(
  'mintExtended/typeInputMint',
)
export const typeStartPriceInput = createAction<{ typedValue: string }>('mintExtended/typeStartPriceInput')
export const typeLeftRangeInput = createAction<{ typedValue: Price<Token, Token> | undefined }>(
  'mintExtended/typeLeftRangeInput',
)
export const typeRightRangeInput = createAction<{ typedValue: Price<Token, Token> | undefined }>(
  'mintExtended/typeRightRangeInput',
)
export const resetMintState = createAction<void>('mintExtended/resetMintState')
export const setFullRange = createAction<void>('mintExtended/setFullRange')
