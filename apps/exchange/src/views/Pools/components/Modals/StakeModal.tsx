import { useToast } from '@plexswap/ui-plex'
import { PoolWidget as Pool } from "@plexswap/widgets-internal"
import { useBoostedPoolApr } from 'views/Pools/hooks/useBoostedPoolApr'
import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getDecimalAmount } from '@plexswap/utils/formatBalance'
import { getChainName } from "@plexswap/chains";
import BigNumber from 'bignumber.js'
import { ToastDescriptionWithTx } from 'components/Toast'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useCatchTxError from 'hooks/useCatchTxError'
import { useERC20 } from 'hooks/useContract'
import { useCallback, useMemo, useState } from 'react'
import { useAppDispatch } from 'state'
import { updateUserAllowance, updateUserBalance, updateUserPendingReward, updateUserStakedBalance } from 'state/pools'
import { usePool } from 'state/pools/hooks'
import { useApprovePool } from 'views/Pools/hooks/useApprove'
import { useAccount } from 'wagmi'
import useStakePool from '../../hooks/useStakePool'
import useUnstakePool from '../../hooks/useUnstakePool'

const StakeModalContainer = ({
  isBnbPool,
  pool,
  isRemovingStake,
  onDismiss,
  stakingTokenBalance,
  stakingTokenPrice,
}: Pool.StakeModalPropsType<Token>) => {
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()

  const boostedApr = useBoostedPoolApr({
    chainId,
    enabled: !pool.isFinished ?? true,
    contractAddress: pool.contractAddress,
  })

  const {
    poolId,
    earningToken,
    stakingToken,
    earningTokenPrice,
    apr,
    userData,
    stakingLimit,
    enableEmergencyWithdraw,
  } = pool
  const { address: account } = useAccount()
  const { toastSuccess } = useToast()
  const { pool: singlePool } = usePool(poolId)
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const [amount, setAmount] = useState('')

  const { onUnstake } = useUnstakePool(poolId, enableEmergencyWithdraw as boolean)
  const { onStake } = useStakePool(poolId, isBnbPool)
  const dispatch = useAppDispatch()

  const stakingTokenContract = useERC20(stakingToken.address)
  const { handleApprove, pendingTx: enablePendingTx } = useApprovePool(
    stakingTokenContract,
    poolId,
    earningToken.symbol,
  )

  const tokenImageUrl = useMemo(
    () => (chainId ? `https://metalists.plexfinance.us/images/${getChainName(chainId)?.toLowerCase()}/` : ''),
    
    [chainId],
  )

  const onDone = useCallback(() => {
    if (account && chainId) {
      dispatch(updateUserStakedBalance({ poolId, account, chainId }))
      dispatch(updateUserPendingReward({ poolId, account, chainId }))
      dispatch(updateUserBalance({ poolId, account, chainId }))
    }
  }, [dispatch, poolId, account, chainId])

  const handleConfirmClick = useCallback(
    async (stakeAmount: string) => {
      const receipt = await fetchWithCatchTxError(() => {
        if (isRemovingStake) {
          return onUnstake(stakeAmount, stakingToken.decimals)
        }
        return onStake(stakeAmount, stakingToken.decimals)
      })
      if (receipt?.status) {
        if (isRemovingStake) {
          toastSuccess(
            `${t('Unstaked')}!`,
            <ToastDescriptionWithTx txHash={receipt.transactionHash}>
              {t('Your %symbol% earnings have also been harvested to your wallet!', {
                symbol: earningToken.symbol,
              })}
            </ToastDescriptionWithTx>,
          )
        } else {
          toastSuccess(
            `${t('Staked')}!`,
            <ToastDescriptionWithTx txHash={receipt.transactionHash}>
              {t('Your %symbol% funds have been staked in the pool!', {
                symbol: stakingToken.symbol,
              })}
            </ToastDescriptionWithTx>,
          )
        }

        onDone?.()
        onDismiss?.()
      }
    },
    [
      fetchWithCatchTxError,
      isRemovingStake,
      onStake,
      stakingToken.decimals,
      stakingToken.symbol,
      onUnstake,
      onDone,
      onDismiss,
      toastSuccess,
      t,
      earningToken.symbol,
    ],
  )

  const needEnable = useMemo(() => {
    if (!isRemovingStake && !pendingTx) {
      const stakeAmount = getDecimalAmount(new BigNumber(amount), stakingToken.decimals)
      return stakeAmount.gt(singlePool?.userData?.allowance ?? 0)
    }
    return false
  }, [singlePool, amount, pendingTx, isRemovingStake, stakingToken.decimals])

  const handleEnableApprove = async () => {
    if (account && chainId) {
      await handleApprove()
      dispatch(updateUserAllowance({ poolId, account, chainId }))
    }
  }

  const totalApr = useMemo(() => {
    let finalApr = apr ?? 0
    if (boostedApr) {
      finalApr = new BigNumber(boostedApr).plus(apr ?? 0).toNumber() ?? 0
    }

    return finalApr
  }, [boostedApr, apr])

  return (
    <Pool.StakeModal
      enableEmergencyWithdraw={enableEmergencyWithdraw ?? false}
      stakingLimit={stakingLimit ?? BIG_ZERO}
      stakingTokenPrice={stakingTokenPrice}
      earningTokenPrice={earningTokenPrice ?? 0}
      stakingTokenDecimals={stakingToken.decimals}
      earningTokenSymbol={earningToken.symbol}
      stakingTokenSymbol={stakingToken.symbol}
      stakingTokenAddress={stakingToken.address}
      stakingTokenBalance={stakingTokenBalance}
      apr={totalApr}
      userDataStakedBalance={userData?.stakedBalance ?? BIG_ZERO}
      userDataStakingTokenBalance={userData?.stakingTokenBalance ?? BIG_ZERO}
      onDismiss={onDismiss}
      pendingTx={pendingTx}
      account={account ?? ''}
      needEnable={needEnable}
      enablePendingTx={enablePendingTx}
      handleEnableApprove={handleEnableApprove}
      setAmount={setAmount}
      handleConfirmClick={handleConfirmClick}
      isRemovingStake={isRemovingStake}
      imageUrl={tokenImageUrl}
    />
  )
}

export default StakeModalContainer
