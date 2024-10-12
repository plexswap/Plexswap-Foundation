import { useTranslation } from '@plexswap/localization'
import { Box, Modal } from '@plexswap/ui-plex'
import { getBalanceNumber, getDecimalAmount } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import useTheme from 'hooks/useTheme'
import { useEffect, useMemo, useState } from 'react'
import { VaultKey } from '@plexswap/pools'
import { useCheckVaultApprovalStatus } from '../../../hooks/useApprove'
import BalanceField from '../Common/BalanceField'
import LockedBodyModal from '../Common/LockedModalBody'
import { GenericModalProps } from '../types'
import RoiCalculatorModalProvider from './RoiCalculatorModalProvider'

const LockedStakeModal: React.FC<React.PropsWithChildren<GenericModalProps>> = ({
  onDismiss,
  currentBalance,
  stakingToken,
  stakingTokenPrice,
  stakingTokenBalance,
  customLockAmount,
  customLockWeekInSeconds,
}) => {
  const { theme } = useTheme()
  const [lockedAmount, setLockedAmount] = useState('')
  const { t } = useTranslation()

  useEffect(() => {
    if (customLockAmount) {
      setLockedAmount(customLockAmount)
    }
  }, [customLockAmount])

  const usdValueStaked = useMemo(
    () =>
      getBalanceNumber(
        getDecimalAmount(new BigNumber(lockedAmount), stakingToken.decimals).multipliedBy(stakingTokenPrice ?? 0),
        stakingToken.decimals,
      ),
    [lockedAmount, stakingTokenPrice, stakingToken.decimals],
  )

  const { allowance } = useCheckVaultApprovalStatus(VaultKey.WayaVault)
  const needApprove = useMemo(() => {
    const amount = getDecimalAmount(new BigNumber(lockedAmount))
    return amount.gt(allowance)
  }, [allowance, lockedAmount])

  return (
    <RoiCalculatorModalProvider lockedAmount={lockedAmount}>
      <Modal title={t('Lock WAYA')} onDismiss={onDismiss} headerBackground={theme.colors.gradientCardHeader}>
        <Box mb="16px">
          <BalanceField
            stakingAddress={stakingToken.address}
            stakingSymbol={stakingToken.symbol}
            stakingDecimals={stakingToken.decimals}
            lockedAmount={lockedAmount}
            usdValueStaked={usdValueStaked}
            stakingMax={currentBalance}
            setLockedAmount={setLockedAmount}
            stakingTokenBalance={stakingTokenBalance}
            needApprove={needApprove}
          />
        </Box>
        <LockedBodyModal
          currentBalance={currentBalance}
          stakingToken={stakingToken}
          stakingTokenPrice={stakingTokenPrice}
          onDismiss={onDismiss}
          lockedAmount={new BigNumber(lockedAmount)}
          customLockWeekInSeconds={customLockWeekInSeconds}
        />
      </Modal>
    </RoiCalculatorModalProvider>
  )
}

export default LockedStakeModal
