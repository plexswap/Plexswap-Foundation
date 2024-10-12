import { Flex, Text } from '@plexswap/ui-plex'
import React from 'react'
import { useTranslation } from '@plexswap/localization'
import { ORDER_CATEGORY } from '../../types'

const NoOrdersMessage: React.FC<React.PropsWithChildren<{ orderCategory: ORDER_CATEGORY }>> = ({ orderCategory }) => {
  const { t } = useTranslation()

  return (
    <Flex p="24px" justifyContent="center" alignItems="center" flexDirection="column">

      <Text color="textDisabled">
        {orderCategory === ORDER_CATEGORY.Open ? t('No Open Orders') : t('No Order History')}
      </Text>
    </Flex>
  )
}

export default NoOrdersMessage
