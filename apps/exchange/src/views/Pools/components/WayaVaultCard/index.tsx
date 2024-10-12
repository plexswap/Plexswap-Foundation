import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Box, CardBody, CardProps, Flex, FlexGap, Skeleton, TokenPairImage, } from '@plexswap/ui-plex'
import { Token } from '@plexswap/sdk-core'
import { vaultPoolConfig } from 'config/constants/pools'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { DeserializedLockedWayaVault, DeserializedWayaVault, VaultKey } from '@plexswap/pools'
import { styled } from 'styled-components'
import { useAccount } from 'wagmi'
import LockedStakingApy from '../LockedPool/LockedStakingApy'
import CardFooter from '../PoolCard/CardFooter'
import { VaultPositionTagWithLabel } from '../Vault/VaultPositionTag'
import UnstakingFeeCountdownRow from './UnstakingFeeCountdownRow'
import VaultCardActions from './VaultCardActions'

const StyledCardBody = styled(CardBody)<{ isLoading: boolean }>`
  min-height: ${({ isLoading }) => (isLoading ? '0' : '254px')};
`

interface WayaVaultProps extends CardProps {
  pool?: Pool.DeserializedPool<Token>
  showStakedOnly: boolean
  defaultFooterExpanded?: boolean
  showIWaya?: boolean
  showSkeleton?: boolean
}

interface WayaVaultDetailProps {
  isLoading?: boolean
  account?: string
  pool: Pool.DeserializedPool<Token>
  vaultPool: DeserializedWayaVault
  accountHasSharesStaked?: boolean
  defaultFooterExpanded?: boolean
  showIWaya?: boolean
  performanceFeeAsDecimal?: number
}

export const WayaVaultDetail: React.FC<React.PropsWithChildren<WayaVaultDetailProps>> = ({
  isLoading = false,
  account,
  pool,
  vaultPool,
  accountHasSharesStaked,
  showIWaya,
  performanceFeeAsDecimal,
  defaultFooterExpanded,
}) => {

  const isLocked = (vaultPool as DeserializedLockedWayaVault)?.userData?.locked

  if (!pool) {
    return null
  }

  return (
    <>
      <StyledCardBody isLoading={isLoading}>
        {account && pool.vaultKey === VaultKey.WayaVault && (
          <VaultPositionTagWithLabel userData={(vaultPool as DeserializedLockedWayaVault)?.userData} />
        )}
        {account && pool.vaultKey === VaultKey.WayaVault && isLocked ? (
          <>
            <LockedStakingApy
              userData={(vaultPool as DeserializedLockedWayaVault).userData}
              showIWaya={showIWaya}
              pool={pool}
              account={account}
            />
          </>
        ) : (
          <>
            <FlexGap mt="16px" gap="24px" flexDirection={accountHasSharesStaked ? 'column-reverse' : 'column'}>
                <Box>
                  {account && (
                    <Box mb="8px">
                      <UnstakingFeeCountdownRow vaultKey={pool.vaultKey ?? VaultKey.WayaVaultV1} />
                    </Box>
                  )}
                </Box>
                <Flex flexDirection="column">
                  {account && (
                    <VaultCardActions
                      pool={pool}
                      accountHasSharesStaked={accountHasSharesStaked}
                      isLoading={isLoading}
                      performanceFee={performanceFeeAsDecimal}
                    />
                  )}
                </Flex>
              </FlexGap>
          </>
        )}
      </StyledCardBody>
      {account && (
        <CardFooter isLocked={isLocked} defaultExpanded={defaultFooterExpanded} pool={pool} account={account} />
      )}
    </>
  )
}

const WayaVaultCard: React.FC<React.PropsWithChildren<WayaVaultProps>> = ({
  pool,
  showStakedOnly,
  defaultFooterExpanded,
  showIWaya = false,
  showSkeleton = true,
  ...props
}) => {
  const { address: account } = useAccount()

  const vaultPool = useVaultPoolByKey(pool?.vaultKey || VaultKey.WayaVault)
  const totalStaked = pool?.totalStaked

  const userShares = vaultPool?.userData?.userShares
  const isVaultUserDataLoading = vaultPool?.userData?.isLoading
  const performanceFeeAsDecimal = vaultPool?.fees?.performanceFeeAsDecimal

  const accountHasSharesStaked = userShares && userShares.gt(0)
  const isLoading = !pool?.userData || isVaultUserDataLoading

  if (!pool || (showStakedOnly && !accountHasSharesStaked)) {
    return null
  }

  return (
    <Pool.StyledCard isActive {...props}>
      <Pool.PoolCardHeader isStaking={accountHasSharesStaked}>
        {!showSkeleton || (totalStaked && totalStaked.gte(0)) ? (
          <>
            <Pool.PoolCardHeaderTitle
              title={vaultPoolConfig?.[pool.vaultKey ?? '']?.name ?? ''}
              subTitle={vaultPoolConfig?.[pool.vaultKey ?? ''].description ?? ''}
            />
            <TokenPairImage {...vaultPoolConfig?.[pool.vaultKey ?? ''].tokenImage} width={64} height={64} />
          </>
        ) : (
          <Flex width="100%" justifyContent="space-between">
            <Flex flexDirection="column">
              <Skeleton width={100} height={26} mb="4px" />
              <Skeleton width={65} height={20} />
            </Flex>
            <Skeleton width={58} height={58} variant="circle" />
          </Flex>
        )}
      </Pool.PoolCardHeader>
      <WayaVaultDetail
        isLoading={isLoading}
        account={account}
        pool={pool}
        vaultPool={vaultPool}
        accountHasSharesStaked={accountHasSharesStaked}
        showIWaya={showIWaya}
        performanceFeeAsDecimal={performanceFeeAsDecimal}
        defaultFooterExpanded={defaultFooterExpanded}
      />
    </Pool.StyledCard>
  )
}

export default WayaVaultCard
