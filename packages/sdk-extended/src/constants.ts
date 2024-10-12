import { ChainId } from '@plexswap/chains'
import { Address, Hash } from 'viem'
import { Percent } from '@plexswap/sdk-core'


/**
 * To compute Pool address use POOL_DEPLOYER_ADDRESSES instead
 */
export const FACTORY_ADDRESSES = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x9591443084ddfB99C5003C22451152Fe76371Bc1',
  [ChainId.BSC_TESTNET]: '0x842F3FaC9Ff0C0eC2c0e44043e9F05C43E5b268c',
 
} as const satisfies Record<ChainId, Address>

export const POOL_DEPLOYER_ADDRESSES = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x9685BDB0C1E56aBD780ec09EAeC3302242cE94C7',
  [ChainId.BSC_TESTNET]: '0x94CA49971C4Fc8c09B6FF7813dAe244B5DcaA665',
} as const satisfies Record<ChainId, Address>

export const NFT_POSITION_MANAGER_ADDRESSES = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0xA14435415E70041f66A68B98340ccF610be2C6b7',
  [ChainId.BSC_TESTNET]: '0x379FC5cEC3C8D094Bb46Ec1694D64751fcE61B38',
} as const satisfies Record<ChainId, Address>

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

const POOL_INIT_CODE_HASH = '0xab4858f2e818273de6bc2932c36ea31845ffed70dd5e0c4fd91c5bc03a2f9102'

export const POOL_INIT_CODE_HASHES = {
  [ChainId.PLEXCHAIN]: POOL_INIT_CODE_HASH,
  [ChainId.BSC]: POOL_INIT_CODE_HASH,
  [ChainId.BSC_TESTNET]: POOL_INIT_CODE_HASH,
} as const satisfies Record<ChainId, Hash>

/**
 * The default factory enabled fee amounts, denominated in hundredths of bips.
 */
export enum FeeAmount {
  LOWEST = 100,
  LOW = 500,
  MEDIUM = 2500,
  HIGH = 10000,
}

/**
 * The default factory tick spacings by fee amount.
 */
export const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
  [FeeAmount.LOWEST]: 1,
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 50,
  [FeeAmount.HIGH]: 200,
}

// constants used internally but not expected to be used externally
export const NEGATIVE_ONE = BigInt(-1)
export const ZERO = 0n
export const ONE = 1n

// used in liquidity amount math
export const Q96 = 2n ** 96n
export const Q192 = Q96 ** 2n

// used in fee calculation
export const MAX_FEE = 10n ** 6n
export const ONE_HUNDRED_PERCENT = new Percent('1')
export const ZERO_PERCENT = new Percent('0')
export const Q128 = 2n ** 128n