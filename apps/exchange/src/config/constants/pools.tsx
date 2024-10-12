import Trans from 'components/Trans'
import { VaultKey } from '@plexswap/pools'
import { bscTokens } from '@plexswap/tokens'

export const vaultPoolConfig = {
  [VaultKey.WayaVaultV1]: {
    name: <Trans>Auto WAYA</Trans>,
    description: <Trans>Automatic restaking</Trans>,
    autoCompoundFrequency: 5000,
    gasLimit: 380000n,
    tokenImage: {
      primarySrc: `https://metalists.plexfinance.us/images/bsc/${bscTokens.waya.address}.svg`,
      secondarySrc: `https://metalists.plexfinance.us/images/symbol/WayaToWaya.svg`,
    },
  },
  [VaultKey.WayaVault]: {
    name: <Trans>Stake WAYA</Trans>,
    description: <Trans>Stake, Earn – And more!</Trans>,
    autoCompoundFrequency: 5000,
    gasLimit: 1100000n,
    tokenImage: {
      primarySrc: `https://metalists.plexfinance.us/images/bsc/${bscTokens.waya.address}.svg`,
      secondarySrc: `https://metalists.plexfinance.us/images/symbol/WayaToWaya.svg`,
    },
  },
  [VaultKey.WayaFlexibleVault]: {
    name: <Trans>Flexible WAYA</Trans>,
    description: <Trans>Flexible staking on the side.</Trans>,
    autoCompoundFrequency: 5000,
    gasLimit: 500000n,
    tokenImage: {
      primarySrc: `https://metalists.plexfinance.us/images/bsc/${bscTokens.waya.address}.svg`,
      secondarySrc: `https://metalists.plexfinance.us/images/symbol/WayaToWaya.svg`,
    },
  },
} as const
