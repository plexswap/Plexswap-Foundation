import { FarmWidget } from '@plexswap/widgets-internal'
import { Flex } from '@plexswap/ui-plex'
import { TokenPairImage } from 'components/TokenImage'

const { FarmTokenInfo } = FarmWidget.FarmTable

export const FarmCell: React.FunctionComponent<React.PropsWithChildren<FarmWidget.FarmTableFarmTokenInfoProps>> = ({
  token,
  quoteToken,
  label,
  pid,
  isReady,
  isStaking,
}) => {
  return (
    <Flex alignItems="center">
      <FarmTokenInfo
        pid={pid}
        label={label}
        token={token}
        quoteToken={quoteToken}
        isReady={isReady}
        isStaking={isStaking}
      >
        <TokenPairImage width={40} height={40} variant="inverted" primaryToken={token} secondaryToken={quoteToken} />
      </FarmTokenInfo>
    </Flex>
  )
}
