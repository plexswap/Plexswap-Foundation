import { gql } from 'graphql-request'
import { ChainId, testnetChainIds } from '@plexswap/chains'
import dayjs from 'dayjs'
import { getWayaContract } from 'utils/contractHelpers'
import { formatEther } from 'viem'
import { getWayaVaultAddress } from 'utils/addressHelpers'
import addresses from 'config/constants/contracts'
import { bitQueryServerClient } from 'utils/graphql'
import { CHAIN_IDS } from 'utils/wagmi'
import { chainIdToExplorerInfoChainName, explorerApiClient } from 'state/info/api/client'

// Values fetched from TheGraph and BitQuery jan 24, 2022
const txCount = 54780336
const addressCount = 4425459
const tvl = 6082955532.115718

const mainnetChainIds = CHAIN_IDS.filter((chainId) => {
  const isTestnet = testnetChainIds.some((testChainId) => {
    return testChainId.valueOf() === chainId
  })
  return Boolean(chainId && !isTestnet)
})

export const getTotalTvl = async () => {
  const results = {
    totalTx30Days: txCount,
    addressCount30Days: addressCount,
    tvl,
  }
  try {
    const days30Ago = dayjs().subtract(30, 'days')

    const usersQuery = gql`
      query userCount($since: ISO8601DateTime, $till: ISO8601DateTime) {
        ethereum: ethereum(network: ethereum) {
          dexTrades(
            exchangeName: { in: ["Plexswap", "Plexswap Core", "Plexswap"] }
            date: { since: $since, till: $till }
          ) {
            count(uniq: senders)
          }
        }
        bsc: ethereum(network: bsc) {
          dexTrades(
            exchangeName: { in: ["Plexswap", "Plexswap Core", "Plexswap"] }
            date: { since: $since, till: $till }
          ) {
            count(uniq: senders)
          }
        }
      }
    `

    if (process.env.BIT_QUERY_HEADER) {
      try {
        let querySuccess = false
        const queryResult = await bitQueryServerClient.request<any>(usersQuery, {
          since: days30Ago.toISOString(),
          till: new Date().toISOString(),
        })
        Object.keys(queryResult).forEach((key) => {
          if (!querySuccess) {
            results.addressCount30Days = queryResult[key].dexTrades[0].count
          } else {
            results.addressCount30Days += queryResult[key].dexTrades[0].count
          }
          querySuccess = true
        })
      } catch (error) {
        if (process.env.NODE_ENV === 'production') {
          console.error('Error when fetching address count', error)
        }
      }
    }

    const { totalTvl: coreTotalTvl, txCount30d: coreTxCount30d } = await getStats('core', mainnetChainIds)
    const { totalTvl: extendedTotalTvl, txCount30d: extendedTxCount30d } = await getStats('extended', mainnetChainIds)
    const { totalTvl: stableTotalTvl, txCount30d: stableTxCount30d } = await getStats('stable', [ChainId.BSC])

    const waya = await (await fetch('https://farms-api.plexfinance.us/price/waya')).json()
    const wayaVaultCore = getWayaVaultAddress()
    const wayaContract = getWayaContract()
    const totalWayaInVault = await wayaContract.read.balanceOf([wayaVaultCore])
    const totalWayaInVE = await wayaContract.read.balanceOf([addresses.voter[ChainId.BSC]])
    results.tvl =
      parseFloat(formatEther(totalWayaInVault)) * waya.price +
      parseFloat(formatEther(totalWayaInVE)) * waya.price +
      coreTotalTvl +
      extendedTotalTvl +
      stableTotalTvl

    results.totalTx30Days = coreTxCount30d + extendedTxCount30d + stableTxCount30d
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Error when fetching tvl stats', error)
    }
  }
  return results
}

type StatsRes = {
  tvlUSD: string
  txCount30d: number
}

const getStats = async (type: 'core' | 'extended' | 'stable', chainIds: number[]) => {
  const abortController = new AbortController()
  setTimeout(() => {
    abortController.abort()
  }, 10 * 1000)

  const rawResults = (
    await Promise.all(
      chainIds.map(async (chainId) => {
        let result: { data?: StatsRes } | undefined
        try {
          result = await explorerApiClient.GET('/cached/protocol/{protocol}/{chainName}/stats', {
            signal: abortController.signal,
            params: {
              path: {
                protocol: type,
                chainName: chainIdToExplorerInfoChainName[chainId],
              },
            },
          })
        } catch (error) {
          console.error(error)
          if (process.env.NODE_ENV === 'production') {
            console.error('Error when fetching tvl stats', error)
          }
        }
        return result
      }),
    )
  ).filter(Boolean)

  return {
    totalTvl: rawResults.reduce((acc, tvlString) => acc + parseFloat(tvlString?.data?.tvlUSD || '0'), 0),
    txCount30d: rawResults.reduce((acc, tvlString) => acc + (tvlString?.data?.txCount30d ?? 0), 0),
  }
}