import { useTranslation } from '@plexswap/localization'
import { Skeleton, useModal, useToast } from '@plexswap/ui-plex'
import { FarmWidget } from '@plexswap/widgets-internal'
import BigNumber from 'bignumber.js'
import { ToastDescriptionWithTx } from 'components/Toast'
import useCatchTxError from 'hooks/useCatchTxError'
import { useERC20 } from 'hooks/useContract'
import { useAppDispatch } from 'state'
import { fetchFarmUserDataAsync, fetchWayaWrapperUserDataAsync } from 'state/farms'

import { FarmWithStakedValue } from '@plexswap/farms'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getBalanceAmount } from '@plexswap/utils/formatBalance'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useCallback } from 'react'
import MultiChainHarvestModal from 'views/Farms/components/MultiChainHarvestModal'
import useHarvestFarm, { useWayaHarvestFarm } from '../../../hooks/useHarvestFarm'
import useProxyStakedActions from '../../YieldBooster/hooks/useProxyStakedActions'

const { FarmTableHarvestAction } = FarmWidget.FarmTable

interface HarvestActionProps extends FarmWithStakedValue {
  userDataReady: boolean
  onReward?: <TResult>() => Promise<TResult>
  proxyWayaBalance?: number
  onDone?: () => void
  style?: React.CSSProperties
}

export const ProxyHarvestActionContainer = ({ children, ...props }) => {
  const { lpAddress } = props
  const lpContract = useERC20(lpAddress)

  const { onReward, onDone, proxyWayaBalance } = useProxyStakedActions(props.pid, lpContract)

  return children({ ...props, onReward, proxyWayaBalance, onDone })
}

export const HarvestActionContainer = ({ children, ...props }) => {
  const { onReward } = useHarvestFarm(props.pid)
  const { onReward: onRewardWaya } = useWayaHarvestFarm(props.wayaWrapperAddress ?? '0x')
  const isBooster = Boolean(props.wayaWrapperAddress)
  const { account, chainId } = useAccountActiveChain()
  const dispatch = useAppDispatch()

  const onDone = useCallback(() => {
    if (account && chainId) {
      dispatch(fetchFarmUserDataAsync({ account, pids: [props.pid], chainId }))
    }
  }, [account, dispatch, chainId, props.pid])
  const onWayaDone = useCallback(() => {
    if (account && chainId) {
      dispatch(fetchWayaWrapperUserDataAsync({ account, pids: [props.pid], chainId }))
    }
  }, [account, dispatch, chainId, props.pid])

  return children({
    ...props,
    onDone: isBooster ? onWayaDone : onDone,
    onReward: isBooster ? onRewardWaya : onReward,
  })
}

export const HarvestAction: React.FunctionComponent<React.PropsWithChildren<HarvestActionProps>> = ({
  pid,
  token,
  quoteToken,
  vaultPid,
  userData,
  userDataReady,
  proxyWayaBalance,
  lpSymbol,
  onReward,
  onDone,
  wayaUserData,
  wayaWrapperAddress,
  style,
}) => {
  const { t } = useTranslation()
  const { toastSuccess } = useToast()
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const earningsBigNumber = wayaWrapperAddress
    ? new BigNumber(wayaUserData?.earnings ?? 0)
    : new BigNumber(userData?.earnings ?? 0)
  const wayaPrice = useWayaPrice()
  let earnings = BIG_ZERO
  let earningsBusd = 0
  let displayBalance = userDataReady ? earnings.toFixed(5, BigNumber.ROUND_DOWN) : <Skeleton width={60} />

  // If user didn't connect wallet default balance will be 0
  if (!earningsBigNumber.isZero()) {
    earnings = getBalanceAmount(earningsBigNumber)
    earningsBusd = earnings.multipliedBy(wayaPrice).toNumber()
    displayBalance = earnings.toFixed(5, BigNumber.ROUND_DOWN)
  }

  const onClickHarvestButton = () => {
    if (vaultPid) {
      onPresentSpecialHarvestModal()
    } else {
      handleHarvest()
    }
  }

  const handleHarvest = async () => {
    const receipt = await fetchWithCatchTxError((): any => onReward?.())
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
    <MultiChainHarvestModal
      pid={pid}
      token={token}
      lpSymbol={lpSymbol}
      quoteToken={quoteToken}
      earningsBigNumber={earningsBigNumber}
      earningsBusd={earningsBusd}
    />,
  )

  return (
    <FarmTableHarvestAction
      earnings={earnings}
      earningsBusd={earningsBusd}
      displayBalance={displayBalance}
      pendingTx={pendingTx}
      userDataReady={userDataReady}
      proxyWayaBalance={proxyWayaBalance}
      disabled={earnings.eq(0) || pendingTx || !userDataReady}
      handleHarvest={onClickHarvestButton}
      style={style}
    />
  )
}

export default HarvestAction
