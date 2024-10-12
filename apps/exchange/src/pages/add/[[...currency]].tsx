import { isStableFarm } from '@plexswap/farms'
import { useCurrency } from 'hooks/Tokens'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { useFarmPublicAPI } from 'state/farms/hooks'
import { useFarmsExtendedPublic } from 'state/farmsExtended/hooks'
import { CHAIN_IDS } from 'utils/wagmi'
import AddLiquidityCoreFormProvider from 'views/AddLiquidity/AddLiquidityCoreFormProvider'
import { AddLiquidityExtendedLayout, AddLiquidityExtended } from 'views/AddLiquidityExtended'
import LiquidityFormProvider from 'views/AddLiquidityExtended/formViews/ExtendedFormView/form/LiquidityFormProvider'
import { useCurrencyParams } from 'views/AddLiquidityExtended/hooks/useCurrencyParams'
import { SELECTOR_TYPE } from 'views/AddLiquidityExtended/types'

const AddLiquidityPage = () => {
  const router = useRouter()

  // fetching farm api instead of using redux store here to avoid huge amount of actions and hooks needed
  const { data: farmsCorePublic } = useFarmPublicAPI()
  const { data: farmExtendedPublic } = useFarmsExtendedPublic()

  const { currencyIdA, currencyIdB, feeAmount } = useCurrencyParams()

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  // Initial prefer farm type if there is a farm for the pair
  const preferFarmType = useMemo(() => {
    if (!currencyA || !currencyB || !router.isReady) return undefined

    const hasExtendedFarm = farmExtendedPublic?.farmsWithPrice.find(
      (farm) =>
        farm.multiplier !== '0X' &&
        ((farm.token.equals(currencyA.wrapped) && farm.quoteToken.equals(currencyB.wrapped)) ||
          (farm.quoteToken.equals(currencyA.wrapped) && farm.token.equals(currencyB.wrapped))),
    )
    if (hasExtendedFarm)
      return {
        type: SELECTOR_TYPE.EXTENDED,
        feeAmount: hasExtendedFarm.feeAmount,
      }

    const hasCoreFarm = farmsCorePublic?.find(
      (farm) =>
        farm.multiplier !== '0X' &&
        ((farm.token.address === currencyA.wrapped.address && farm.quoteToken.address === currencyB.wrapped.address) ||
          (farm.token.address === currencyB.wrapped.address && farm.quoteToken.address === currencyA.wrapped.address)),
    )
    return hasCoreFarm
      ? isStableFarm(hasCoreFarm)
        ? { type: SELECTOR_TYPE.STABLE }
        : { type: SELECTOR_TYPE.CORE }
      : undefined
  }, [farmsCorePublic, farmExtendedPublic?.farmsWithPrice, currencyA, currencyB, router])

  const handleRefresh = useCallback(() => {
    router.replace(
      {
        pathname: router.pathname,
        query: {
          currency: [currencyIdA!, currencyIdB!],
        },
      },
      undefined,
      { shallow: true },
    )
  }, [router, currencyIdA, currencyIdB])

  return (
    <AddLiquidityCoreFormProvider>
      <LiquidityFormProvider>
        <AddLiquidityExtendedLayout
          handleRefresh={handleRefresh}
          showRefreshButton={preferFarmType?.type === SELECTOR_TYPE.EXTENDED && preferFarmType?.feeAmount !== feeAmount}
        >
          <AddLiquidityExtended
            currencyIdA={currencyIdA}
            currencyIdB={currencyIdB}
            preferredSelectType={!feeAmount ? preferFarmType?.type : undefined}
            preferredFeeAmount={!feeAmount ? preferFarmType?.feeAmount : undefined}
          />
        </AddLiquidityExtendedLayout>
      </LiquidityFormProvider>
    </AddLiquidityCoreFormProvider>
  )
}

AddLiquidityPage.chains = CHAIN_IDS
AddLiquidityPage.screen = true

export default AddLiquidityPage