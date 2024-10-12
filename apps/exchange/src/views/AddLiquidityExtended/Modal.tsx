import { useTranslation } from '@plexswap/localization'
import { Currency } from '@plexswap/sdk-core'
import { AutoRow, Box, Modal, ModalCore, UseModalCoreProps } from '@plexswap/ui-plex'
import { FeeAmount } from '@plexswap/sdk-extended'
import GlobalSettings from 'components/Menu/GlobalSettings'
import { SettingsMode } from 'components/Menu/GlobalSettings/types'
import { useCurrency } from 'hooks/Tokens'
import { usePublicNodeWaitForTransaction } from 'hooks/usePublicNodeWaitForTransaction'
import { useRouter } from 'next/router'
import { useCallback } from 'react'
import currencyId from 'utils/currencyId'
import AddLiquidityCoreFormProvider from 'views/AddLiquidity/AddLiquidityCoreFormProvider'
import { AddLiquidityExtended } from '.'
import { AprCalculator } from './components/AprCalculator'
import LiquidityFormProvider from './formViews/ExtendedFormView/form/LiquidityFormProvider'
import { SELECTOR_TYPE } from './types'

export function AddLiquidityExtendedModal({
  currency0,
  currency1,
  isOpen,
  onDismiss,
  feeAmount,
  preferredSelectType = SELECTOR_TYPE.EXTENDED,
}: {
  currency0?: Currency
  currency1?: Currency
  feeAmount?: FeeAmount
  preferredSelectType?: SELECTOR_TYPE
} & UseModalCoreProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [currencyIdA, currencyIdB] =
    typeof router.query.currency === 'string'
      ? [router.query.currency]
      : router.query.currency || [currency0 && currencyId(currency0), currency1 && currencyId(currency1)]

  const baseCurrency = useCurrency(currencyIdA)
  const quoteCurrency = useCurrency(currencyIdB)

  const { waitForTransaction } = usePublicNodeWaitForTransaction()

  const dismiss = useCallback(() => {
    onDismiss?.()
    setTimeout(() => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            currency: [],
            minPrice: [],
            maxPrice: [],
          },
        },
        undefined,
        {
          shallow: true,
        },
      )
    }, 600)
  }, [onDismiss, router])

  const onAddLiquidityCallback = useCallback(
    (hash: `0x${string}`) => {
      if (hash) {
        waitForTransaction({
          hash,
          chainId: currency0?.chainId,
        }).then(() => {
          dismiss()
        })
      } else {
        dismiss()
      }
    },
    [currency0, dismiss, waitForTransaction],
  )

  return (
    <ModalCore isOpen={isOpen} onDismiss={dismiss} closeOnOverlayClick>
      <AddLiquidityCoreFormProvider>
        <LiquidityFormProvider onAddLiquidityCallback={onAddLiquidityCallback}>
          <Modal
            bodyPadding="8px"
            title={t('Add Liquidity')}
            headerRightSlot={
              <AutoRow width="auto" gap="8px">
                <AprCalculator
                  baseCurrency={baseCurrency}
                  quoteCurrency={quoteCurrency}
                  feeAmount={feeAmount}
                  showTitle={false}
                />
                <GlobalSettings mode={SettingsMode.SWAP_LIQUIDITY} />
              </AutoRow>
            }
          >
            <Box maxWidth="856px">
              <AddLiquidityExtended
                currencyIdA={currencyIdA}
                currencyIdB={currencyIdB}
                preferredSelectType={preferredSelectType}
                preferredFeeAmount={feeAmount}
              />
            </Box>
          </Modal>
        </LiquidityFormProvider>
      </AddLiquidityCoreFormProvider>
    </ModalCore>
  )
}
