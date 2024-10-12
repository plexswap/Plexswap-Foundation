import { useTranslation } from '@plexswap/localization'
import { checkIsBoostedPool } from '@plexswap/pools'
import { Token } from '@plexswap/sdk-core'
import { Flex, FlexLayout, Heading, Loading, PageHeader, Text, ViewMode } from '@plexswap/ui-plex'
import { PoolWidget as Pool } from "@plexswap/widgets-internal"
import ConnectWalletButton from 'components/ConnectWalletButton'
import Page from 'components/Layout/Page'
import { TokenPairImage } from 'components/TokenImage'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { usePoolsPageFetch, usePoolsWithVault } from 'state/pools/hooks'
import { styled } from 'styled-components'
import { useAccount } from 'wagmi'
import AprRow from './components/PoolCard/AprRow'
import CardActions from './components/PoolCard/CardActions'
import CardFooter from './components/PoolCard/CardFooter'
import PoolControls from './components/PoolControls'
import PoolRow, { VaultPoolRow } from './components/PoolsTable/PoolRow'
import WayaVaultCard from './components/WayaVaultCard'

const CardLayout = styled(FlexLayout)`
  justify-content: center;
`
const Pools: React.FC<React.PropsWithChildren> = () => {
  const { t } = useTranslation()
  const { address: account } = useAccount()
  const { chainId } = useActiveChainId()
  const { pools, userDataLoaded } = usePoolsWithVault()

  usePoolsPageFetch()

  return (
    <>
      <PageHeader>
        <Flex justifyContent="space-between" flexDirection={['column', null, null, 'row']}>
          <Flex flex="1" flexDirection="column" mr={['8px', 0]}>
            <Heading as="h1" scale="xxl" color="secondary" mb="24px">
              {t('Crop Silos')}
            </Heading>
            <Heading scale="md" color="text">
              {t('Just stake some tokens to earn.')}
            </Heading>
            <Heading scale="md" color="text">
              {t('High APR, low risk.')}
            </Heading>
          </Flex>
        </Flex>
      </PageHeader>
      <Page>
        <PoolControls pools={pools}>
          {({ chosenPools, viewMode, stakedOnly, normalizedUrlSearch }) => (
            <>
              {account && !userDataLoaded && stakedOnly && (
                <Flex justifyContent="center" mb="4px">
                  <Loading />
                </Flex>
              )}
              {viewMode === ViewMode.CARD ? (
                <CardLayout>
                  {chosenPools.map((pool) =>
                    pool.vaultKey ? (
                      <WayaVaultCard key={pool.vaultKey} pool={pool} showStakedOnly={stakedOnly} />
                    ) : (
                      <Pool.PoolCard<Token>
                        key={pool.poolId}
                        pool={pool}
                        isBoostedPool={Boolean(chainId && checkIsBoostedPool(pool.contractAddress, chainId))}
                        isStaked={Boolean(pool?.userData?.stakedBalance?.gt(0))}
                        cardContent={
                          account ? (
                            <CardActions pool={pool} stakedBalance={pool?.userData?.stakedBalance} />
                          ) : (
                            <>
                              <Text mb="10px" textTransform="uppercase" fontSize="12px" color="textSubtle" bold>
                                {t('Start earning')}
                              </Text>
                              <ConnectWalletButton />
                            </>
                          )
                        }
                        tokenPairImage={
                          <TokenPairImage
                            primaryToken={pool.earningToken}
                            secondaryToken={pool.stakingToken}
                            width={64}
                            height={64}
                          />
                        }
                        cardFooter={<CardFooter pool={pool} account={account ?? ''} />}
                        aprRow={<AprRow pool={pool} stakedBalance={pool?.userData?.stakedBalance} />}
                      />
                    ),
                  )}
                </CardLayout>
              ) : (
                <Pool.PoolsTable>
                  {chosenPools.map((pool) =>
                    pool.vaultKey ? (
                      <VaultPoolRow
                        initialActivity={normalizedUrlSearch.toLowerCase() === pool.earningToken.symbol?.toLowerCase()}
                        key={pool.vaultKey}
                        vaultKey={pool.vaultKey}
                        account={account ?? ''}
                      />
                    ) : (
                      <PoolRow
                        initialActivity={normalizedUrlSearch.toLowerCase() === pool.earningToken.symbol?.toLowerCase()}
                        key={pool.poolId}
                        poolId={pool.poolId}
                        account={account ?? ''}
                      />
                    ),
                  )}
                </Pool.PoolsTable>
              )}
            </>
          )}
        </PoolControls>
      </Page>
    </>
  )
}

export default Pools
