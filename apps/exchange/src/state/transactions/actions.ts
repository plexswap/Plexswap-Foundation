import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@plexswap/chains'
import { Order } from '@gelatonetwork/limit-orders-lib'

export type TransactionType =
  | 'approve'
  | 'swap'
  | 'wrap'
  | 'add-liquidity'
  | 'increase-liquidity-extended'
  | 'add-liquidity-extended'
  | 'remove-liquidity-extended'
  | 'collect-fee'
  | 'remove-liquidity'
  | 'limit-order-submission'
  | 'limit-order-cancellation'
  | 'limit-order-approval'
  | 'non-bsc-farm'
  | 'migrate-extended'

export interface SerializableTransactionReceipt {
  to: string
  from: string
  contractAddress: string
  transactionIndex: number
  blockHash: string
  transactionHash: string
  blockNumber: number
  status?: number
}

export enum MsgStatus {
  MS_UNKNOWN = 0,
  MS_WAITING_FOR_SGN_CONFIRMATIONS = 1,
  MS_WAITING_FOR_DESTINATION_EXECUTION = 2,
  MS_COMPLETED = 3,
  MS_FAIL = 4,
  MS_FALLBACK = 5,
}

export enum FarmTransactionStatus {
  PENDING = -1,
  FAIL = 0,
  SUCCESS = 1,
}

export enum SpecialFarmStepType {
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
}

export interface SpecialFarmTransactionStep {
  step: number
  chainId: number
  status: FarmTransactionStatus
  tx: string
  isFirstTime?: boolean
  msgStatus?: MsgStatus
}

export interface SpecialFarmTransactionType {
  type: SpecialFarmStepType
  status: FarmTransactionStatus
  amount: string
  lpAddress: string
  lpSymbol: string
  steps: SpecialFarmTransactionStep[]
}

export const addTransaction = createAction<{
  chainId: ChainId
  hash: string
  from: string
  approval?: { tokenAddress: string; spender: string }
  claim?: { recipient: string }
  summary?: string
  translatableSummary?: { text: string; data?: Record<string, string | number | undefined> }
  type?: TransactionType
  order?: Order
  specialFarm?: SpecialFarmTransactionType
}>('transactions/addTransaction')
export const clearAllTransactions = createAction('transactions/clearAllTransactions')
export const clearAllChainTransactions = createAction<{ chainId: ChainId }>('transactions/clearAllChainTransactions')
export const finalizeTransaction = createAction<{
  chainId: ChainId
  hash: string
  receipt: SerializableTransactionReceipt
  specialFarm?: SpecialFarmTransactionType
}>('transactions/finalizeTransaction')
export const checkedTransaction = createAction<{
  chainId: ChainId
  hash: string
  blockNumber: number
}>('transactions/checkedTransaction')
