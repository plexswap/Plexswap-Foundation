import { Price, ERC20Token } from '@plexswap/sdk-core'
import getRatePercentageDifference from './getRatePercentageDifference'
import { getRatePercentageMessage, PercentageDirection } from './getRatePercentageMessage'

const WAYA = new ERC20Token(56, '0x32d9F70F6eF86718A51021ad269522Abf4CFFE49', 18, 'WAYA', 'PancakeSwap Token')
const BUSD = new ERC20Token(56, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'Binance USD')

const EIGHTEEN_DECIMALS = 10n ** 18n
const ONE = 1n * EIGHTEEN_DECIMALS
const FIVE = 5n * EIGHTEEN_DECIMALS
const SEVEN = 7n * EIGHTEEN_DECIMALS
const SEVEN_HUNDRED = 700n * EIGHTEEN_DECIMALS
const ELEVEN = 11n * EIGHTEEN_DECIMALS

const ONE_BUSD_PER_WAYA = new Price(WAYA, BUSD, EIGHTEEN_DECIMALS, ONE)
const FIVE_BUSD_PER_WAYA = new Price(WAYA, BUSD, EIGHTEEN_DECIMALS, FIVE)
const SEVEN_BUSD_PER_WAYA = new Price(WAYA, BUSD, EIGHTEEN_DECIMALS, SEVEN)
const ELEVEN_BUSD_PER_WAYA = new Price(WAYA, BUSD, EIGHTEEN_DECIMALS, ELEVEN)
const SEVEN_HUNDRED_BUSD_PER_WAYA = new Price(WAYA, BUSD, EIGHTEEN_DECIMALS, SEVEN_HUNDRED)

const mockT = (key: string, data?: { percentage?: string }) => {
  return key.includes('%percentage%') && data?.percentage ? key.replace('%percentage%', data.percentage) : key
}

describe('limitOrders/utils/getRatePercentageMessage', () => {
  describe.each([
    [
      getRatePercentageDifference(SEVEN_BUSD_PER_WAYA, ELEVEN_BUSD_PER_WAYA),
      ['57.14% above market', PercentageDirection.ABOVE],
    ],
    [
      getRatePercentageDifference(SEVEN_BUSD_PER_WAYA, FIVE_BUSD_PER_WAYA),
      ['-28.57% below market', PercentageDirection.BELOW],
    ],
    [
      getRatePercentageDifference(SEVEN_BUSD_PER_WAYA, SEVEN_HUNDRED_BUSD_PER_WAYA),
      ['9,900% above market', PercentageDirection.ABOVE],
    ],
    [
      getRatePercentageDifference(SEVEN_BUSD_PER_WAYA, ONE_BUSD_PER_WAYA),
      ['-85.71% below market', PercentageDirection.BELOW],
    ],
    [
      getRatePercentageDifference(SEVEN_BUSD_PER_WAYA, SEVEN_BUSD_PER_WAYA),
      ['at market price', PercentageDirection.MARKET],
    ],
  ])('returns correct message and direction', (percent, expected) => {
    it(`for ${percent?.toSignificant(6)} Percent`, () => {
      const [message, direction] = getRatePercentageMessage(mockT, percent)
      expect(message).toBe(expected[0])
      expect(direction).toBe(expected[1])
    })
  })
})