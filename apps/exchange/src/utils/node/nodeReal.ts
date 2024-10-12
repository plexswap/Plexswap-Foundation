import { ChainId } from '@plexswap/chains'

export const getNodeRealUrl = (chainId: number, key?: string) => {
  let host: string | null = null

  switch (chainId) {
    case ChainId.BSC:
      if (key) {
        host = `bsc-mainnet.nodereal.io/v1/${key}`
      }
      break
    default:
      host = null
  }

  if (!host) {
    return null
  }

  const url = `https://${host}`
  return url
}
