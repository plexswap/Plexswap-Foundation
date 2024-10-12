import { Box } from '@plexswap/ui-plex'
import { memo, useContext } from 'react'

import AccessRisk from 'components/AccessRisk'

import { UnsafeCurrency } from 'config/constants/types'
import { SwapFeaturesContext } from '../../SwapFeaturesContext'

interface Props {
  currency?: UnsafeCurrency
}

export const RiskCheck = memo(function RiskCheck({ currency }: Props) {
  const { isAccessTokenSupported } = useContext(SwapFeaturesContext)

  if (!isAccessTokenSupported || !currency?.isToken) {
    return null
  }

  return (
    <Box>
      <AccessRisk token={currency} />
    </Box>
  )
})
