import { ChainId } from '@plexswap/chains'
import { CorePool, ExtendedPool, PoolType, SmartRouter, SmartRouterTrade } from './../../Ananke'
import {
    CurrencyAmount,
    ERC20Token,
    Ether,
    Pair,
    Percent,
    TradeType,
    Route as V2Route,
    Trade as CoreTrade,
} from '@plexswap/sdk-core'
import { Route as ExtendedRoute, Trade as ExtendedTrade, Pool } from '@plexswap/sdk-extended'
import { Address, isHex, parseEther, parseUnits, stringify } from 'viem'
import { beforeEach, describe, expect, it } from 'vitest'
import { EvolusRouter, ROUTER_AS_RECIPIENT } from './'
import { CONTRACT_BALANCE, SENDER_AS_RECIPIENT } from '../constants'
import { Permit2Signature, PlexswapOptions } from '../entities/types'
import { CommandType } from '../utils/routerCommands'
import { convertPoolToExtendedPool, fixtureAddresses, getStablePool } from './fixtures/address'
import { getPublicClient } from './fixtures/clients'
import { buildExtendedTrade, buildMixedRouteTrade, buildStableTrade, buildCoreTrade } from './utils/buildTrade'
import { decodeUniversalCalldata } from './utils/calldataDecode'
import { makePermit } from './utils/permit'

const TEST_RECIPIENT_ADDRESS = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa' as const
const TEST_FEE_RECIPIENT_ADDRESS = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' as const
const PERMIT2_SIG =
  '0x92ff2b035c8005213bd910849532da0f4adde9e35393c8ed4872db90eef2c153492dec30a70476e98f21d28398396669fbef6f9785c903ef83810673ec96fc8d1b'

const swapOptions = (options: Partial<PlexswapOptions>): PlexswapOptions => {
  let slippageTolerance = new Percent(5, 100)
  if (options.fee) slippageTolerance = slippageTolerance.add(options.fee.fee)
  return {
    slippageTolerance,
    ...options,
  }
}

const TEST_FEE = 500n

const feeOptions = {
  recipient: TEST_FEE_RECIPIENT_ADDRESS,
  fee: new Percent(TEST_FEE, 10000n),
}

describe('Plexswap Evolus Router Trade', () => {
  const chainId = ChainId.ETHEREUM
  const liquidity = parseEther('1000')

  let ETHER: Ether
  let USDC: ERC20Token
  let USDT: ERC20Token
  let WETH_USDC_V2: Pair
  let USDC_USDT_V2: Pair
  let WETH_USDC_EXTENDED_MEDIUM: Pool
  let WETH_USDC_EXTENDED_LOW: Pool
  let USDC_USDT_EXTENDED_LOW: Pool
  let UNIVERSAL_ROUTER: Address

  expect.addSnapshotSerializer({
    serialize(val) {
      return stringify(decodeUniversalCalldata(val), null, 2)
    },
    test(val) {
      return val && isHex(val)
    },
  })

  beforeEach(async () => {
    ;({
      UNIVERSAL_ROUTER,
      ETHER,
      USDC,
      USDT,
      WETH_USDC_V2,
      USDC_USDT_V2,
      USDC_USDT_EXTENDED_LOW,
      WETH_USDC_EXTENDED_LOW,
      WETH_USDC_EXTENDED_MEDIUM,
    } = await fixtureAddresses(chainId, liquidity))
  })

  describe('v2', () => {
    it('should encode a single exactInput ETH->USDC Swap, without fee, without recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })
    it('should encode a single exactInput ETH->USDC Swap, without fee, with recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({
        recipient: TEST_RECIPIENT_ADDRESS,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(TEST_RECIPIENT_ADDRESS)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })
    it('should encode a single exactInput ETH->USDC Swap, with fee, without recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])

      const options = swapOptions({
        fee: feeOptions,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(4)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual('PAY_PORTION')
      expect(decodedCommands[2].args[0].name).toEqual('token')
      expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[2].args[1].name).toEqual('recipient')
      expect(decodedCommands[2].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[2].args[2].name).toEqual('bips')
      expect(decodedCommands[2].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[3].command).toEqual('SWEEP')
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toBeGreaterThan(0n)
    })
    it('should encode a single exactInput ETH->USDC Swap, with fee, with recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({
        fee: feeOptions,
        recipient: TEST_RECIPIENT_ADDRESS,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(4)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.PAY_PORTION])
      expect(decodedCommands[2].args[0].name).toEqual('token')
      expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[2].args[1].name).toEqual('recipient')
      expect(decodedCommands[2].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[2].args[2].name).toEqual('bips')
      expect(decodedCommands[2].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[3].command).toEqual(CommandType[CommandType.SWEEP])
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(TEST_RECIPIENT_ADDRESS)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toBeGreaterThan(0n)
    })

    it('should encode a exactInput ETH->USDC->USDT Swap, without fee, without recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2, USDC_USDT_V2], ETHER, USDT),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePools: CorePool[] = [
        {
          type: PoolType.CORE,
          reserve0: WETH_USDC_V2.reserve0,
          reserve1: WETH_USDC_V2.reserve1,
        },
        {
          type: PoolType.CORE,
          reserve0: USDC_USDT_V2.reserve0,
          reserve1: USDC_USDT_V2.reserve1,
        },
      ]
      const trade = buildCoreTrade(coreTrade, corePools)
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })
    it('should encode a exactInput ETH->USDC->USDT Swap, with fee, without recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2, USDC_USDT_V2], ETHER, USDT),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePools: CorePool[] = [
        {
          type: PoolType.CORE,
          reserve0: WETH_USDC_V2.reserve0,
          reserve1: WETH_USDC_V2.reserve1,
        },
        {
          type: PoolType.CORE,
          reserve0: USDC_USDT_V2.reserve0,
          reserve1: USDC_USDT_V2.reserve1,
        },
      ]
      const trade = buildCoreTrade(coreTrade, corePools)
      const options = swapOptions({ fee: feeOptions })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(4)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.PAY_PORTION])
      expect(decodedCommands[2].args[0].name).toEqual('token')
      expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[2].args[1].name).toEqual('recipient')
      expect(decodedCommands[2].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[2].args[2].name).toEqual('bips')
      expect(decodedCommands[2].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[3].command).toEqual(CommandType[CommandType.SWEEP])
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toBeGreaterThan(0n)
    })
    it('should encode a exactInput ETH->USDC->USDT Swap, without fee, with recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2, USDC_USDT_V2], ETHER, USDT),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePools: CorePool[] = [
        {
          type: PoolType.CORE,
          reserve0: WETH_USDC_V2.reserve0,
          reserve1: WETH_USDC_V2.reserve1,
        },
        {
          type: PoolType.CORE,
          reserve0: USDC_USDT_V2.reserve0,
          reserve1: USDC_USDT_V2.reserve1,
        },
      ]
      const trade = buildCoreTrade(coreTrade, corePools)
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })
    it('should encode a exactInput ETH->USDC->USDT Swap, with fee, with recipient', async () => {
      const amountIn = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2, USDC_USDT_V2], ETHER, USDT),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePools: CorePool[] = [
        {
          type: PoolType.CORE,
          reserve0: WETH_USDC_V2.reserve0,
          reserve1: WETH_USDC_V2.reserve1,
        },
        {
          type: PoolType.CORE,
          reserve0: USDC_USDT_V2.reserve0,
          reserve1: USDC_USDT_V2.reserve1,
        },
      ]
      const trade = buildCoreTrade(coreTrade, corePools)
      const options = swapOptions({ fee: feeOptions, recipient: TEST_RECIPIENT_ADDRESS })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(4)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.PAY_PORTION])
      expect(decodedCommands[2].args[0].name).toEqual('token')
      expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[2].args[1].name).toEqual('recipient')
      expect(decodedCommands[2].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[2].args[2].name).toEqual('bips')
      expect(decodedCommands[2].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[3].command).toEqual(CommandType[CommandType.SWEEP])
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(TEST_RECIPIENT_ADDRESS)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toBeGreaterThan(0n)
    })

    it('should encode a single exactInput USDC->ETH Swap', async () => {
      const amountIn = parseUnits('1000', 6)
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
    it('should encode a single exactInput USDC->ETH Swap, with fee', async () => {
      const amountIn = parseUnits('1000', 6)
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({
        fee: feeOptions,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.PAY_PORTION])
      expect(decodedCommands[1].args[0].name).toEqual('token')
      expect(decodedCommands[1].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[1].args[1].name).toEqual('recipient')
      expect(decodedCommands[1].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[1].args[2].name).toEqual('bips')
      expect(decodedCommands[1].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
    it('should encode a single exactInput USDC->ETH Swap, with recipient', async () => {
      const amountIn = parseUnits('1000', 6)
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({
        recipient: TEST_RECIPIENT_ADDRESS,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(TEST_RECIPIENT_ADDRESS)
    })
    it('should encode a single exactInput USDC->ETH Swap, with fee, with recipient', async () => {
      const amountIn = parseUnits('1000', 6)
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({
        recipient: TEST_RECIPIENT_ADDRESS,
        fee: feeOptions,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.PAY_PORTION])
      expect(decodedCommands[1].args[0].name).toEqual('token')
      expect(decodedCommands[1].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[1].args[1].name).toEqual('recipient')
      expect(decodedCommands[1].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[1].args[2].name).toEqual('bips')
      expect(decodedCommands[1].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(TEST_RECIPIENT_ADDRESS)
    })

    it('should encode a single exactInput USDC->ETH swap, with permit2', async () => {
      const amountIn = parseUnits('1000', 6)
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])

      const permit = makePermit(USDC.address, UNIVERSAL_ROUTER)

      const permit2Permit: Permit2Signature = {
        ...permit,
        signature: PERMIT2_SIG,
      }

      const options = swapOptions({
        inputTokenPermit: permit2Permit,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.PERMIT2_PERMIT])

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(true)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })

    it('should encode a single exactInput USDC->ETH swap, with EIP-2098 permit', async () => {
      const amountIn = parseUnits('1000', 6)
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])

      const permit = makePermit(USDC.address, UNIVERSAL_ROUTER)

      const permit2Permit: Permit2Signature = {
        ...permit,
        signature:
          '0x92ff2b035c8005213bd910849532da0f4adde9e35393c8ed4872db90eef2c153492dec30a70476e98f21d28398396669fbef6f9785c903ef83810673ec96fc8d',
      }

      const options = swapOptions({
        inputTokenPermit: permit2Permit,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.PERMIT2_PERMIT])

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(true)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })

    it('should encode exactInput USDT->USDC->ETH swap', async () => {
      const amountIn = parseUnits('1000', 6)
      const coreTrade = new CoreTrade(
        new V2Route([USDC_USDT_V2, WETH_USDC_V2], USDT, ETHER),
        CurrencyAmount.fromRawAmount(USDT, amountIn),
        TradeType.EXACT_INPUT,
      )
      const corePools: CorePool[] = [
        {
          type: PoolType.CORE,
          reserve0: USDC_USDT_V2.reserve0,
          reserve1: USDC_USDT_V2.reserve1,
        },
        {
          type: PoolType.CORE,
          reserve0: WETH_USDC_V2.reserve0,
          reserve1: WETH_USDC_V2.reserve1,
        },
      ]
      const trade = buildCoreTrade(coreTrade, corePools)
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(coreTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[3].name).toEqual('path')
      expect((decodedCommands[0].args[3].value as string[]).length).toEqual(3)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })

    it('should encode exactOutput ETH->USDC swap', async () => {
      const amountOut = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(USDC, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).not.toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_OUT])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountOut')
      expect(decodedCommands[1].args[1].value).toEqual(amountOut)
      expect(decodedCommands[1].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountMin')
      expect(decodedCommands[2].args[1].value).toEqual(0n)
    })

    it('should encode exactOutput ETH->USDC swap, with fee', async () => {
      const amountOut = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(USDC, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({
        fee: feeOptions,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).not.toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(5)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_OUT])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountOut')
      expect(decodedCommands[1].args[1].value).toEqual(amountOut)
      expect(decodedCommands[1].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual('PAY_PORTION')
      expect(decodedCommands[2].args[0].name).toEqual('token')
      expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[2].args[1].name).toEqual('recipient')
      expect(decodedCommands[2].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[2].args[2].name).toEqual('bips')
      expect(decodedCommands[2].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[3].command).toEqual('SWEEP')
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toBeGreaterThan(0n)

      expect(decodedCommands[4].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[4].args[0].name).toEqual('recipient')
      expect(decodedCommands[4].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[4].args[1].name).toEqual('amountMin')
      expect(decodedCommands[4].args[1].value).toEqual(0n)
    })
    it('should encode exactOutput ETH->USDC swap, with fee, with recipient', async () => {
      const amountOut = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(USDC, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({
        fee: feeOptions,
        recipient: TEST_RECIPIENT_ADDRESS,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).not.toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(5)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_OUT])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountOut')
      expect(decodedCommands[1].args[1].value).toEqual(amountOut)
      expect(decodedCommands[1].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[1].args[2].value).toEqual(coreTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual('PAY_PORTION')
      expect(decodedCommands[2].args[0].name).toEqual('token')
      expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[2].args[1].name).toEqual('recipient')
      expect(decodedCommands[2].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[2].args[2].name).toEqual('bips')
      expect(decodedCommands[2].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[3].command).toEqual('SWEEP')
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(TEST_RECIPIENT_ADDRESS)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toBeGreaterThan(0n)

      expect(decodedCommands[4].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[4].args[0].name).toEqual('recipient')
      expect(decodedCommands[4].args[0].value).toEqual(TEST_RECIPIENT_ADDRESS)
      expect(decodedCommands[4].args[1].name).toEqual('amountMin')
      expect(decodedCommands[4].args[1].value).toEqual(0n)
    })

    it('should encode exactOutput USDC-ETH swap', async () => {
      const amountOut = parseEther('1')
      const coreTrade = new CoreTrade(
        new V2Route([WETH_USDC_V2], USDC, ETHER),
        CurrencyAmount.fromRawAmount(ETHER, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const corePool: CorePool = {
        type: PoolType.CORE,
        reserve0: WETH_USDC_V2.reserve0,
        reserve1: WETH_USDC_V2.reserve1,
      }
      const trade = buildCoreTrade(coreTrade, [corePool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_OUT])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountOut')
      expect(decodedCommands[0].args[1].value).toEqual(amountOut)
      expect(decodedCommands[0].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[0].args[2].value).toEqual(coreTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
  })

  describe('extended', () => {
    it('should encode a single exactInput ETH->USDC swap', async () => {
      const amountIn = parseEther('1')
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedPool: ExtendedPool = convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)

      const trade = buildExtendedTrade(extendedTrade, [extendedPool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(extendedTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })

    it('should encode a single exactInput ETH->USDC swap, with a fee', async () => {
      const amountIn = parseEther('1')
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedPool: ExtendedPool = convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)

      const trade = buildExtendedTrade(extendedTrade, [extendedPool])
      const options = swapOptions({
        fee: feeOptions,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(4)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(extendedTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual('PAY_PORTION')
      expect(decodedCommands[2].args[0].name).toEqual('token')
      expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[2].args[1].name).toEqual('recipient')
      expect(decodedCommands[2].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[2].args[2].name).toEqual('bips')
      expect(decodedCommands[2].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[3].command).toEqual('SWEEP')
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toBeGreaterThan(0n)
    })

    it('should encode a single exactInput USDC->ETH swap', async () => {
      const amountIn = parseUnits('1000', 6)
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedPool: ExtendedPool = convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)

      const trade = buildExtendedTrade(extendedTrade, [extendedPool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(extendedTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
    it('should encode a single exactInput USDC->ETH swap, with a fee', async () => {
      const amountIn = parseUnits('1000', 6)
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedPool: ExtendedPool = convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)
      const trade = buildExtendedTrade(extendedTrade, [extendedPool])

      const options = swapOptions({
        fee: feeOptions,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(extendedTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.PAY_PORTION])
      expect(decodedCommands[1].args[0].name).toEqual('token')
      expect(decodedCommands[1].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[1].args[1].name).toEqual('recipient')
      expect(decodedCommands[1].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
      expect(decodedCommands[1].args[2].name).toEqual('bips')
      expect(decodedCommands[1].args[2].value).toEqual(TEST_FEE)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
    it('should encode a single exactInput USDC->ETH swap, with permit2', async () => {
      const amountIn = parseUnits('1000', 6)
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], USDC, ETHER),
        CurrencyAmount.fromRawAmount(USDC, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedPool: ExtendedPool = convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)

      const trade = buildExtendedTrade(extendedTrade, [extendedPool])

      const permit = makePermit(USDC.address, UNIVERSAL_ROUTER)

      const permit2Permit: Permit2Signature = {
        ...permit,
        signature: PERMIT2_SIG,
      }
      const options = swapOptions({
        inputTokenPermit: permit2Permit,
      })

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.PERMIT2_PERMIT])

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(extendedTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(true)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })

    it('should encode a exactInput ETH->USDC->USDT swap', async () => {
      const amountIn = parseEther('1')
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM, USDC_USDT_EXTENDED_LOW], ETHER, USDT),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedPool: ExtendedPool[] = [convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM), convertPoolToExtendedPool(USDC_USDT_EXTENDED_LOW)]

      const trade = buildExtendedTrade(extendedTrade, extendedPool)
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(extendedTrade.minimumAmountOut(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })
    it('should encode a single exactOutput ETH->USDC swap', async () => {
      const amountOut = parseUnits('1000', 6)
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], ETHER, USDC),
        CurrencyAmount.fromRawAmount(USDC, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const extendedPool: ExtendedPool = convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)

      const trade = buildExtendedTrade(extendedTrade, [extendedPool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).not.toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_OUT])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountOut')
      expect(decodedCommands[1].args[1].value).toEqual(amountOut)
      expect(decodedCommands[1].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[1].args[2].value).toEqual(extendedTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountMin')
      expect(decodedCommands[2].args[1].value).toEqual(0n)
    })
    it('should encode a single exactOutput USDC->ETH swap', async () => {
      const amountOut = parseEther('1')
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], USDC, ETHER),
        CurrencyAmount.fromRawAmount(ETHER, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const extendedPool: ExtendedPool = convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)

      const trade = buildExtendedTrade(extendedTrade, [extendedPool])
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_OUT])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountOut')
      expect(decodedCommands[0].args[1].value).toEqual(amountOut)
      expect(decodedCommands[0].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[0].args[2].value).toEqual(extendedTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
    it('should encode a exactOutput ETH->USDC->USDT swap', async () => {
      const amountOut = parseUnits('1000', 6)
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM, USDC_USDT_EXTENDED_LOW], ETHER, USDT),
        CurrencyAmount.fromRawAmount(USDT, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const extendedPool: ExtendedPool[] = [convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM), convertPoolToExtendedPool(USDC_USDT_EXTENDED_LOW)]

      const trade = buildExtendedTrade(extendedTrade, extendedPool)
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).not.toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_OUT])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountOut')
      expect(decodedCommands[1].args[1].value).toEqual(amountOut)
      expect(decodedCommands[1].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[1].args[2].value).toEqual(extendedTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountMin')
      expect(decodedCommands[2].args[1].value).toEqual(0n)
    })
    it('should encode a exactOutput USDT->USDC->ETH swap', async () => {
      const amountOut = parseEther('1')
      const extendedTrade = await ExtendedTrade.fromRoute(
        new ExtendedRoute([USDC_USDT_EXTENDED_LOW, WETH_USDC_EXTENDED_MEDIUM], USDT, ETHER),
        CurrencyAmount.fromRawAmount(ETHER, amountOut),
        TradeType.EXACT_OUTPUT,
      )
      const extendedPool: ExtendedPool[] = [convertPoolToExtendedPool(USDC_USDT_EXTENDED_LOW), convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)]

      const trade = buildExtendedTrade(extendedTrade, extendedPool)
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_OUT])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountOut')
      expect(decodedCommands[0].args[1].value).toEqual(amountOut)
      expect(decodedCommands[0].args[2].name).toEqual('amountInMax')
      expect(decodedCommands[0].args[2].value).toEqual(extendedTrade.maximumAmountIn(options.slippageTolerance).quotient)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
  })
  describe('mixed', () => {
    it('should encodes a mixed exactInput ETH-extended->USDC-v2->USDT swap', async () => {
      const amountIn = parseEther('1')

      const trade = await buildMixedRouteTrade(
        ETHER,
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
        [WETH_USDC_EXTENDED_MEDIUM, USDC_USDT_V2],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(USDC_USDT_V2.liquidityToken.address)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(0n)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountIn')
      expect(decodedCommands[2].args[1].value).toEqual(CONTRACT_BALANCE)
      expect(decodedCommands[2].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[2].args[2].value).toBeGreaterThanOrEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[2].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[2].args[4].value).toEqual(false)
    })

    it('should encodes a mixed exactInput ETH-v2->USDC-extended->USDT swap', async () => {
      const amountIn = parseEther('1')

      const trade = await buildMixedRouteTrade(
        ETHER,
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
        [WETH_USDC_V2, USDC_USDT_EXTENDED_LOW],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      // v2 support address aliases, no need to assigned to extended pool address
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(0n)
      expect(decodedCommands[1].args[3].name).toEqual('path')
      expect((decodedCommands[1].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountIn')
      expect(decodedCommands[2].args[1].value).toEqual(CONTRACT_BALANCE)
      expect(decodedCommands[2].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[2].args[2].value).toBeGreaterThanOrEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[2].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[2].args[4].value).toEqual(false)
    })

    it('should encodes a mixed exactInput ETH-v2->USDC-v2->USDT swap', async () => {
      const amountIn = parseEther('1')

      const trade = await buildMixedRouteTrade(
        ETHER,
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
        [WETH_USDC_V2, USDC_USDT_V2],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toBeGreaterThanOrEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[3].name).toEqual('path')
      expect((decodedCommands[1].args[3].value as string[]).length).toEqual(3)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })

    it('should encodes a mixed exactInput ETH-extended->USDC-extended->USDT swap', async () => {
      const amountIn = parseEther('1')

      const trade = await buildMixedRouteTrade(
        ETHER,
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
        [WETH_USDC_EXTENDED_MEDIUM, USDC_USDT_EXTENDED_LOW],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(2)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)
    })

    it('should encodes a mixed exactInput USDT-v2->USDC-extended->ETH swap', async () => {
      const amountIn = parseUnits('1000', 6)

      const trade = await buildMixedRouteTrade(
        USDT,
        CurrencyAmount.fromRawAmount(USDT, amountIn),
        TradeType.EXACT_INPUT,
        [USDC_USDT_V2, WETH_USDC_EXTENDED_MEDIUM],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      // v2 support address aliases, no need to assigned to extended pool address
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(0n)
      expect(decodedCommands[0].args[3].name).toEqual('path')
      expect((decodedCommands[0].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[0].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(CONTRACT_BALANCE)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toBeGreaterThanOrEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
  })
  describe('multi-route', () => {
    it('should encode a split exactInput with 2 routes: v2 ETH-USDC & extended ETH-USDC', async () => {
      const amountIn = parseEther('1')
      const v2TradeRoute = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const coreTrade = buildCoreTrade(v2TradeRoute, [
        {
          type: PoolType.CORE,
          reserve0: WETH_USDC_V2.reserve0,
          reserve1: WETH_USDC_V2.reserve1,
        },
      ])
      const extendedTradeRoute = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedTrade = buildExtendedTrade(extendedTradeRoute, [convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)])

      coreTrade.routes[0].percent = 50
      extendedTrade.routes[0].percent = 50

      const options = swapOptions({})
      const trade: SmartRouterTrade<TradeType.EXACT_INPUT> = {
        tradeType: TradeType.EXACT_INPUT,
        inputAmount: CurrencyAmount.fromRawAmount(ETHER, amountIn * 2n),
        outputAmount: CurrencyAmount.fromRawAmount(USDC, amountIn),
        routes: [...coreTrade.routes, ...extendedTrade.routes],
        gasEstimate: 0n,
        gasEstimateInUSD: CurrencyAmount.fromRawAmount(ETHER, amountIn),
      }

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)
      expect(BigInt(value)).toEqual(amountIn * 2n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      // v2 support address aliases, no need to assigned to extended pool address
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(
        v2TradeRoute.minimumAmountOut(options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[3].name).toEqual('path')
      expect((decodedCommands[1].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountIn')
      expect(decodedCommands[2].args[1].value).toEqual(amountIn)
      expect(decodedCommands[2].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[2].args[2].value).toEqual(
        extendedTradeRoute.minimumAmountOut(options.slippageTolerance).quotient,
      )
      expect(decodedCommands[2].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[2].args[4].value).toEqual(false)
    })

    it('should encode a split exactInput with 3 routes: v2 ETH-USDC & extended ETH-USDC & extended ETH-USDC', async () => {
      const amountIn = parseEther('2')
      const v2TradeRoute = new CoreTrade(
        new V2Route([WETH_USDC_V2], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, (amountIn * 5000n) / 10000n),
        TradeType.EXACT_INPUT,
      )
      const coreTrade = buildCoreTrade(v2TradeRoute, [
        {
          type: PoolType.CORE,
          reserve0: WETH_USDC_V2.reserve0,
          reserve1: WETH_USDC_V2.reserve1,
        },
      ])
      const extendedTradeRoute = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_MEDIUM], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, (amountIn * 2500n) / 10000n),
        // CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedTrade = buildExtendedTrade(extendedTradeRoute, [convertPoolToExtendedPool(WETH_USDC_EXTENDED_MEDIUM)])

      const extendedTradeRoute2 = await ExtendedTrade.fromRoute(
        new ExtendedRoute([WETH_USDC_EXTENDED_LOW], ETHER, USDC),
        CurrencyAmount.fromRawAmount(ETHER, (amountIn * 2500n) / 10000n),
        // CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedTrade2 = buildExtendedTrade(extendedTradeRoute2, [convertPoolToExtendedPool(WETH_USDC_EXTENDED_LOW)])

      coreTrade.routes[0].percent = 50
      extendedTrade.routes[0].percent = 25
      extendedTrade2.routes[0].percent = 25

      const options = swapOptions({})
      const routes = [...coreTrade.routes, ...extendedTrade.routes, ...extendedTrade2.routes]
      const trade: SmartRouterTrade<TradeType.EXACT_INPUT> = {
        tradeType: TradeType.EXACT_INPUT,
        inputAmount: CurrencyAmount.fromRawAmount(ETHER, amountIn),
        outputAmount: CurrencyAmount.fromRawAmount(
          USDC,
          routes.reduce((acc, r) => acc + r.outputAmount.quotient, 0n),
        ),
        routes,
        gasEstimate: 0n,
        gasEstimateInUSD: CurrencyAmount.fromRawAmount(ETHER, amountIn),
      }

      // FIXME: a valid trade should have the correct output amounts
      expect(trade.routes.reduce((acc, r) => acc + r.outputAmount.quotient, 0n)).toEqual(trade.outputAmount.quotient)

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)
      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(5)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      // v2 support address aliases, no need to assigned to extended pool address
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(v2TradeRoute.inputAmount.quotient)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(
        v2TradeRoute.minimumAmountOut(options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[3].name).toEqual('path')
      expect((decodedCommands[1].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountIn')
      expect(decodedCommands[2].args[1].value).toEqual(extendedTradeRoute.inputAmount.quotient)
      expect(decodedCommands[2].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[2].args[2].value).toEqual(
        extendedTradeRoute.minimumAmountOut(options.slippageTolerance).quotient,
      )
      expect(decodedCommands[2].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[2].args[4].value).toEqual(false)

      expect(decodedCommands[3].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[3].args[0].name).toEqual('recipient')
      expect(decodedCommands[3].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[3].args[1].name).toEqual('amountIn')
      expect(decodedCommands[3].args[1].value).toEqual(extendedTradeRoute2.inputAmount.quotient)
      expect(decodedCommands[3].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[3].args[2].value).toEqual(
        extendedTradeRoute2.minimumAmountOut(options.slippageTolerance).quotient,
      )
      expect(decodedCommands[3].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[3].args[4].value).toEqual(false)

      expect(decodedCommands[4].command).toEqual('SWEEP')
      expect(decodedCommands[4].args[0].name).toEqual('token')
      expect(decodedCommands[4].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[4].args[1].name).toEqual('recipient')
      expect(decodedCommands[4].args[1].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[4].args[2].name).toEqual('amountMin')
      expect(decodedCommands[4].args[2].value).toBeGreaterThan(0n)
    })
  })
})

describe('Plexswap StableSwap Through Evolus Router, BSC Network Only', () => {
  const chainId = ChainId.BSC
  const liquidity = parseEther('1000')

  let ETHER: Ether
  let USDC: ERC20Token
  let USDT: ERC20Token
  let BUSD: ERC20Token
  let USDC_USDT_V2: Pair
  let WBNB_USDC_V2: Pair
  let USDC_USDT_EXTENDED_LOW: Pool
  let WETH_USDC_V2: Pair
  let WETH_USDC_EXTENDED_MEDIUM: Pool
  let WBNB_USDC_EXTENDED_MEDIUM: Pool
  let UNIVERSAL_ROUTER: Address

  beforeEach(async () => {
    ;({
      UNIVERSAL_ROUTER,
      USDC,
      USDT,
      BUSD,
      ETHER,
      WETH_USDC_V2,
      WBNB_USDC_V2,
      WETH_USDC_EXTENDED_MEDIUM,
      WBNB_USDC_EXTENDED_MEDIUM,
      USDC_USDT_V2,
      USDC_USDT_EXTENDED_LOW,
    } = await fixtureAddresses(chainId, liquidity))
  })

  describe('mixed', () => {
    it('should encodes a mixed exactInput USDT-stable->USDC-extended->BNB swap', async () => {
      const amountIn = parseUnits('1000', 6)

      const stablePool = await getStablePool(USDT, USDC, getPublicClient, liquidity)

      const trade = await buildMixedRouteTrade(
        USDT,
        CurrencyAmount.fromRawAmount(USDT, amountIn),
        TradeType.EXACT_INPUT,
        [stablePool, WBNB_USDC_EXTENDED_MEDIUM],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(0n)
      expect(decodedCommands[0].args[3].name).toEqual('path')
      expect((decodedCommands[0].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[0].args[5].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[5].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(CONTRACT_BALANCE)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toBeGreaterThanOrEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
    it('should encodes a mixed exactInput USDT-stable->USDC-v2->BNB swap', async () => {
      const amountIn = parseUnits('1000', 6)

      const stablePool = await getStablePool(USDT, USDC, getPublicClient, liquidity)

      const trade = await buildMixedRouteTrade(
        USDT,
        CurrencyAmount.fromRawAmount(USDT, amountIn),
        TradeType.EXACT_INPUT,
        [stablePool, WBNB_USDC_V2],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(WBNB_USDC_V2.liquidityToken.address)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(0n)
      expect(decodedCommands[0].args[3].name).toEqual('path')
      expect((decodedCommands[0].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[0].args[5].name).toEqual('payerIsUser')
      expect(decodedCommands[0].args[5].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(CONTRACT_BALANCE)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.UNWRAP_WETH])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    })
    it('should encodes a mixed exactInput BNB-v2->USDC-stable->USDT swap', async () => {
      const amountIn = parseEther('1')

      const stablePool = await getStablePool(USDT, USDC, getPublicClient, liquidity)

      const trade = await buildMixedRouteTrade(
        ETHER,
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
        [WETH_USDC_V2, stablePool],
      )

      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(0n)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountIn')
      expect(decodedCommands[2].args[1].value).toEqual(CONTRACT_BALANCE)
      expect(decodedCommands[2].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[2].args[2].value).toEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[2].args[3].name).toEqual('path')
      expect((decodedCommands[2].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[2].args[5].name).toEqual('payerIsUser')
      expect(decodedCommands[2].args[5].value).toEqual(false)
    })
    it('should encodes a mixed exactInput ETH-extended->USDC-stable->USDT swap', async () => {
      const amountIn = parseEther('1')

      const stablePool = await getStablePool(USDT, USDC, getPublicClient, liquidity)

      const trade = await buildMixedRouteTrade(
        ETHER,
        CurrencyAmount.fromRawAmount(ETHER, amountIn),
        TradeType.EXACT_INPUT,
        [WETH_USDC_EXTENDED_MEDIUM, stablePool],
      )
      const options = swapOptions({})

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(amountIn)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(3)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.WRAP_ETH])
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(0n)
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(false)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountIn')
      expect(decodedCommands[2].args[1].value).toEqual(CONTRACT_BALANCE)
      expect(decodedCommands[2].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[2].args[2].value).toEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[2].args[3].name).toEqual('path')
      expect((decodedCommands[2].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[2].args[5].name).toEqual('payerIsUser')
      expect(decodedCommands[2].args[5].value).toEqual(false)
    })
  })

  describe('multi-route', () => {
    it('should encode a multi-route exactInput v2 USDT-USDC & extended USDT-USDC & stable USDT-USDC', async () => {
      const amountIn = parseUnits('1000', 6)
      const v2TradeRoute = new CoreTrade(
        new V2Route([USDC_USDT_V2], USDT, USDC),
        CurrencyAmount.fromRawAmount(USDT, amountIn),
        TradeType.EXACT_INPUT,
      )
      const coreTrade = buildCoreTrade(v2TradeRoute, [
        {
          type: PoolType.CORE,
          reserve0: USDC_USDT_V2.reserve0,
          reserve1: USDC_USDT_V2.reserve1,
        },
      ])
      const extendedTradeRoute = await ExtendedTrade.fromRoute(
        new ExtendedRoute([USDC_USDT_EXTENDED_LOW], USDT, USDC),
        CurrencyAmount.fromRawAmount(USDT, amountIn),
        TradeType.EXACT_INPUT,
      )
      const extendedTrade = buildExtendedTrade(extendedTradeRoute, [convertPoolToExtendedPool(USDC_USDT_EXTENDED_LOW)])

      const stableTrade = buildStableTrade(USDT, USDC, CurrencyAmount.fromRawAmount(USDT, amountIn), [
        await getStablePool(USDT, USDC, getPublicClient, liquidity),
      ])

      coreTrade.routes[0].percent = 33
      extendedTrade.routes[0].percent = 33
      stableTrade.routes[0].percent = 33

      const routes = [...coreTrade.routes, ...extendedTrade.routes, ...stableTrade.routes]
      const options = swapOptions({})
      const trade: SmartRouterTrade<TradeType.EXACT_INPUT> = {
        tradeType: TradeType.EXACT_INPUT,
        inputAmount: CurrencyAmount.fromRawAmount(USDT, amountIn * 3n),
        outputAmount: CurrencyAmount.fromRawAmount(
          USDC,
          routes.reduce((acc, r) => acc + r.outputAmount.quotient, 0n),
        ),
        routes,
        gasEstimate: 0n,
        gasEstimateInUSD: CurrencyAmount.fromRawAmount(USDT, amountIn),
      }

      expect(trade.routes.reduce((acc, r) => acc + r.outputAmount.quotient, 0n)).toEqual(trade.outputAmount.quotient)

      const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

      expect(BigInt(value)).toEqual(0n)
      expect(calldata).toMatchSnapshot()

      const decodedCommands = decodeUniversalCalldata(calldata)
      expect(decodedCommands.length).toEqual(4)

      expect(decodedCommands[0].command).toEqual(CommandType[CommandType.CORE_SWAP_EXACT_IN])
      // v2 support address aliases, no need to assigned to extended pool address
      expect(decodedCommands[0].args[0].name).toEqual('recipient')
      expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[0].args[1].name).toEqual('amountIn')
      expect(decodedCommands[0].args[1].value).toEqual(amountIn)
      expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[0].args[2].value).toEqual(
        v2TradeRoute.minimumAmountOut(options.slippageTolerance).quotient,
      )
      expect(decodedCommands[0].args[3].name).toEqual('path')
      expect((decodedCommands[0].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[0].args[4].value).toEqual(true)

      expect(decodedCommands[1].command).toEqual(CommandType[CommandType.EXTENDED_SWAP_EXACT_IN])
      expect(decodedCommands[1].args[0].name).toEqual('recipient')
      expect(decodedCommands[1].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[1].args[1].name).toEqual('amountIn')
      expect(decodedCommands[1].args[1].value).toEqual(amountIn)
      expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[1].args[2].value).toEqual(
        extendedTradeRoute.minimumAmountOut(options.slippageTolerance).quotient,
      )
      expect(decodedCommands[1].args[4].name).toEqual('payerIsUser')
      expect(decodedCommands[1].args[4].value).toEqual(true)

      expect(decodedCommands[2].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
      expect(decodedCommands[2].args[0].name).toEqual('recipient')
      expect(decodedCommands[2].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
      expect(decodedCommands[2].args[1].name).toEqual('amountIn')
      expect(decodedCommands[2].args[1].value).toEqual(amountIn)
      expect(decodedCommands[2].args[2].name).toEqual('amountOutMin')
      expect(decodedCommands[2].args[2].value).toEqual(
        SmartRouter.minimumAmountOut(stableTrade, options.slippageTolerance).quotient,
      )
      expect(decodedCommands[2].args[3].name).toEqual('path')
      expect((decodedCommands[2].args[3].value as string[]).length).toEqual(2)
      expect(decodedCommands[2].args[5].name).toEqual('payerIsUser')
      expect(decodedCommands[2].args[5].value).toEqual(true)

      expect(decodedCommands[3].command).toEqual('SWEEP')
      expect(decodedCommands[3].args[0].name).toEqual('token')
      expect(decodedCommands[3].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
      expect(decodedCommands[3].args[1].name).toEqual('recipient')
      expect(decodedCommands[3].args[1].value).toEqual(SENDER_AS_RECIPIENT)
      expect(decodedCommands[3].args[2].name).toEqual('amountMin')
      expect(decodedCommands[3].args[2].value).toEqual(
        SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
      )
    })
  })

  it('should encode a single exactInput USDT->USDC swap', async () => {
    const amountIn = parseUnits('1000', 6)

    const stablePool = await getStablePool(USDT, USDC, getPublicClient, liquidity)
    const trade = buildStableTrade(USDT, USDC, CurrencyAmount.fromRawAmount(USDT, amountIn), [stablePool])

    const options = swapOptions({})

    const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

    expect(BigInt(value)).toEqual(0n)
    expect(calldata).toMatchSnapshot()

    const decodedCommands = decodeUniversalCalldata(calldata)
    expect(decodedCommands.length).toEqual(1)

    expect(decodedCommands[0].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
    expect(decodedCommands[0].args[0].name).toEqual('recipient')
    expect(decodedCommands[0].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    expect(decodedCommands[0].args[1].name).toEqual('amountIn')
    expect(decodedCommands[0].args[1].value).toEqual(amountIn)
    expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
    expect(decodedCommands[0].args[2].value).toEqual(
      SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
    )
    expect(decodedCommands[0].args[3].name).toEqual('path')
    expect((decodedCommands[0].args[3].value as string[]).length).toEqual(2)
    expect(decodedCommands[0].args[5].name).toEqual('payerIsUser')
    expect(decodedCommands[0].args[5].value).toEqual(true)
  })
  it('should encode a single exactInput USDT->USDC swap, with fee', async () => {
    const amountIn = parseUnits('1000', 6)

    const stablePool = await getStablePool(USDT, USDC, getPublicClient, liquidity)
    const trade = buildStableTrade(USDT, USDC, CurrencyAmount.fromRawAmount(USDT, amountIn), [stablePool])

    const options = swapOptions({ fee: feeOptions })

    const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

    expect(BigInt(value)).toEqual(0n)
    expect(calldata).toMatchSnapshot()

    const decodedCommands = decodeUniversalCalldata(calldata)
    expect(decodedCommands.length).toEqual(3)

    expect(decodedCommands[0].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
    expect(decodedCommands[0].args[0].name).toEqual('recipient')
    expect(decodedCommands[0].args[0].value).toEqual(ROUTER_AS_RECIPIENT)
    expect(decodedCommands[0].args[1].name).toEqual('amountIn')
    expect(decodedCommands[0].args[1].value).toEqual(amountIn)
    expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
    expect(decodedCommands[0].args[2].value).toEqual(
      SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
    )
    expect(decodedCommands[0].args[3].name).toEqual('path')
    expect((decodedCommands[0].args[3].value as string[]).length).toEqual(2)
    expect(decodedCommands[0].args[5].name).toEqual('payerIsUser')
    expect(decodedCommands[0].args[5].value).toEqual(true)

    expect(decodedCommands[1].command).toEqual('PAY_PORTION')
    expect(decodedCommands[1].args[0].name).toEqual('token')
    expect(decodedCommands[1].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
    expect(decodedCommands[1].args[1].name).toEqual('recipient')
    expect(decodedCommands[1].args[1].value).toEqual(TEST_FEE_RECIPIENT_ADDRESS)
    expect(decodedCommands[1].args[2].name).toEqual('bips')
    expect(decodedCommands[1].args[2].value).toEqual(TEST_FEE)

    expect(decodedCommands[2].command).toEqual('SWEEP')
    expect(decodedCommands[2].args[0].name).toEqual('token')
    expect(decodedCommands[2].args[0].value).toEqual(trade.outputAmount.currency.wrapped.address)
    expect(decodedCommands[2].args[1].name).toEqual('recipient')
    expect(decodedCommands[2].args[1].value).toEqual(SENDER_AS_RECIPIENT)
    expect(decodedCommands[2].args[2].name).toEqual('amountMin')
    expect(decodedCommands[2].args[2].value).toEqual(
      SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
    )
  })
  it('should encode a single exactInput USDT->USDC swap, with permit2', async () => {
    const amountIn = parseUnits('1000', 6)

    const stablePool = await getStablePool(USDT, USDC, getPublicClient, liquidity)
    const trade = buildStableTrade(USDT, USDC, CurrencyAmount.fromRawAmount(USDT, amountIn), [stablePool])

    const permit = makePermit(USDC.address, UNIVERSAL_ROUTER)
    const permit2Permit: Permit2Signature = {
      ...permit,
      signature:
        '0x777406b366e3539754d5ea1056d11c8f7482c7f095b48cc3520051169c6e0e1f49116cbe67f45bfe7c1af7599e7c6c5c93565294bcc0fb2f42699d2845b11da41b',
    }
    const options = swapOptions({
      inputTokenPermit: permit2Permit,
    })

    const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)

    expect(BigInt(value)).toEqual(0n)
    expect(calldata).toMatchSnapshot()

    const decodedCommands = decodeUniversalCalldata(calldata)
    expect(decodedCommands.length).toEqual(2)

    expect(decodedCommands[0].command).toEqual(CommandType[CommandType.PERMIT2_PERMIT])

    expect(decodedCommands[1].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
    expect(decodedCommands[1].args[0].name).toEqual('recipient')
    expect(decodedCommands[1].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    expect(decodedCommands[1].args[1].name).toEqual('amountIn')
    expect(decodedCommands[1].args[1].value).toEqual(amountIn)
    expect(decodedCommands[1].args[2].name).toEqual('amountOutMin')
    expect(decodedCommands[1].args[2].value).toEqual(
      SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
    )
    expect(decodedCommands[1].args[3].name).toEqual('path')
    expect((decodedCommands[1].args[3].value as string[]).length).toEqual(2)
    expect(decodedCommands[1].args[5].name).toEqual('payerIsUser')
    expect(decodedCommands[1].args[5].value).toEqual(true)
  })
  it('should encode a exactInput USDT->USDC->BUSD swap', async () => {
    const amountIn = parseUnits('1000', 6)

    const USDT_USDC_POOL = await getStablePool(USDT, USDC, getPublicClient, liquidity)
    const USDC_BUSD_POOL = await getStablePool(USDC, BUSD, getPublicClient)

    const trade = buildStableTrade(USDT, BUSD, CurrencyAmount.fromRawAmount(USDT, amountIn), [
      USDT_USDC_POOL,
      USDC_BUSD_POOL,
    ])

    const options = swapOptions({})
    const { calldata, value } = EvolusRouter.swapERC20CallParameters(trade, options)
    expect(BigInt(value)).toEqual(0n)
    expect(calldata).toMatchSnapshot()

    const decodedCommands = decodeUniversalCalldata(calldata)
    expect(decodedCommands.length).toEqual(1)

    expect(decodedCommands[0].command).toEqual(CommandType[CommandType.STABLE_SWAP_EXACT_IN])
    expect(decodedCommands[0].args[0].name).toEqual('recipient')
    expect(decodedCommands[0].args[0].value).toEqual(SENDER_AS_RECIPIENT)
    expect(decodedCommands[0].args[1].name).toEqual('amountIn')
    expect(decodedCommands[0].args[1].value).toEqual(amountIn)
    expect(decodedCommands[0].args[2].name).toEqual('amountOutMin')
    expect(decodedCommands[0].args[2].value).toEqual(
      SmartRouter.minimumAmountOut(trade, options.slippageTolerance).quotient,
    )
    expect(decodedCommands[0].args[3].name).toEqual('path')
    expect((decodedCommands[0].args[3].value as string[]).length).toEqual(3)
    expect(decodedCommands[0].args[5].name).toEqual('payerIsUser')
    expect(decodedCommands[0].args[5].value).toEqual(true)
  })
})
