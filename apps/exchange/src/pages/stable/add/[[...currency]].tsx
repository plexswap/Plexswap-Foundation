import { USDC, WAYA } from '@plexswap/tokens'
import { useCurrency } from 'hooks/Tokens'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useNativeCurrency from 'hooks/useNativeCurrency'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { CHAIN_IDS } from 'utils/wagmi'
import AddLiquidityCoreFormProvider from 'views/AddLiquidity/AddLiquidityCoreFormProvider'
import { AddLiquidityExtended, AddLiquidityExtendedLayout } from 'views/AddLiquidityExtended'
import { SELECTOR_TYPE } from 'views/AddLiquidityExtended/types'
import useStableConfig from 'views/Swap/hooks/useStableConfig'

const AddStableLiquidityPage = () => {
  const router = useRouter()
  const { chainId } = useActiveChainId()

  const native = useNativeCurrency()

  const [currencyIdA, currencyIdB] = router.query.currency || [
    native.symbol,
    chainId ? WAYA[chainId]?.address ?? USDC[chainId]?.address : '',
  ]

  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]

  const stableConfig = useStableConfig({
    tokenA: currencyA,
    tokenB: currencyB,
  })

  return (
    stableConfig.stableSwapConfig && (
      <AddLiquidityCoreFormProvider>
        <AddLiquidityExtendedLayout preferredSelectType={SELECTOR_TYPE.STABLE}>
          <AddLiquidityExtended
            preferredSelectType={SELECTOR_TYPE.STABLE}
            currencyIdA={currencyIdA}
            currencyIdB={currencyIdB}
          />
        </AddLiquidityExtendedLayout>
      </AddLiquidityCoreFormProvider>
    )
  )
}

AddStableLiquidityPage.chains = CHAIN_IDS

export default AddStableLiquidityPage

const OLD_PATH_STRUCTURE = /^(0x[a-fA-F0-9]{40}|BNB)-(0x[a-fA-F0-9]{40}|BNB)$/

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [{ params: { currency: [] } }],
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const currency = params?.currency || []
  const [currencyIdA, currencyIdB] = currency
  const match = currencyIdA?.match(OLD_PATH_STRUCTURE)

  if (match?.length) {
    return {
      redirect: {
        statusCode: 301,
        destination: `/add/${match[1]}/${match[2]}`,
      },
    }
  }

  if (currencyIdA && currencyIdB && currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return {
      redirect: {
        statusCode: 303,
        destination: `/add/${currencyIdA}`,
      },
    }
  }

  return {
    props: {},
  }
}
