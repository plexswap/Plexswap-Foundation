import { useTranslation } from '@plexswap/localization'
import { Box, Text, useToast } from '@plexswap/ui-plex'
import { AVERAGE_CHAIN_BLOCK_TIMES } from '@plexswap/chains'
import { useQuery } from '@tanstack/react-query'
import { ToastDescriptionWithTx } from 'components/Toast'
import { BSC_BLOCK_TIME } from 'config'
import { FAST_INTERVAL } from 'config/constants'
import forEach from 'lodash/forEach'
import merge from 'lodash/merge'
import pickBy from 'lodash/pickBy'
import React, { useEffect, useMemo, useRef } from 'react'
import { useAppDispatch } from 'state'
import { RetryableError, retry } from 'state/multicall/retry'
import {
    BlockNotFoundError,
    TransactionNotFoundError,
    TransactionReceiptNotFoundError,
    WaitForTransactionReceiptTimeoutError,
} from 'viem'
import { usePublicClient } from 'wagmi'
import {
    FarmTransactionStatus,
    MsgStatus,
    SpecialFarmStepType,
    SpecialFarmTransactionStep,
    finalizeTransaction,
} from './actions'
import { fetchCelerApi } from './fetchCelerApi'
import { useAllChainTransactions } from './hooks'
import { TransactionDetails } from './reducer'

export function shouldCheck(
  fetchedTransactions: { [txHash: string]: TransactionDetails },
  tx: TransactionDetails,
): boolean {
  if (tx.receipt) return false
  return !fetchedTransactions[tx.hash]
}

export const Updater: React.FC<{ chainId: number }> = ({ chainId }) => {
  const provider = usePublicClient({ chainId })
  const { t } = useTranslation()

  const dispatch = useAppDispatch()
  const transactions = useAllChainTransactions(chainId)

  const { toastError, toastSuccess } = useToast()

  const fetchedTransactions = useRef<{ [txHash: string]: TransactionDetails }>({})

  useEffect(() => {
    if (!chainId || !provider) return

    forEach(
      pickBy(transactions, (transaction) => shouldCheck(fetchedTransactions.current, transaction)),
      (transaction) => {
        const getTransaction = async () => {
          try {
            const receipt: any = await provider.getTransactionReceipt({ hash: transaction.hash })

            dispatch(
              finalizeTransaction({
                chainId,
                hash: transaction.hash,
                receipt: {
                  blockHash: receipt.blockHash,
                  blockNumber: Number(receipt.blockNumber),
                  contractAddress: receipt.contractAddress,
                  from: receipt.from,
                  status: receipt.status === 'success' ? 1 : 0,
                  to: receipt.to,
                  transactionHash: receipt.transactionHash,
                  transactionIndex: receipt.transactionIndex,
                },
              }),
            )
            const toast = receipt.status === 'success' ? toastSuccess : toastError
            toast(
              t('Transaction receipt'),
              <ToastDescriptionWithTx txHash={receipt.transactionHash} txChainId={chainId} />,
            )
          } catch (error) {
            console.error(error)
            if (error instanceof TransactionNotFoundError) {
              throw new RetryableError(`Transaction not found: ${transaction.hash}`)
            } else if (error instanceof TransactionReceiptNotFoundError) {
              throw new RetryableError(`Transaction receipt not found: ${transaction.hash}`)
            } else if (error instanceof BlockNotFoundError) {
              throw new RetryableError(`Block not found for transaction: ${transaction.hash}`)
            } else if (error instanceof WaitForTransactionReceiptTimeoutError) {
              throw new RetryableError(`Timeout reached when fetching transaction receipt: ${transaction.hash}`)
            }
          } finally {
            merge(fetchedTransactions.current, { [transaction.hash]: transactions[transaction.hash] })
          }
        }
        retry(getTransaction, {
          n: 10,
          minWait: 5000,
          maxWait: 10000,
          delay: (AVERAGE_CHAIN_BLOCK_TIMES[chainId] ?? BSC_BLOCK_TIME) * 1000 + 1000,
        })
      },
    )
  }, [chainId, provider, transactions, dispatch, toastSuccess, toastError, t])

  const specialFarmPendingTxns = useMemo(
    () =>
      Object.keys(transactions).filter(
        (hash) =>
          transactions[hash].receipt?.status === 1 &&
          transactions[hash].type === 'non-bsc-farm' &&
          transactions[hash].specialFarm?.status === FarmTransactionStatus.PENDING,
      ),
    [transactions],
  )

  useQuery({
    queryKey: ['checkSpecialFarmTransaction', FAST_INTERVAL, chainId],

    queryFn: () => {
      specialFarmPendingTxns.forEach((hash) => {
        const steps = transactions[hash]?.specialFarm?.steps || []
        if (steps.length) {
          const pendingStep = steps.findIndex(
            (step: SpecialFarmTransactionStep) => step.status === FarmTransactionStatus.PENDING,
          )
          const previousIndex = pendingStep - 1

          if (previousIndex >= 0) {
            const previousHash = steps[previousIndex]
            const checkHash = previousHash.tx || hash

            fetchCelerApi(checkHash)
              .then((response) => {
                const transaction = transactions[hash]
                const { destinationTxHash, messageStatus } = response
                const status =
                  messageStatus === MsgStatus.MS_COMPLETED
                    ? FarmTransactionStatus.SUCCESS
                    : messageStatus === MsgStatus.MS_FAIL
                    ? FarmTransactionStatus.FAIL
                    : FarmTransactionStatus.PENDING
                const isFinalStepComplete = status === FarmTransactionStatus.SUCCESS && steps.length === pendingStep + 1

                const newSteps = transaction?.specialFarm?.steps?.map((step, index) => {
                  let newObj = {}
                  if (index === pendingStep) {
                    newObj = { ...step, status, tx: destinationTxHash }
                  }
                  return { ...step, ...newObj }
                })

                const newStatus = isFinalStepComplete ? FarmTransactionStatus.SUCCESS : transaction?.specialFarm?.status

                dispatch(
                  finalizeTransaction({
                    chainId,
                    hash: transaction.hash,
                    receipt: { ...transaction.receipt! },
                    specialFarm: {
                      ...transaction.specialFarm!,
                      ...(newSteps && { steps: newSteps }),
                      ...(newStatus && { status: newStatus }),
                    },
                  }),
                )

                const isStakeType = transactions[hash]?.specialFarm?.type === SpecialFarmStepType.STAKE
                if (isFinalStepComplete) {
                  const toastTitle = isStakeType ? t('Staked!') : t('Unstaked!')
                  toastSuccess(
                    toastTitle,
                    <ToastDescriptionWithTx txHash={destinationTxHash} txChainId={steps[pendingStep].chainId}>
                      {isStakeType
                        ? t('Your LP Token have been staked in the Farm!')
                        : t('Your LP Token have been unstaked in the Farm!')}
                    </ToastDescriptionWithTx>,
                  )
                } else if (status === FarmTransactionStatus.FAIL) {
                  const toastTitle = isStakeType ? t('Stake Error') : t('Unstake Error')
                  const errorText = isStakeType ? t('Token fail to stake.') : t('Token fail to unstake.')
                  toastError(
                    toastTitle,
                    <ToastDescriptionWithTx txHash={destinationTxHash} txChainId={steps[pendingStep].chainId}>
                      <Box>
                        <Text
                          as="span"
                          bold
                        >{`${transaction?.specialFarm?.amount} ${transaction?.specialFarm?.lpSymbol}`}</Text>
                        <Text as="span" ml="4px">
                          {errorText}
                        </Text>
                      </Box>
                    </ToastDescriptionWithTx>,
                  )
                }
              })
              .catch((error) => {
                console.error(`Failed to check harvest transaction hash: ${hash}`, error)
              })
          }
        }
      })
    },

    enabled: Boolean(chainId && specialFarmPendingTxns?.length),
    refetchInterval: FAST_INTERVAL,
    retryDelay: FAST_INTERVAL,

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  return null
}

export default Updater
