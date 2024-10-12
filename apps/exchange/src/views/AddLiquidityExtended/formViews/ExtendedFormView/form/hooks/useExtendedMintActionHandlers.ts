import { Price, Token } from '@plexswap/sdk-core'
import { useRouter } from 'next/router'
import { useCallback } from 'react'
import { batch } from 'react-redux'
import {
    Field,
    setFullRange,
    typeInput,
    typeLeftRangeInput,
    typeRightRangeInput,
    typeStartPriceInput,
} from '../actions'
import { useExtendedFormDispatch } from '../reducer'

export function useExtendedMintActionHandlers(
  noLiquidity: boolean | undefined,
  routerReplace = true, // TODO: remove this when we have a better way to handle the router
): {
  onSetFullRange: () => void
  onFieldAInput: (typedValue: string | undefined) => void
  onFieldBInput: (typedValue: string) => void
  onLeftRangeInput: (typedValue: Price<Token, Token> | undefined) => void
  onRightRangeInput: (typedValue: Price<Token, Token> | undefined) => void
  onStartPriceInput: (typedValue: string) => void
  onBothRangeInput: ({
    leftTypedValue,
    rightTypedValue,
  }: {
    leftTypedValue: Price<Token, Token> | undefined
    rightTypedValue: Price<Token, Token> | undefined
  }) => void
} {
  const router = useRouter()

  const dispatch = useExtendedFormDispatch()

  const onFieldAInput = useCallback(
    (typedValue: string | undefined) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity],
  )

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity],
  )

  const onBothRangeInput = useCallback(
    ({
      leftTypedValue,
      rightTypedValue,
    }: {
      leftTypedValue: Price<Token, Token> | undefined
      rightTypedValue: Price<Token, Token> | undefined
    }) => {
      batch(() => {
        dispatch(typeLeftRangeInput({ typedValue: leftTypedValue }))
        dispatch(typeRightRangeInput({ typedValue: rightTypedValue }))
      })

      if (routerReplace) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { minPrice, maxPrice, ...rest } = router.query

        // remove minPrice or maxPrice if its' empty
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...rest,
              ...(leftTypedValue && { minPrice: leftTypedValue.toFixed(18) }),
              ...(rightTypedValue && { maxPrice: rightTypedValue.toFixed(18) }),
            },
          },
          undefined,
          {
            shallow: true,
          },
        )
      }
    },
    [dispatch, router, routerReplace],
  )

  const onLeftRangeInput = useCallback(
    (typedValue: Price<Token, Token> | undefined) => {
      dispatch(typeLeftRangeInput({ typedValue }))
      if (routerReplace) {
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, minPrice: typedValue?.toFixed(18) },
          },
          undefined,
          {
            shallow: true,
          },
        )
      }
    },
    [dispatch, router, routerReplace],
  )

  const onRightRangeInput = useCallback(
    (typedValue: Price<Token, Token> | undefined) => {
      dispatch(typeRightRangeInput({ typedValue }))
      if (routerReplace) {
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, maxPrice: typedValue?.toFixed(6) },
          },
          undefined,
          {
            shallow: true,
          },
        )
      }
    },
    [dispatch, router, routerReplace],
  )

  const onStartPriceInput = useCallback(
    (typedValue: string) => {
      dispatch(typeStartPriceInput({ typedValue }))
    },
    [dispatch],
  )

  const onSetFullRange = useCallback(() => {
    dispatch(setFullRange())
  }, [dispatch])

  return {
    onBothRangeInput,
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
    onSetFullRange,
  }
}
