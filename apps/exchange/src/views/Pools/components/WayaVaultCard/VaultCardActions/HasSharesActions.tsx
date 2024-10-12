import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import {
    AddIcon,
    Balance,
    Flex,
    IconButton,
    MinusIcon,
    Skeleton,
    Text,
    useModal
} from '@plexswap/ui-plex'
import { VaultKey } from '@plexswap/pools'
import { Token } from '@plexswap/sdk-core'
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { LightGreyCard } from 'components/Card'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useVaultPoolByKey } from 'state/pools/hooks'
import NotEnoughTokensModal from '../../Modals/NotEnoughTokensModal'
import VaultStakeModal from '../VaultStakeModal'

interface HasStakeActionProps {
  pool: Pool.DeserializedPool<Token>
  stakingTokenBalance: BigNumber
  performanceFee?: number
}

const HasSharesActions: React.FC<React.PropsWithChildren<HasStakeActionProps>> = ({
  pool,
  stakingTokenBalance,
  performanceFee,
}) => {
  const { userData } = useVaultPoolByKey(pool.vaultKey ?? VaultKey.WayaVaultV1)

  const wayaAsBigNumber = userData?.balance?.wayaAsBigNumber
  const wayaAsNumberBalance = userData?.balance?.wayaAsNumberBalance
  const { stakingToken } = pool
  const wayaPriceBusd = useWayaPrice()
  const stakedDollarValue = wayaPriceBusd.gt(0)
    ? getBalanceNumber(wayaAsBigNumber?.multipliedBy(wayaPriceBusd), stakingToken.decimals)
    : 0

  const [onPresentTokenRequired] = useModal(<NotEnoughTokensModal tokenSymbol={stakingToken.symbol} />)
  const [onPresentStake] = useModal(
    <VaultStakeModal stakingMax={stakingTokenBalance} performanceFee={performanceFee} pool={pool} />,
  )
  const [onPresentUnstake] = useModal(
    <VaultStakeModal stakingMax={wayaAsBigNumber ?? new BigNumber(0)} pool={pool} isRemovingStake />,
    true,
    true,
    `withdraw-vault-${pool.poolId}-${pool.vaultKey}`,
  )
  return (
    <LightGreyCard>
      <Flex mb="16px" justifyContent="space-between" alignItems="center">
        <Flex flexDirection="column">
          <Balance fontSize="20px" bold value={wayaAsNumberBalance ?? 0} decimals={5} />
          <Text as={Flex} fontSize="12px" color="textSubtle" flexWrap="wrap">
            {wayaPriceBusd.gt(0) ? (
              <Balance
                value={stakedDollarValue}
                fontSize="12px"
                color="textSubtle"
                decimals={2}
                prefix="~"
                unit=" USD"
              />
            ) : (
              <Skeleton mt="1px" height={16} width={64} />
            )}
          </Text>
        </Flex>
        <Flex>
          <IconButton
            variant="secondary"
            onClick={() => {
              onPresentUnstake()
            }}
            mr="6px"
          >
            <MinusIcon color="primary" width="24px" />
          </IconButton>
          <IconButton
            disabled
            variant="secondary"
            onClick={stakingTokenBalance.gt(0) ? onPresentStake : onPresentTokenRequired}
          >
            <AddIcon color="primary" width="24px" height="24px" />
          </IconButton>
        </Flex>
      </Flex>
    </LightGreyCard>
  )
}

export default HasSharesActions
