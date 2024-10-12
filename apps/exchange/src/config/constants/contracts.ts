import { multicalAddresses } from '@plexswap/multicall'
import { chiefFarmerCoreAddresses, specialVaultAddresses, chiefFarmerExtendedAddresses } from '@plexswap/farms'
import { WAYA_FLEXIBLE_VAULT, WAYA_VAULT } from '@plexswap/pools'
import { POOL_DEPLOYER_ADDRESSES, NFT_POSITION_MANAGER_ADDRESSES } from '@plexswap/sdk-extended'
import { EXTENDED_QUOTER_ADDRESSES } from '@plexswap/gateway-guardians'
import { ChainId } from '@plexswap/chains'

export default {
  chiefFarmer:   	      chiefFarmerCoreAddresses,
  chiefFarmerExtended:  chiefFarmerExtendedAddresses,  
  specialVault:  	      specialVaultAddresses,
  Multicall:     	      multicalAddresses,
  wayaVault:            WAYA_VAULT,
  wayaFlexibleVault:    WAYA_FLEXIBLE_VAULT,
  nftPositionManager:   NFT_POSITION_MANAGER_ADDRESSES,
  extendedPoolDeployer: POOL_DEPLOYER_ADDRESSES,
  FarmBooster: {
    [ChainId.BSC_TESTNET]: '0xe8eC0b12Db305E8A5431aC5cFb3daad2f1162AF9',
    [ChainId.BSC]:         '0x1A8B1dA52599E31B4BEC6240704F218be001eF84',
    [ChainId.PLEXCHAIN]:   '0xD65a0Da39A5CA112C7e6F1CaABeB5AE5433267D5'
  },
  FarmBoosterProxyFactory: {
    [ChainId.BSC_TESTNET]: '0xff440a6bE12d60c0f4e6827178eFAaF4044C4E69',
    [ChainId.BSC]:         '0x5D99aAa3838429c242142B8f00152714C88486a5',
    [ChainId.PLEXCHAIN]:   '0x8BacdA81F099CE817e683560CC571Cd9Cd026485'
  },
  // LOOKUP //
  chainlinkOracleBNB: {
    [ChainId.BSC]: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
    [ChainId.BSC_TESTNET]: '0x0',
  },
  // LOOKUP //
  chainlinkOracleWAYA: {
    [ChainId.BSC]:         '0xB6064eD41d4f67e353768aA239cA86f4F73665a1',
    [ChainId.BSC_TESTNET]: '0x0',
  },
  crossFarmingSender: {
    [ChainId.PLEXCHAIN]: '0x0',
  },
  crossFarmingReceiver: {
    [ChainId.BSC]:         '0x0',
    [ChainId.BSC_TESTNET]: '0x0',
  },
  stableSwapNativeHelper: {
    [ChainId.BSC]:         '0x0',
    [ChainId.BSC_TESTNET]: '0x0',
    [ChainId.PLEXCHAIN]:   '0x0',
  },
  // LOOKUP //
  voter: {
    [ChainId.BSC]:         '0x0',
    [ChainId.BSC_TESTNET]: '0x0',
  },
  // LOOKUP //
  mmLinkedPool: {
    [ChainId.PLEXCHAIN]:   '0x0',
    [ChainId.BSC]:         '0xfEACb05b373f1A08E68235bA7FC92636b92ced01',
  },
  extendedMigrator: {
    [ChainId.BSC]: '0x287EC2823FeC23f9CfFA5e3286E84F575FdF9072',
    [ChainId.BSC_TESTNET]: '0xBb95b7d728848e8401aE4dfEC03e997F98F47d15',
  },
  quoter: EXTENDED_QUOTER_ADDRESSES,

} as const satisfies Record<string, Record<number, `0x${string}`>>

