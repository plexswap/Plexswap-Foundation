import { ChainId } from '@plexswap/chains'
import { Currency, Pair } from '@plexswap/sdk-core'
import { BestTradeOptions as BaseBestTradeOptions } from '@plexswap/sdk-extended'
import { PublicClient } from 'viem'

export type Provider = ({ chainId }: { chainId?: ChainId }) => PublicClient

export interface BestTradeOptions extends BaseBestTradeOptions {
  provider: Provider

  // If not provided, will use the given provider to fetch pairs on chain
  allCommonPairs?: Pair[] | ((one: Currency, another: Currency) => Promise<Pair[]> | Pair[])
}

export enum RouteType {
  CORE,
  EXTENDED,
  STABLE,
  MIXED,
}