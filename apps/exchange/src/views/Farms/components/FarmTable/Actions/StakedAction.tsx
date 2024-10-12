import { ChainId } from '@plexswap/chains'
import { FarmWithStakedValue } from '@plexswap/farms'
import { useTranslation } from '@plexswap/localization'
import { NATIVE, WNATIVE } from '@plexswap/sdk-core'
import { Flex, Text, useModal, useToast } from '@plexswap/ui-plex'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { formatLpBalance } from '@plexswap/utils/formatBalance'
import { FarmWidget } from '@plexswap/widgets-internal'
import BigNumber from 'bignumber.js'
import ConnectWalletButton from 'components/ConnectWalletButton'
import WalletModal, { WalletView } from 'components/Menu/UserMenu/WalletModal'
import { ToastDescriptionWithTx } from 'components/Toast'
import { BASE_ADD_LIQUIDITY_URL, DEFAULT_TOKEN_DECIMAL } from 'config'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import useCatchTxError from 'hooks/useCatchTxError'
import { useERC20 } from 'hooks/useContract'
import useNativeCurrency from 'hooks/useNativeCurrency'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useRouter } from 'next/router'
import { useCallback, useContext, useMemo, useState } from 'react'
import { useAppDispatch } from 'state'
import { fetchFarmUserDataAsync, fetchWayaWrapperUserDataAsync } from 'state/farms'
import { pickFarmTransactionTx } from 'state/global/actions'
import { FarmTransactionStatus, SpecialFarmStepType } from 'state/transactions/actions'
import { useSpecialFarmPendingTransaction, useTransactionAdder } from 'state/transactions/hooks'
import { styled } from 'styled-components'
import getLiquidityUrlPathParts from 'utils/getLiquidityUrlPathParts'
import { Hash } from 'viem'
import { useIsBloctoETH } from 'views/Farms'
import { useWayaBoostLimitAndLockInfo } from 'views/Farms/components/YieldBooster/hooks/Extended/useWayaExtendedInfo'

import { useAccount } from 'wagmi'
import useApproveFarm from '../../../hooks/useApproveFarm'
import { useFirstTimeCrossFarming } from '../../../hooks/useFirstTimeCrossFarming'
import useStakeFarms, { useWayaStakeFarms } from '../../../hooks/useStakeFarms'
import useUnstakeFarms, { useWayaUnstakeFarms } from '../../../hooks/useUnstakeFarms'
import { YieldBoosterStateContext } from '../../YieldBooster/components/ProxyFarmContainer'
import useProxyStakedActions from '../../YieldBooster/hooks/useProxyStakedActions'
import { YieldBoosterState } from '../../YieldBooster/hooks/useYieldBoosterState'

export const ActionTitles = styled.div`
  display: flex;
  margin-bottom: 8px;
`

interface StackedActionProps extends FarmWithStakedValue {
  userDataReady: boolean
  lpLabel?: string
  displayApr?: string
  onStake: (value: string) => Promise<Hash>
  onUnstake: (value: string) => Promise<Hash>
  onDone: () => void
  onApprove: () => Promise<Hash>
  isApproved: boolean
  shouldUseProxyFarm?: boolean
  wayaInfoSlot?: React.ReactElement
}

export function useStakedActions(lpContract, pid, vaultPid) {
  const { account, chainId } = useAccountActiveChain()
  const { onStake } = useStakeFarms(pid, vaultPid)
  const { onUnstake } = useUnstakeFarms(pid, vaultPid)
  const dispatch = useAppDispatch()

  const { onApprove } = useApproveFarm(lpContract, chainId!)

  const onDone = useCallback(() => {
    if (account && chainId) {
      dispatch(fetchFarmUserDataAsync({ account, pids: [pid], chainId }))
    }
  }, [account, pid, chainId, dispatch])

  return {
    onStake,
    onUnstake,
    onApprove,
    onDone,
  }
}

export function useStakedWayaActions(wayaWrapperAddress, lpContract, pid) {
  const { account, chainId } = useAccountActiveChain()
  const { onStake } = useWayaStakeFarms(wayaWrapperAddress)
  const { onUnstake } = useWayaUnstakeFarms(wayaWrapperAddress)
  const dispatch = useAppDispatch()

  const { onApprove } = useApproveFarm(lpContract, chainId!, wayaWrapperAddress)

  const onDone = useCallback(() => {
    if (account && chainId) {
      dispatch(fetchWayaWrapperUserDataAsync({ account, pids: [pid], chainId }))
    }
  }, [account, pid, chainId, dispatch])

  return {
    onStake,
    onUnstake,
    onApprove,
    onDone,
  }
}

export const ProxyStakedContainer = ({ children, ...props }) => {
  const { address: account } = useAccount()

  const { lpAddress } = props
  const lpContract = useERC20(lpAddress)

  const { onStake, onUnstake, onApprove, onDone } = useProxyStakedActions(props.pid, lpContract)

  const { allowance } = props.userData || {}

  const isApproved = account && allowance && allowance.isGreaterThan(0)

  return children({
    ...props,
    onStake,
    onDone,
    onUnstake,
    onApprove,
    isApproved,
  })
}

export const StakedContainer = ({ children, ...props }) => {
  const { address: account } = useAccount()
  const isBooster = Boolean(props.wayaWrapperAddress)

  const { lpAddress } = props
  const lpContract = useERC20(lpAddress)
  const { onStake, onUnstake, onApprove, onDone } = useStakedActions(lpContract, props.pid, props.vaultPid)
  const {
    onStake: onWayaWrapperStake,
    onUnstake: onWayaWrapperUnStake,
    onApprove: onWayaWrapperApprove,
    onDone: onWayaWrapperDone,
  } = useStakedWayaActions(props.wayaWrapperAddress, lpContract, props.pid)

  const { allowance } = (isBooster ? props.wayaUserData : props.userData) || {}

  const isApproved = account && allowance && allowance.isGreaterThan(0)

  return children({
    ...props,
    onStake: isBooster ? onWayaWrapperStake : onStake,
    onDone: isBooster ? onWayaWrapperDone : onDone,
    onUnstake: isBooster ? onWayaWrapperUnStake : onUnstake,
    onApprove: isBooster ? onWayaWrapperApprove : onApprove,
    isApproved,
  })
}

const Staked: React.FunctionComponent<React.PropsWithChildren<StackedActionProps>> = ({
  pid,
  apr,
  vaultPid,
  multiplier,
  lpSymbol,
  lpLabel,
  lpAddress,
  lpTokenPrice,
  quoteToken,
  token,
  userDataReady,
  displayApr,
  lpTotalSupply,
  tokenAmountTotal,
  quoteTokenAmountTotal,
  userData,
  wayaUserData,
  wayaPublicData,
  wayaWrapperAddress,
  lpRewardsApr,
  onDone,
  onStake,
  onUnstake,
  onApprove,
  isApproved,
  wayaInfoSlot,
}) => {
  const dispatch = useAppDispatch()
  const native = useNativeCurrency()

  const { locked } = useWayaBoostLimitAndLockInfo()
  const pendingFarm = useSpecialFarmPendingTransaction(lpAddress)
  const { boosterState } = useContext(YieldBoosterStateContext)
  const { isFirstTime, refresh: refreshFirstTime } = useFirstTimeCrossFarming(vaultPid)
  const { t } = useTranslation()
  const isBooster = Boolean(wayaWrapperAddress)
  const isBoosterAndRewardInRange = isBooster && wayaPublicData?.isRewardInRange
  const { toastSuccess } = useToast()
  const addTransaction = useTransactionAdder()
  const isBloctoETH = useIsBloctoETH()
  const { fetchWithCatchTxError, fetchTxResponse, loading: pendingTx } = useCatchTxError()
  const { account, chainId } = useAccountActiveChain()

  const { tokenBalance, stakedBalance, allowance } = (isBooster ? wayaUserData : userData) || {}

  const router = useRouter()
  const wayaPrice = useWayaPrice()
  const [wayaMultiplier] = useState<number | null>(() => null)

  const liquidityUrlPathParts = getLiquidityUrlPathParts({
    quoteTokenAddress: quoteToken.address,
    tokenAddress: token.address,
    chainId: token.chainId,
  })
  const addLiquidityUrl = `${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`

  const isStakeReady = useMemo(() => {
    return ['history', 'archived'].some((item) => router.pathname.includes(item)) || pendingFarm.length > 0
  }, [pendingFarm, router])

  const crossChainWarningText = useMemo(() => {
    return isFirstTime
      ? t('A small amount of %nativeToken% is required for the first-time setup of cross-chain WAYA farming.', {
          nativeToken: native.symbol,
        })
      : t('For safety, cross-chain transactions will take around 30 minutes to confirm.')
  }, [isFirstTime, native, t])

  const handleStake = async (amount: string) => {
    if (vaultPid) {
      await handleSpecialStake(amount)
      refreshFirstTime()
    } else {
      const receipt = await fetchWithCatchTxError(() => onStake(amount))

      if (receipt?.status) {
        toastSuccess(
          `${t('Staked')}!`,
          <ToastDescriptionWithTx txHash={receipt.transactionHash}>
            {t('Your funds have been staked in the farm')}
          </ToastDescriptionWithTx>,
        )
        onDone()
      }
    }
  }

  const handleSpecialStake = async (amountValue: string) => {
    const receipt = await fetchTxResponse(() => onStake(amountValue))
    const amountAsBigNumber = new BigNumber(amountValue).times(DEFAULT_TOKEN_DECIMAL)
    const amount = formatLpBalance(new BigNumber(amountAsBigNumber), 18)

    if (receipt && chainId) {
      addTransaction(receipt, {
        type: 'non-bsc-farm',
        translatableSummary: {
          text: 'Stake %amount% %lpSymbol% Token',
          data: { amount, lpSymbol },
        },
        specialFarm: {
          type: SpecialFarmStepType.STAKE,
          status: FarmTransactionStatus.PENDING,
          amount,
          lpSymbol,
          lpAddress,
          steps: [
            {
              step: 1,
              chainId,
              tx: receipt.hash,
              isFirstTime,
              status: FarmTransactionStatus.PENDING,
            },
            {
              step: 2,
              tx: '',
              chainId: ChainId.BSC,
              status: FarmTransactionStatus.PENDING,
            },
          ],
        },
      })

      if (chainId) {
        dispatch(pickFarmTransactionTx({ tx: receipt.hash, chainId }))
      }
      onDone()
    }
  }

  const handleUnstake = async (amount: string) => {
    if (vaultPid) {
      await handleSpecialUnStake(amount)
    } else {
      const receipt = await fetchWithCatchTxError(() => onUnstake(amount))
      if (receipt?.status) {
        toastSuccess(
          `${t('Unstaked')}!`,
          <ToastDescriptionWithTx txHash={receipt.transactionHash}>
            {t('Your earnings have also been harvested to your wallet')}
          </ToastDescriptionWithTx>,
        )
        onDone()
      }
    }
  }

  const handleSpecialUnStake = async (amountValue: string) => {
    const receipt = await fetchTxResponse(() => onUnstake(amountValue))
    const amountAsBigNumber = new BigNumber(amountValue).times(DEFAULT_TOKEN_DECIMAL)
    const amount = formatLpBalance(new BigNumber(amountAsBigNumber), 18)

    if (receipt && chainId) {
      addTransaction(receipt, {
        type: 'non-bsc-farm',
        translatableSummary: {
          text: 'Unstake %amount% %lpSymbol% Token',
          data: { amount, lpSymbol },
        },
        specialFarm: {
          type: SpecialFarmStepType.UNSTAKE,
          status: FarmTransactionStatus.PENDING,
          amount,
          lpSymbol,
          lpAddress,
          steps: [
            {
              step: 1,
              chainId,
              tx: receipt.hash,
              status: FarmTransactionStatus.PENDING,
            },
            {
              step: 2,
              chainId: ChainId.BSC,
              tx: '',
              status: FarmTransactionStatus.PENDING,
            },
            {
              step: 3,
              chainId,
              tx: '',
              status: FarmTransactionStatus.PENDING,
            },
          ],
        },
      })

      if (chainId) {
        dispatch(pickFarmTransactionTx({ tx: receipt.hash, chainId }))
      }
      onDone()
    }
  }

  // const wayaCalculatorSlot = (calculatorBalance) => (
  //   <WayaCalculator
  //     targetInputBalance={calculatorBalance}
  //     earningTokenPrice={wayaPrice.toNumber()}
  //     lpTokenStakedAmount={lpTokenStakedAmount ?? BIG_ZERO}
  //     setWayaMultiplier={setWayaMultiplier}
  //   />
  // )

  const handleApprove = useCallback(async () => {
    const receipt = await fetchWithCatchTxError(() => onApprove())
    if (receipt?.status) {
      toastSuccess(t('Contract Enabled'), <ToastDescriptionWithTx txHash={receipt.transactionHash} />)
      onDone()
    }
  }, [onApprove, t, toastSuccess, fetchWithCatchTxError, onDone])

  const [onPresentDeposit] = useModal(
    <FarmWidget.DepositModal
      account={account}
      pid={pid}
      lpTotalSupply={lpTotalSupply ?? BIG_ZERO}
      max={tokenBalance ?? BIG_ZERO}
      lpPrice={lpTokenPrice}
      lpLabel={lpLabel}
      apr={apr}
      displayApr={displayApr}
      stakedBalance={stakedBalance ?? BIG_ZERO}
      tokenName={lpSymbol}
      multiplier={multiplier}
      addLiquidityUrl={addLiquidityUrl}
      wayaPrice={wayaPrice}
      showActiveBooster={boosterState === YieldBoosterState.ACTIVE}
      wayaMultiplier={wayaMultiplier}
      showCrossChainFarmWarning={chainId !== ChainId.BSC && chainId !== ChainId.BSC_TESTNET && !wayaWrapperAddress}
      crossChainWarningText={crossChainWarningText}
      decimals={18}
      allowance={allowance}
      enablePendingTx={pendingTx}
      lpRewardsApr={lpRewardsApr}
      onConfirm={handleStake}
      handleApprove={handleApprove}
      isBooster={isBoosterAndRewardInRange && chainId === ChainId.BSC}
      boosterMultiplier={
        isBoosterAndRewardInRange
          ? wayaUserData?.boosterMultiplier === 0 || wayaUserData?.stakedBalance.eq(0) || !locked
            ? 2.5
            : wayaUserData?.boosterMultiplier
          : 1
      }
      // wayaCalculatorSlot={wayaCalculatorSlot}
    />,
    true,
    true,
    `farm-deposit-modal-${pid}`,
  )

  const [onPresentWithdraw] = useModal(
    <FarmWidget.WithdrawModal
      showActiveBooster={boosterState === YieldBoosterState.ACTIVE}
      max={stakedBalance ?? BIG_ZERO}
      onConfirm={handleUnstake}
      lpPrice={lpTokenPrice}
      tokenName={lpSymbol}
      decimals={18}
      showCrossChainFarmWarning={chainId !== ChainId.BSC && chainId !== ChainId.BSC_TESTNET && !wayaWrapperAddress}
    />,
  )

  const [onPresentTransactionModal] = useModal(<WalletModal initialView={WalletView.TRANSACTIONS} />)

  const onClickLoadingIcon = () => {
    const { length } = pendingFarm
    if (length) {
      if (length > 1) {
        onPresentTransactionModal()
      } else if (pendingFarm[0].txid && chainId) {
        dispatch(pickFarmTransactionTx({ tx: pendingFarm[0].txid, chainId }))
      }
    }
  }

  if (!account) {
    return (
      <FarmWidget.FarmTable.AccountNotConnect>
        <ConnectWalletButton width={wayaInfoSlot ? '50%' : '100%'} />
        {wayaInfoSlot}
      </FarmWidget.FarmTable.AccountNotConnect>
    )
  }

  if (!isApproved && stakedBalance?.eq(0)) {
    return (
      <FarmWidget.FarmTable.EnableStakeAction
        wayaInfoSlot={wayaInfoSlot}
        pendingTx={pendingTx || isBloctoETH}
        handleApprove={handleApprove}
      />
    )
  }

  if (!userDataReady) {
    return <FarmWidget.FarmTable.StakeActionDataNotReady wayaInfoSlot={wayaInfoSlot} />
  }

  if (stakedBalance?.gt(0)) {
    return (
      <FarmWidget.FarmTable.StakedActionComponent
        lpSymbol={lpSymbol}
        disabledMinusButton={pendingFarm.length > 0}
        disabledPlusButton={isStakeReady || isBloctoETH}
        onPresentWithdraw={onPresentWithdraw}
        onPresentDeposit={onPresentDeposit}
        wayaInfoSlot={wayaInfoSlot}
      >
        {wayaInfoSlot ? (
          <Flex flexDirection="column" flexBasis="75%">
            <ActionTitles style={{ marginBottom: 0 }}>
              <Text bold color="secondary" fontSize="12px" pr="4px">
                {lpSymbol}
              </Text>
              <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
                {t('Staked')}
              </Text>
            </ActionTitles>
            <FarmWidget.StakedLP
              decimals={18}
              stakedBalance={stakedBalance}
              quoteTokenSymbol={
                chainId && WNATIVE[chainId]?.symbol === quoteToken.symbol ? NATIVE[chainId]?.symbol : quoteToken.symbol
              }
              tokenSymbol={
                chainId && WNATIVE[chainId]?.symbol === token.symbol ? NATIVE[chainId]?.symbol : token.symbol
              }
              lpTotalSupply={lpTotalSupply ?? BIG_ZERO}
              lpTokenPrice={lpTokenPrice ?? BIG_ZERO}
              tokenAmountTotal={tokenAmountTotal ?? BIG_ZERO}
              quoteTokenAmountTotal={quoteTokenAmountTotal ?? BIG_ZERO}
              pendingFarmLength={pendingFarm.length}
              onClickLoadingIcon={onClickLoadingIcon}
            />
          </Flex>
        ) : (
          <FarmWidget.StakedLP
            decimals={18}
            stakedBalance={stakedBalance}
            quoteTokenSymbol={
              chainId && WNATIVE[chainId]?.symbol === quoteToken.symbol ? NATIVE[chainId]?.symbol : quoteToken.symbol
            }
            tokenSymbol={chainId && WNATIVE[chainId]?.symbol === token.symbol ? NATIVE[chainId]?.symbol : token.symbol}
            lpTotalSupply={lpTotalSupply ?? BIG_ZERO}
            lpTokenPrice={lpTokenPrice ?? BIG_ZERO}
            tokenAmountTotal={tokenAmountTotal ?? BIG_ZERO}
            quoteTokenAmountTotal={quoteTokenAmountTotal ?? BIG_ZERO}
            pendingFarmLength={pendingFarm.length}
            onClickLoadingIcon={onClickLoadingIcon}
          />
        )}
      </FarmWidget.FarmTable.StakedActionComponent>
    )
  }

  return (
    <FarmWidget.FarmTable.StakeComponent
      lpSymbol={lpSymbol}
      isStakeReady={isStakeReady}
      onPresentDeposit={onPresentDeposit}
      wayaInfoSlot={wayaInfoSlot}
    />
  )
}

export default Staked
