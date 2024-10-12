import { ChainId } from '@plexswap/chains'
import { useIntersectionObserver } from '@plexswap/hooks'
import { useTranslation } from '@plexswap/localization'
import { wayaVaultABI } from '@plexswap/pools'
import { bscTokens } from '@plexswap/tokens'
import { Balance, Flex, Heading, Skeleton, Text, useMatchBreakpoints } from '@plexswap/ui-plex'
import { formatBigInt, formatLocalisedCompactNumber, formatNumber } from '@plexswap/utils/formatBalance'
import { useQuery } from '@tanstack/react-query'
import { SLOW_INTERVAL } from 'config/constants'
import addresses from 'config/constants/contracts'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useEffect, useState } from 'react'
import { styled } from 'styled-components'
import { getWayaVaultAddress } from 'utils/addressHelpers'
import { publicClient } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useWayaEmissionPerBlock } from 'views/Home/hooks/useWayaEmissionPerBlock'

const StyledColumn = styled(Flex)<{ noMobileBorder?: boolean; noDesktopBorder?: boolean }>`
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  &:not(:last-child) {
    border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  }
  &:nth-child(2n) {
    border-right: none;
  }
  width: 50%;
  ${({ theme }) => theme.mediaQueries.sm} {
    &:not(:last-child) {
      border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
      border-bottom: none;
    }
    &:nth-child(3) {
      border-right: none;
    }
    width: 33%;
  }

  ${({ theme }) => theme.mediaQueries.lg} {
    width: auto;
    &:not(:last-child) {
      border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
    }
  }
`
const StyledWrapper = styled(Flex)`
  margin-top: 24px;
  flex-direction: row;
  flex-wrap: wrap;
  ${({ theme }) => theme.mediaQueries.lg} {
    flex-direction: row;
    flex-wrap: nowrap;
  }
`


const wayaVaultAddress = getWayaVaultAddress()

const WayaDataRow = () => {
  const { t } = useTranslation()
  const { observerRef, isIntersecting } = useIntersectionObserver()
  const [loadData, setLoadData] = useState(false)
  const emissionsPerBlock = useWayaEmissionPerBlock(loadData)
  const { isMobile } = useMatchBreakpoints()

  const {
    data: { wayaSupply, burnedBalance, circulatingSupply } = {
      wayaSupply: 0,
      burnedBalance: 0,
      circulatingSupply: 0,
    },
  } = useQuery({
    queryKey: ['wayaDataRow'],

    queryFn: async () => {
      const [totalSupply, totalBurned, totalLockedAmount] = await publicClient({ chainId: ChainId.BSC }).multicall({
        contracts: [
          { abi: erc20Abi, address: bscTokens.waya.address, functionName: 'totalSupply' },
          {
            abi: erc20Abi,
            address: bscTokens.waya.address,
            functionName: 'balanceOf',
            args: ['0x000000000000000000000000000000000000dEaD'],
          },
          {
            abi: wayaVaultABI,
            address: wayaVaultAddress,
            functionName: 'totalLockedAmount',
          },
          {
            abi: erc20Abi,
            address: bscTokens.waya.address,
            functionName: 'balanceOf',
            args: [addresses.voter[ChainId.BSC]],
          },
        ],
        allowFailure: false,
      })

      const circulating = totalSupply - (totalBurned + totalLockedAmount)

      return {
        wayaSupply: totalSupply && totalBurned ? +formatBigInt(totalSupply - totalBurned) : +formatBigInt(totalSupply),
        burnedBalance: totalBurned ? +formatBigInt(totalBurned) : 0,
        circulatingSupply: circulating ? +formatBigInt(circulating) : 0,
      }
    },

    enabled: Boolean(loadData),
    refetchInterval: SLOW_INTERVAL,
  })
  const wayaPrice = useWayaPrice()
  const mcap = wayaPrice.times(circulatingSupply)
  const mcapString = formatLocalisedCompactNumber(mcap.toNumber(), isMobile)

  useEffect(() => {
    if (isIntersecting) {
      setLoadData(true)
    }
  }, [isIntersecting])

  return (
    <StyledWrapper mb={isMobile ? '30px' : '50px'}>
      <StyledColumn>
        <Text color="text" bold fontSize={isMobile ? '14px' : undefined}>
          {t('Circulating Supply')}
        </Text>
        {circulatingSupply ? (
          <Balance decimals={0} lineHeight="1.1" fontSize="24px" bold value={circulatingSupply} color="secondary" />
        ) : (
          <Skeleton height={24} width={126} my="4px" />
        )}
      </StyledColumn>
      <StyledColumn noMobileBorder>
        <Text bold fontSize={isMobile ? '14px' : undefined}>
          {t('Total supply')}
        </Text>
        {wayaSupply ? (
          <Balance color="secondary" decimals={0} lineHeight="1.1" fontSize="24px" bold value={wayaSupply} />
        ) : (
          <>
            <div ref={observerRef} />
            <Skeleton height={24} width={126} my="4px" />
          </>
        )}
      </StyledColumn>
      <StyledColumn>
        <Text bold fontSize={isMobile ? '14px' : undefined}>
          {t('Market cap')}
        </Text>
        {mcap?.gt(0) && mcapString ? (
          <Heading color="secondary" scale="lg">
            {t('$%marketCap%', { marketCap: mcapString })}
          </Heading>
        ) : (
          <Skeleton height={24} width={126} my="4px" />
        )}
      </StyledColumn>
      <StyledColumn>
        <Text bold fontSize={isMobile ? '14px' : undefined}>
          {t('Token Burn')}
        </Text>
        {burnedBalance ? (
          <Balance color="secondary" decimals={0} lineHeight="1.1" fontSize="24px" bold value={burnedBalance} />
        ) : (
          <Skeleton height={24} width={126} my="4px" />
        )}
      </StyledColumn>
      <StyledColumn>
        <Text bold>{t('Current emissions')}</Text>

        {emissionsPerBlock ? (
          <Heading color="secondary" scale="lg">
            {t('%wayaEmissions%/block', { wayaEmissions: formatNumber(Number(emissionsPerBlock)) })}
          </Heading>
        ) : (
          <Skeleton height={24} width={126} my="4px" />
        )}
      </StyledColumn>
    </StyledWrapper>
  )
}

export default WayaDataRow