import { Token } from '@plexswap/sdk-core'
import { FarmWidget } from '@plexswap/widgets-internal'
import { FeeAmount } from '@plexswap/sdk-extended'
import { AutoRow, FarmMultiplierInfo, Flex, Heading, Skeleton, Tag, useTooltip } from '@plexswap/ui-plex'
import { TokenPairImage } from 'components/TokenImage'
import { styled } from 'styled-components'
import { Address } from 'viem'
import BoostedTag from '../YieldBooster/components/BoostedTag'

const { StableFarmTag, CoreTag, ExtendedFeeTag } = FarmWidget.Tags

type ExpandableSectionProps = {
  lpLabel?: string
  multiplier?: string
  token: Token
  quoteToken: Token
  boosted?: boolean
  isStable?: boolean
  version: 1 | 11
  feeAmount?: FeeAmount
  pid?: number
  farmWayaPerSecond?: string
  totalMultipliers?: string
  isBoosted?: boolean
  lpAddress?: Address
  isBooster?: boolean
  wayaWrapperAddress?: Address
}


const Wrapper = styled(Flex)`
  svg {
    margin-right: 4px;
  }
`

const MultiplierTag = styled(Tag)`
  margin-left: 4px;
`

const CardHeading: React.FC<React.PropsWithChildren<ExpandableSectionProps>> = ({
  lpLabel,
  multiplier,
  token,
  quoteToken,
  isStable,
  version,
  feeAmount,
  farmWayaPerSecond,
  totalMultipliers,
  isBooster,
  wayaWrapperAddress,
}) => {
  const isReady = multiplier !== undefined || wayaWrapperAddress
  const multiplierTooltipContent = FarmMultiplierInfo({
    farmWayaPerSecond: farmWayaPerSecond ?? '-',
    totalMultipliers: totalMultipliers ?? '-',
  })

  const { targetRef, tooltip, tooltipVisible } = useTooltip(multiplierTooltipContent, {
    placement: 'bottom',
  })

  return (
    <Wrapper justifyContent="space-between" alignItems="center" mb="12px">
      {isReady ? (
        <TokenPairImage variant="inverted" primaryToken={token} secondaryToken={quoteToken} width={64} height={64} />
      ) : (
        <Skeleton mr="8px" width={63} height={63} variant="circle" />
      )}
      <Flex flexDirection="column" alignItems="flex-end" width="100%">
        {isReady ? (
          <Heading mb="4px" display="inline-flex">
            {lpLabel?.split(' ')?.[0] ?? ''}
            {null}
          </Heading>
        ) : (
          <Skeleton mb="4px" width={60} height={18} />
        )}
        <AutoRow gap="4px" justifyContent="flex-end">
          {isReady && isStable ? <StableFarmTag /> : version === 1 ? <CoreTag /> : null}
          {isReady && version === 11 && <ExtendedFeeTag feeAmount={feeAmount} />}
          {isReady ? (
            version !== 1 ? (
              <Flex ref={targetRef}>
                <MultiplierTag variant="secondary">{multiplier}</MultiplierTag>
                {tooltipVisible && tooltip}
              </Flex>
            ) : null
          ) : (
            <Skeleton ml="4px" width={42} height={28} />
          )}
          {isReady && isBooster && <BoostedTag mr="-4px" />}
        </AutoRow>
      </Flex>
    </Wrapper>
  )
}

export default CardHeading
