import { bsc } from 'viem/chains'

export const chainNameConverter = (name: string) => {
  switch (name) {
    case bsc.name:
      return 'BNB Chain'
    default:
      return name
  }
}
