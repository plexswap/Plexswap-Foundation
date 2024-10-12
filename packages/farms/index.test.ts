import { expect, test } from 'vitest'
import * as namedExports from './index'

test('exports', () => {
  expect(Object.keys(namedExports)).toMatchInlineSnapshot(`
    [
      "getFarmApr",
      "getPositionFarmApr",
      "getPositionFarmAprFactor",
      "isStableFarm",
      "deserializeFarm",
      "deserializeFarmUserData",
      "filterFarmsByQuoteToken",
      "filterFarmsByQuery",
      "coreFarmSupportedChainId",
      "allFarmSupportedChainId",
      "wayaSupportedChainId",
      "chiefFarmerCoreAddresses",
      "specialVaultAddresses",
      "nativeStableLpMap",
      "createFarmFetcher",
    ]
  `)
})
