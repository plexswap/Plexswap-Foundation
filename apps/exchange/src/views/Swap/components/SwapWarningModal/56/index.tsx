import { ChainId } from '@plexswap/chains'
import SwapWarningTokens from 'config/constants/swapWarningTokens'
import SafemoonWarning from './SafemoonWarning'

const { safemoon, } =
  SwapWarningTokens[ChainId.BSC]

const BSC_WARNING_LIST = {
  [safemoon.address]: {
    symbol: safemoon.symbol,
    component: <SafemoonWarning />,
  },
}

export default BSC_WARNING_LIST
