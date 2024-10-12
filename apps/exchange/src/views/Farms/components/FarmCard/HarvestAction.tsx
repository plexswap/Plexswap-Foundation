import { useTranslation } from '@plexswap/localization'
import { Balance, Button, Flex, Heading, TooltipText, useModal, useToast, useTooltip } from '@plexswap/ui-plex'
import { FarmWidget } from '@plexswap/widgets-internal'
import BigNumber from 'bignumber.js'
import { ToastDescriptionWithTx } from 'components/Toast'
import useCatchTxError from 'hooks/useCatchTxError'
import { Address } from 'viem'
import { useAccount } from 'wagmi'

import { SerializedWayaUserData } from '@plexswap/farms'
import { Token } from '@plexswap/sdk-core'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getBalanceAmount } from '@plexswap/utils/formatBalance'
import { useWayaPrice } from 'hooks/useWayaPrice'
import MultiChainHarvestModal from 'views/Farms/components/MultiChainHarvestModal'

interface FarmCardActionsProps {
  pid?: number
  token?: Token
  quoteToken?: Token
  earnings?: BigNumber
  vaultPid?: number
  proxyWayaBalance?: number
  lpSymbol?: string
  onReward: <SendTransactionResult>() => Promise<SendTransactionResult>
  onDone?: () => void
  wayaWrapperAddress?: Address
  wayaUserData?: SerializedWayaUserData
}

const HarvestAction: React.FC<React.PropsWithChildren<FarmCardActionsProps>> = ({
  pid,
  token,
  quoteToken,
  vaultPid,
  earnings = BIG_ZERO,
  proxyWayaBalance,
  lpSymbol,
  onReward,
  onDone,
  wayaWrapperAddress,
  wayaUserData,
}) => {
  const { address: account } = useAccount()
  const { toastSuccess } = useToast()
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const { t } = useTranslation()
  const wayaPrice = useWayaPrice()
  const rawEarningsBalance = account
    ? wayaWrapperAddress
      ? getBalanceAmount(new BigNumber(wayaUserData?.earnings ?? '0'))
      : getBalanceAmount(earnings)
    : BIG_ZERO
  const displayBalance = rawEarningsBalance.toFixed(5, BigNumber.ROUND_DOWN)
  const earningsBusd = rawEarningsBalance ? rawEarningsBalance.multipliedBy(wayaPrice).toNumber() : 0
  const tooltipBalance = rawEarningsBalance.isGreaterThan(FarmWidget.FARMS_SMALL_AMOUNT_THRESHOLD)
    ? displayBalance
    : '< 0.00001'
  const { targetRef, tooltip, tooltipVisible } = useTooltip(
    `${tooltipBalance} ${t(
      `WAYA has been harvested to the farm booster contract and will be automatically sent to your wallet upon the next harvest.`,
    )}`,
    {
      placement: 'bottom',
    },
  )

  const onClickHarvestButton = () => {
    if (vaultPid) {
      onPresentSpecialHarvestModal()
    } else {
      handleHarvest()
    }
  }

  const handleHarvest = async () => {
    const receipt = await fetchWithCatchTxError(() => {
      return onReward()
    })
    if (receipt?.status) {
      toastSuccess(
        `${t('Harvested')}!`,
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('Your %symbol% earnings have been sent to your wallet!', { symbol: 'WAYA' })}
        </ToastDescriptionWithTx>,
      )
      onDone?.()
    }
  }

  const [onPresentSpecialHarvestModal] = useModal(
    pid && token && lpSymbol && quoteToken ? (
      <MultiChainHarvestModal
        pid={pid}
        token={token}
        lpSymbol={lpSymbol}
        quoteToken={quoteToken}
        earningsBigNumber={earnings}
        earningsBusd={earningsBusd}
      />
    ) : null,
  )

  return (
    <Flex mb="8px" justifyContent="space-between" alignItems="center" width="100%">
      <Flex flexDirection="column" alignItems="flex-start">
        {proxyWayaBalance ? (
          <>
            <TooltipText ref={targetRef} decorationColor="secondary">
              <Heading color={rawEarningsBalance.eq(0) ? 'textDisabled' : 'text'}>{displayBalance}</Heading>
            </TooltipText>
            {tooltipVisible && tooltip}
          </>
        ) : (
          <Heading color={rawEarningsBalance.eq(0) ? 'textDisabled' : 'text'}>{displayBalance}</Heading>
        )}
        {earningsBusd > 0 && (
          <Balance fontSize="12px" color="textSubtle" decimals={2} value={earningsBusd} unit=" USD" prefix="~" />
        )}
      </Flex>
      <Button disabled={rawEarningsBalance.eq(0) || pendingTx} onClick={onClickHarvestButton}>
        {pendingTx ? t('Harvesting') : t('Harvest')}
      </Button>
    </Flex>
  )
}

export default HarvestAction
