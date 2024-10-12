/* eslint-disable address/addr-type */
import farms56 from '@plexswap/farms/config/bsc'
import farms1149 from '@plexswap/farms/config/plexchain'
import { SerializedFarm } from '@plexswap/farms'
import { Native } from '@plexswap/sdk-core'
import { getLpContract } from 'utils/contractHelpers'
import { describe, it } from 'vitest'

// Test only against the last 10 farms, for performance concern
const farmsToTest: [number, SerializedFarm, number][] = farms56
  .filter((farm) => farm.pid !== 0 && farm.pid !== null)
  .filter((farm) => !(farm as any).stableSwapAddress)
  .slice(0, 10)
  .map((farm) => [farm.pid, farm, 56])

const farms1149ToTest: [number, SerializedFarm, number][] = 
 farms1149.slice(0, 10).map((farm) => [farm.pid, farm, 1149])

const getDuplicates = (key: 'pid' | 'lpAddress') => {
  const farms = [...farms56, ...farms1149]
  const keys = farms.map((farm) => farm[key])
  return keys.filter((data) => keys.indexOf(data) !== keys.lastIndexOf(data))
}

describe.concurrent(
  'Config farms',
  () => {
    it('All farm has an unique pid', () => {
      const duplicates = getDuplicates('pid')
      expect(duplicates).toHaveLength(0)
    })

    it('All farm has an unique address', () => {
      const duplicates = getDuplicates('lpAddress')
      expect(duplicates).toHaveLength(0)
    })

    it.each([...farmsToTest, ...farms1149ToTest])(
      'Farm %d has the correct token addresses',
      async (pid, farm, chainId) => {
        const tokenAddress = farm.token.address
        const quoteTokenAddress = farm.quoteToken.address
        const lpContract = getLpContract(farm.lpAddress, chainId)

        const token0Address = (await lpContract.read.token0()).toLowerCase()
        const token1Address = (await lpContract.read.token1()).toLowerCase()

        expect(
          token0Address === tokenAddress.toLowerCase() || token0Address === quoteTokenAddress.toLowerCase(),
        ).toBeTruthy()
        expect(
          token1Address === tokenAddress.toLowerCase() || token1Address === quoteTokenAddress.toLowerCase(),
        ).toBeTruthy()
      },
    )

    it.each([...farmsToTest, ...farms1149ToTest])('Farm %d symbol should not be native symbol', (_, farm, chainId) => {
      const native = Native.onChain(chainId)
      expect(farm.quoteToken.symbol).not.toEqual(native.symbol)
      expect(farm.token.symbol).not.toEqual(native.symbol)
    })

    // The first pid using the new factory
    // BSC
    const START_PID = 1
    const FACTORY_ADDRESS = '0x580B12Fcc6247E7bA7a02324Ea6Aa6604d0BEC7A '
    const newFarmsToTest = farmsToTest.filter((farmSet) => farmSet[0] >= START_PID)

    it.each(newFarmsToTest)('farm %d is using correct factory address', async (pid, farm) => {
      const lpContract = getLpContract(farm.lpAddress)
      const factory = await lpContract.read.factory()
      expect(factory.toLowerCase()).toEqual(FACTORY_ADDRESS)
    })

  },
  { timeout: 50_000 },
)
