import { useTranslation } from '@plexswap/localization'
import { useToast } from '@plexswap/ui-plex'
import { ChiefFarmerExtended, NonfungiblePositionManager } from '@plexswap/sdk-extended'
import { useQueryClient } from '@tanstack/react-query'
import { ToastDescriptionWithTx } from 'components/Toast'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useCatchTxError from 'hooks/useCatchTxError'
import { useChieffarmerExtended, useExtendedNFTPositionManagerContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { calculateGasMargin } from 'utils'
import { getViemClients, viemClients } from 'utils/viem'
import { Address, hexToBigInt } from 'viem'
import { useAccount, useSendTransaction, useWalletClient } from 'wagmi'

interface FarmExtendedActionContainerChildrenProps {
  attemptingTxn: boolean
  onStake: () => Promise<void>
  onUnstake: () => Promise<void>
  onHarvest: () => Promise<void>
}

const useFarmExtendedActions = ({
  tokenId,
  onDone,
}: {
  tokenId: string
  onDone?: () => void
}): FarmExtendedActionContainerChildrenProps => {
  const { t } = useTranslation()
  const { toastSuccess } = useToast()
  const { address: account } = useAccount()
  const { data: signer } = useWalletClient()
  const { chainId } = useActiveChainId()
  const { sendTransactionAsync } = useSendTransaction()
  const queryClient = useQueryClient()
  const publicClient = viemClients[chainId as keyof typeof viemClients]

  const { loading, fetchWithCatchTxError } = useCatchTxError()

  const chiefFarmerExtendedAddress = useChieffarmerExtended()?.address as Address
  const nftPositionManagerAddress = useExtendedNFTPositionManagerContract()?.address

  const onUnstake = useCallback(async () => {
    if (!account) return

    const { calldata, value } = ChiefFarmerExtended.withdrawCallParameters({ tokenId, to: account })

    const txn = {
      account,
      to: chiefFarmerExtendedAddress,
      data: calldata,
      value: hexToBigInt(value),
      chain: signer?.chain,
    }

    const resp = await fetchWithCatchTxError(() =>
      publicClient.estimateGas(txn).then((estimate) => {
        const newTxn = {
          ...txn,
          gas: calculateGasMargin(estimate),
        }

        return sendTransactionAsync(newTxn)
      }),
    )
    if (resp?.status) {
      onDone?.()
      toastSuccess(
        `${t('Unstaked')}!`,
        <ToastDescriptionWithTx txHash={resp.transactionHash}>
          {t('Your earnings have also been harvested to your wallet')}
        </ToastDescriptionWithTx>,
      )
    }
  }, [
    account,
    fetchWithCatchTxError,
    chiefFarmerExtendedAddress,
    publicClient,
    sendTransactionAsync,
    signer,
    t,
    toastSuccess,
    tokenId,
    onDone,
  ])

  const onStake = useCallback(async () => {
    if (!account || !nftPositionManagerAddress) return

    const { calldata, value } = NonfungiblePositionManager.safeTransferFromParameters({
      tokenId,
      recipient: chiefFarmerExtendedAddress,
      sender: account,
    })

    const txn = {
      to: nftPositionManagerAddress,
      data: calldata,
      value: hexToBigInt(value),
      account,
      chain: signer?.chain,
    }

    const resp = await fetchWithCatchTxError(() =>
      publicClient.estimateGas(txn).then((estimate) => {
        const newTxn = {
          ...txn,
          gas: calculateGasMargin(estimate),
        }

        return sendTransactionAsync(newTxn)
      }),
    )

    if (resp?.status) {
      onDone?.()
      toastSuccess(
        `${t('Staked')}!`,
        <ToastDescriptionWithTx txHash={resp.transactionHash}>
          {t('Your funds have been staked in the farm')}
        </ToastDescriptionWithTx>,
      )
    }
  }, [
    account,
    fetchWithCatchTxError,
    chiefFarmerExtendedAddress,
    nftPositionManagerAddress,
    publicClient,
    sendTransactionAsync,
    signer,
    t,
    toastSuccess,
    tokenId,
    onDone,
  ])

  const onHarvest = useCallback(async () => {
    if (!account) return

    const { calldata } = ChiefFarmerExtended.harvestCallParameters({ tokenId, to: account })

    const txn = {
      to: chiefFarmerExtendedAddress,
      data: calldata,
      value: 0n,
    }

    const resp = await fetchWithCatchTxError(() =>
      publicClient
        .estimateGas({
          account,
          ...txn,
        })
        .then((estimate) => {
          const newTxn = {
            ...txn,
            account,
            chain: signer?.chain,
            gas: calculateGasMargin(estimate),
          }

          return sendTransactionAsync(newTxn)
        }),
    )

    if (resp?.status) {
      toastSuccess(
        `${t('Harvested')}!`,
        <ToastDescriptionWithTx txHash={resp.transactionHash}>
          {t('Your %symbol% earnings have been sent to your wallet!', { symbol: 'WAYA' })}
        </ToastDescriptionWithTx>,
      )
      queryClient.invalidateQueries({ queryKey: ['cfExtended-harvest'] })
    }
  }, [
    account,
    fetchWithCatchTxError,
    chiefFarmerExtendedAddress,
    publicClient,
    sendTransactionAsync,
    signer,
    t,
    toastSuccess,
    tokenId,
    queryClient,
  ])

  return {
    attemptingTxn: loading,
    onStake,
    onUnstake,
    onHarvest,
  }
}

export function useGlobalFarmsBatchHarvest() {
  const { t } = useTranslation()
  const { data: signer } = useWalletClient()
  const { toastSuccess } = useToast()
  const { address: account } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const { loading, fetchWithCatchTxError } = useCatchTxError()
  const queryClient = useQueryClient()

  const chiefFarmerExtendedAddress = useChieffarmerExtended()?.address
  const onHarvestAll = useCallback(
    async (tokenIds: string[]) => {
      if (!account || !chiefFarmerExtendedAddress) return

      const { calldata, value } = ChiefFarmerExtended.batchHarvestCallParameters(
        tokenIds.map((tokenId) => ({ tokenId, to: account })),
      )

      const txn = {
        to: chiefFarmerExtendedAddress,
        data: calldata,
        value: hexToBigInt(value),
        account,
      }
      const publicClient = getViemClients({ chainId: signer?.chain?.id })

      const resp = await fetchWithCatchTxError(() =>
        publicClient.estimateGas(txn).then((estimate) => {
          const newTxn = {
            ...txn,
            gas: calculateGasMargin(estimate),
          }

          return sendTransactionAsync(newTxn)
        }),
      )

      if (resp?.status) {
        toastSuccess(
          `${t('Harvested')}!`,
          <ToastDescriptionWithTx txHash={resp.transactionHash}>
            {t('Your %symbol% earnings have been sent to your wallet!', { symbol: 'WAYA' })}
          </ToastDescriptionWithTx>,
        )
        queryClient.invalidateQueries({ queryKey: ['cfExtended-harvest'] })
      }
    },
    [account, fetchWithCatchTxError, chiefFarmerExtendedAddress, sendTransactionAsync, signer, t, toastSuccess, queryClient],
  )

  return {
    onHarvestAll,
    harvesting: loading,
  }
}

export default useFarmExtendedActions
