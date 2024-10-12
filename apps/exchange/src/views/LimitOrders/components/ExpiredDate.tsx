import { constants } from '@gelatonetwork/limit-orders-lib'
import { useTranslation } from '@plexswap/localization'
import { Flex, HelpIcon, Text, useTooltip } from '@plexswap/ui-plex'

const ExpiredDate = () => {
  const { t } = useTranslation()

  const { targetRef, tooltip, tooltipVisible } = useTooltip(
    <Text>{t('After your order is expired it might never be executed. Please cancel your order once expired')}</Text>,
    { placement: 'bottom' },
  )

  const expiryDate = new Date(Date.now() + constants.MAX_LIFETIME_IN_SECONDS * 1000).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: 'numeric',
  })

  return (
    <Flex justifySelf="flex-end" minHeight="16px">
      <Text fontSize="14px" small color="textSubtle" mr="4px">
        {t('Expiration Date: %expiryDate%', { expiryDate })}
      </Text>
      <span ref={targetRef}>
        <HelpIcon color="textSubtle" />
        {tooltipVisible && tooltip}
      </span>
    </Flex>
  )
}

export default ExpiredDate
