import { ChainId, getChainName } from '@plexswap/chains'
import { SerializedFarmConfig, SerializedFarmPublicData, isStableFarm, coreFarmSupportedChainId } from './../src'

let logged = false

export const mainFarmPID = 1            // Waya Farm

export const getFarmConfig = async (chainId?: ChainId) => {
  if (chainId && coreFarmSupportedChainId.includes(chainId as number)) {
    const chainName = getChainName(chainId)
    try {
      return (await import(`/${chainName}.ts`)).default.filter(
        (f: SerializedFarmPublicData) => f.pid !== null,
      ) as SerializedFarmPublicData[]
    } catch (error) {
      if (!logged) {
        console.error('Cannot get farm config', error, chainId, chainName)
        logged = true
      }
      return []
    }
  }
  return undefined
}

export const getStableConfig = async (chainId: ChainId) => {
  if (coreFarmSupportedChainId.includes(chainId as number)) {
    const chainName = getChainName(chainId)
    try {
      const farms = (await import(`/${chainName}.ts`)).default as SerializedFarmConfig[]

      return farms.filter(isStableFarm)
    } catch (error) {
      if (!logged) {
        console.error('Cannot get stable farm config', error, chainId, chainName)
        logged = true
      }
      return []
    }
  }
  return undefined
}