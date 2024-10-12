import { ChainId } from '@plexswap/chains'
import { RowType } from '@plexswap/ui-plex'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { formatBigInt, getBalanceNumber } from '@plexswap/utils/formatBalance'
import latinise from '@plexswap/utils/latinise'
import { FarmWidget } from '@plexswap/widgets-internal'
import BigNumber from 'bignumber.js'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useRouter } from 'next/router'
import { ReactNode, useCallback, useMemo, useRef } from 'react'
import { styled } from 'styled-components'
import { CoreFarm, GlobalFarmWithStakeValue } from 'views/Farms/FarmsExtended'
import { useFarmCoreMultiplier } from 'views/Farms/hooks/useFarmCoreMultiplier'
import { useFarmExtendedMultiplier } from 'views/Farms/hooks/extended/useFarmExtendedMultiplier'
import { getDisplayApr } from '../getDisplayApr'
import Row, { RowProps } from './Row'

const { ExtendedDesktopColumnSchema, DesktopColumnSchema } = FarmWidget

export interface ITableProps {
  header?: ReactNode
  farms: GlobalFarmWithStakeValue[]
  userDataReady: boolean
  wayaPrice: BigNumber
  sortColumn?: string
}

const Container = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.card.background};
  border-radius: 32px;
  margin: 16px 0px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const TableWrapper = styled.div`
  overflow: visible;
  scroll-margin-top: 64px;
  &::-webkit-scrollbar {
    display: none;
  }
`

const StyledTable = styled.table`
  border-collapse: collapse;
  font-size: 14px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`

const TableBody = styled.tbody`
  & tr {
    td {
      font-size: 16px;
      vertical-align: middle;
    }

    :last-child {
      td[colspan='7'] {
        > div {
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
        }
      }
    }
  }
`
const TableContainer = styled.div`
  position: relative;
`

const getCoreFarmEarnings = (farm: CoreFarm) => {
  let existingEarnings = farm.userData?.earnings ? new BigNumber(farm.userData?.earnings) : BIG_ZERO
  if (farm.wayaWrapperAddress)
    existingEarnings = farm.wayaUserData?.earnings ? new BigNumber(farm.wayaUserData?.earnings) : BIG_ZERO
  let earnings: BigNumber = existingEarnings

  if (farm.boosted) {
    const proxyEarnings = farm.userData?.proxy?.earnings ? new BigNumber(farm.userData?.proxy?.earnings) : BIG_ZERO

    earnings = proxyEarnings.gt(0) ? proxyEarnings : existingEarnings
  }

  return getBalanceNumber(earnings)
}

const COLUMNS = DesktopColumnSchema.map((column) => ({
  id: column.id,
  name: column.name,
  label: column.label,
  sort: (a: RowType<RowProps>, b: RowType<RowProps>) => {
    switch (column.name) {
      case 'farm':
        return b.id - a.id
      case 'apr':
        if (a.original.apr.value && b.original.apr.value) {
          return Number(a.original.apr.value) - Number(b.original.apr.value)
        }

        return 0
      case 'earned':
        return a.original.earned.earnings - b.original.earned.earnings
      default:
        return 1
    }
  },
  sortable: column.sortable,
}))

const COLUMNS_EXTENDED = ExtendedDesktopColumnSchema.map((column) => ({
  id: column.id,
  name: column.name,
  label: column.label,
  sort: (a: RowType<RowProps>, b: RowType<RowProps>) => {
    switch (column.name) {
      case 'farm':
        return b.id - a.id
      case 'apr':
        if (a.original.apr.value && b.original.apr.value) {
          return Number(a.original.apr.value) - Number(b.original.apr.value)
        }

        return 0
      case 'earned':
        return a.original.earned.earnings - b.original.earned.earnings
      default:
        return 1
    }
  },
  sortable: column.sortable,
}))

const generateSortedRow = (row: RowProps) => {
  // @ts-ignore
  const newRow: RowProps = {}
  const columns = row.type === 'extended' ? COLUMNS_EXTENDED : COLUMNS
  columns.forEach((column) => {
    if (!(column.name in row)) {
      throw new Error(`Invalid row data, ${column.name} not found`)
    }
    newRow[column.name] = row[column.name]
  })
  newRow.initialActivity = row.initialActivity
  return newRow
}

const FarmTable: React.FC<React.PropsWithChildren<ITableProps>> = ({ farms, wayaPrice, userDataReady, header }) => {
  const tableWrapperEl = useRef<HTMLDivElement>(null)
  const { query } = useRouter()
  const { chainId } = useActiveChainId()
  const farmExtendedMultiplier = useFarmExtendedMultiplier()
  const farmCoreMultiplier = useFarmCoreMultiplier()

  const generateRow = useCallback(
    (farm: GlobalFarmWithStakeValue): RowProps => {
      const { token, quoteToken } = farm
      const tokenAddress = token.address
      const quoteTokenAddress = quoteToken.address
      const lpLabel = farm.lpSymbol && farm.lpSymbol.replace(/plexswap/gi, '')
      const lowercaseQuery = latinise(typeof query?.search === 'string' ? query.search.toLowerCase() : '')
      const initialActivity = latinise(lpLabel?.toLowerCase()) === lowercaseQuery

      if (farm.version === 1) {
        const isBooster = Boolean(farm?.wayaWrapperAddress)
        const row: RowProps = {
          apr: {
            value:
              getDisplayApr(
                (isBooster && farm?.wayaPublicData?.rewardPerSecond === 0) || !farm?.wayaPublicData?.isRewardInRange
                  ? 0
                  : farm.apr,
                farm.lpRewardsApr,
              ) ?? '',
            pid: farm.pid,
            multiplier: farm.multiplier ?? '',
            lpLabel,
            lpSymbol: farm.lpSymbol,
            lpTokenPrice: farm.lpTokenPrice ?? BIG_ZERO,
            tokenAddress,
            quoteTokenAddress,
            wayaPrice,
            lpRewardsApr: farm.lpRewardsApr ?? 0,
            originalValue:
              (isBooster && farm?.wayaPublicData?.rewardPerSecond === 0) || !farm?.wayaPublicData?.isRewardInRange
                ? 0
                : farm.apr ?? 0,
            stableSwapAddress: farm.stableSwapAddress,
            stableLpFee: farm.stableLpFee,
          },
          rewardPerDay: {},
          farm: {
            version: 1,
            label: lpLabel,
            pid: farm.pid,
            token: farm.token,
            quoteToken: farm.quoteToken,
            isReady: farm.multiplier !== undefined,
            isStaking:
              farm.userData?.proxy?.stakedBalance.gt(0) ||
              farm.userData?.stakedBalance.gt(0) ||
              farm.wayaUserData?.stakedBalance.gt(0),
            rewardWayaPerSecond:
              farm?.wayaPublicData?.rewardPerSecond ?? farmCoreMultiplier.getNumberFarmWayaPerSecond(farm.poolWeight),
          },
          earned: {
            earnings: getCoreFarmEarnings(farm),
            pid: farm.pid,
          },
          liquidity: {
            liquidity: farm?.liquidity ?? BIG_ZERO,
          },
          multiplier: {
            multiplier: farm.multiplier ?? '',
            farmWayaPerSecond: farmCoreMultiplier.getFarmWayaPerSecond(farm.poolWeight ?? BIG_ZERO),
            totalMultipliers: farmCoreMultiplier.totalMultipliers,
          },
          type: 'core',
          details: farm,
          initialActivity,
        }

        return row
	}

      return {
        initialActivity,
        apr: {
          value: '',
          pid: farm.pid,
        },
        farm: {
          version: 11,
          label: lpLabel,
          pid: farm.pid,
          token: farm.token,
          quoteToken: farm.quoteToken,
          isReady: farm.multiplier !== undefined,
          isStaking: farm.stakedPositions?.length > 0,
	 },
        type: 'extended',
        details: farm,
        multiplier: {
          multiplier: farm.multiplier,
          farmWayaPerSecond: farmExtendedMultiplier.getFarmWayaPerSecond(farm.poolWeight),
          totalMultipliers: farmExtendedMultiplier.totalMultipliers,
        },
        stakedLiquidity: {
          inactive: farm.multiplier === '0X',
          liquidity: new BigNumber(farm.activeTvlUSD ?? '0'),
          updatedAt: farm.activeTvlUSDUpdatedAt ? new Date(farm.activeTvlUSDUpdatedAt).getTime() : undefined,
        },
        earned: {
          earnings: +formatBigInt(
            Object.values(farm.pendingWayaByTokenIds).reduce((total, vault) => total + vault, 0n),
            4,
          ),
          pid: farm.pid,
        },
        availableLp: {
          pid: farm.pid,
          amount: farm.multiplier === '0X' ? 0 : farm.unstakedPositions.length,
        },
        stakedLp: {
          pid: farm.pid,
          amount: farm.stakedPositions.length,
        },
      }
    },
    [query.search, farmExtendedMultiplier, wayaPrice, farmCoreMultiplier, chainId],
  )

  const sortedRows = useMemo(() => {
    const rowData = farms.map((farm) => generateRow(farm))
    return rowData.map(generateSortedRow)
  }, [farms, generateRow])

  return (
    <Container id="farms-table">
      {header}
      <TableContainer id="table-container">
        <TableWrapper ref={tableWrapperEl}>
          <StyledTable>
            <TableBody>
              {sortedRows.map((row, index) => {
                const isLastFarm = index === sortedRows.length - 1
                return (
                  <Row
                    {...row}
                    userDataReady={userDataReady || chainId !== ChainId.BSC}
                    key={`table-row-${row.farm.pid}-${row.type}`}
                    isLastFarm={isLastFarm}
                  />
                )
              })}
            </TableBody>
          </StyledTable>
        </TableWrapper>
      </TableContainer>
    </Container>
  )
}

export default FarmTable