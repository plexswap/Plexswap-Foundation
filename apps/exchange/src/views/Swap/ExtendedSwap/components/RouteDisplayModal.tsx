import { useTranslation } from '@plexswap/localization'
import { Route, SmartRouter } from '@plexswap/gateway-guardians/Ananke'
import { Currency } from '@plexswap/sdk-core'
import {
    AtomBox,
    AutoColumn,
    Flex,
    Modal,
    ModalCore,
    QuestionHelper,
    Text,
    UseModalCoreProps,
    useTooltip    
} from '@plexswap/ui-plex'

import {  CurrencyLogo } from '@plexswap/widgets-internal'
import { memo, useMemo } from 'react'
import { RoutingSettingsButton } from 'components/Menu/GlobalSettings/SettingsModal'
import { CurrencyLogoWrapper, RouterBox, RouterPoolBox, RouterTypeText } from 'views/Swap/components/RouterViewer'
import { extendedFeeToPercent } from '../utils/exchange'

type Pair = [Currency, Currency]

export type RouteDisplayEssentials = Pick<Route, 'path' | 'pools' | 'inputAmount' | 'outputAmount' | 'percent'>

interface Props extends UseModalCoreProps {
  routes: RouteDisplayEssentials[]
}

export const RouteDisplayModal = memo(function RouteDisplayModal({ isOpen, onDismiss, routes }: Props) {
  const { t } = useTranslation()
  return (
    <ModalCore closeOnOverlayClick isOpen={isOpen} onDismiss={onDismiss} minHeight="0">
      <Modal
        title={
          <Flex justifyContent="center">
            {t('Route')}{' '}
            <QuestionHelper
              text={t('Routing through these tokens resulted in the best price for your trade.')}
              ml="4px"
              placement="top-start"
            />
          </Flex>
        }
        style={{ minHeight: '0' }}
        bodyPadding="24px"
      >
        <AutoColumn gap="48px">
          {routes.map((route, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <RouteDisplay key={i} route={route} />
          ))}
          <RoutingSettingsButton />
        </AutoColumn>
      </Modal>
    </ModalCore>
  )
})

interface RouteDisplayProps {
  route: RouteDisplayEssentials
}

export const RouteDisplay = memo(function RouteDisplay({ route }: RouteDisplayProps) {
  const { t } = useTranslation()
  const { path, pools, inputAmount, outputAmount } = route
  const { currency: inputCurrency } = inputAmount
  const { currency: outputCurrency } = outputAmount
  const { targetRef, tooltip, tooltipVisible } = useTooltip(<Text>{inputCurrency.symbol}</Text>, {
    placement: 'right',
  })

  const {
    targetRef: outputTargetRef,
    tooltip: outputTooltip,
    tooltipVisible: outputTooltipVisible,
  } = useTooltip(<Text>{outputCurrency.symbol}</Text>, {
    placement: 'right',
  })

  const pairs = useMemo<Pair[]>(() => {
    if (path.length <= 1) {
      return []
    }

    const currencyPairs: Pair[] = []
    for (let i = 0; i < path.length - 1; i += 1) {
      currencyPairs.push([path[i], path[i + 1]])
    }
    return currencyPairs
  }, [path])

  const pairNodes =
    pairs.length > 0
      ? pairs.map((p, index) => {
          const [input, output] = p
          const pool = pools[index]
          const isExtendedPool = SmartRouter.isExtendedPool(pool)
          const isCorePool = SmartRouter.isCorePool(pool)
          const key = isCorePool ? `core_${pool.reserve0.currency.symbol}_${pool.reserve1.currency.symbol}` : pool.address
          const text = isCorePool
            ? 'Core'
            : isExtendedPool
            ? `Extended (${extendedFeeToPercent(pool.fee).toSignificant(6)}%)`
            : t('StableSwap')
          const tooltipText = `${input.symbol}/${output.symbol}${
            isExtendedPool ? ` (${extendedFeeToPercent(pool.fee).toSignificant(6)}%)` : ''
          }`
          return (
            <PairNode
              pair={p}
              key={key}
              text={text}
              className={isExtendedPool ? 'highlight' : ''}
              tooltipText={tooltipText}
            />
          )
        })
      : null

  return (
    <AutoColumn gap="24px">
      <RouterBox justifyContent="space-between" alignItems="center">
        <CurrencyLogoWrapper
          size={{
            xs: '32px',
            md: '48px',
          }}
          ref={targetRef}
        >
          <CurrencyLogo size="100%" currency={inputCurrency} />
          <RouterTypeText fontWeight="bold">{Math.round(route.percent)}%</RouterTypeText>
        </CurrencyLogoWrapper>
        {tooltipVisible && tooltip}
        {pairNodes}
        <CurrencyLogoWrapper
          size={{
            xs: '32px',
            md: '48px',
          }}
          ref={outputTargetRef}
        >
          <CurrencyLogo size="100%" currency={outputCurrency} />
        </CurrencyLogoWrapper>
        {outputTooltipVisible && outputTooltip}
      </RouterBox>
    </AutoColumn>
  )
})

function PairNode({
  pair,
  text,
  className,
  tooltipText,
}: {
  pair: Pair
  text: string
  className: string
  tooltipText: string
}) {
  const [input, output] = pair

  const tooltip = useTooltip(tooltipText)

  return (
    <RouterPoolBox className={className} ref={tooltip.targetRef}>
      {tooltip.tooltipVisible && tooltip.tooltip}
      <AtomBox
        size={{
          xs: '24px',
          md: '32px',
        }}
      >
        <CurrencyLogo size="100%" currency={input} />
      </AtomBox>
      <AtomBox
        size={{
          xs: '24px',
          md: '32px',
        }}
      >
        <CurrencyLogo size="100%" currency={output} />
      </AtomBox>
      <RouterTypeText>{text}</RouterTypeText>
    </RouterPoolBox>
  )
}
