import { Token } from '@plexswap/sdk-core'
import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import StakeModal from '../../Modals/StakeModal'

export default Pool.withStakeActions<Token>(StakeModal)
