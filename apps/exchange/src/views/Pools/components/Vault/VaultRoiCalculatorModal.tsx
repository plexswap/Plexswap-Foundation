import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import {
    Box,
    ButtonMenu,
    ButtonMenuItem,
    CalculatorMode,
    RoiCalculatorModal,
    RoiCalculatorModalProps
} from '@plexswap/ui-plex'

import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { getRoi } from '@plexswap/utils/compoundApyHelpers'
import { useVaultApy } from 'hooks/useVaultApy'
import { useEffect, useMemo, useState } from 'react'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { VaultKey } from '@plexswap/pools'

import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { useAccount } from 'wagmi'
import LockDurationField from '../LockedPool/Common/LockDurationField'
import { weeksToSeconds } from '../utils/formatSecondsToWeeks'

export const VaultRoiCalculatorModal = ({
  pool,
  initialView,
  ...rest
}: { pool: Pool.DeserializedPool<Token>; initialView?: number } & Partial<RoiCalculatorModalProps>) => {
  const { userData } = useVaultPoolByKey(pool.vaultKey)

  const wayaAsBigNumber = userData?.balance?.wayaAsBigNumber
  const { getLockedApy, flexibleApy } = useVaultApy()
  const { t } = useTranslation()
  const { address: account } = useAccount()

  const [wayaVaultView, setWayaVaultView] = useState(initialView || 0)

  const [duration, setDuration] = useState(() => weeksToSeconds(1))

  const buttonMenuItems = useMemo(
    () => [
      <ButtonMenuItem key="Flexible">{t('Flexible')}</ButtonMenuItem>,
      <ButtonMenuItem key="Locked">{t('Locked')}</ButtonMenuItem>,
    ],
    [t],
  )

  const apy = useMemo(() => {
    return wayaVaultView === 0 ? flexibleApy : getLockedApy(duration)
  }, [wayaVaultView, getLockedApy, flexibleApy, duration])

  const [isMaxSelected, setIsMaxSelected] = useState(false)

  return (
    <RoiCalculatorModal
      isLocked={wayaVaultView === 1}
      account={account}
      stakingTokenSymbol={pool.stakingToken.symbol}
      apy={+(apy ?? 0)}
      initialState={{
        controls: {
          compounding: false, // no compounding if apy is specify
        },
      }}
      linkHref="/swap"
      linkLabel={t('Get %symbol%', { symbol: pool.stakingToken.symbol })}
      earningTokenPrice={pool.earningTokenPrice ?? 0}
      stakingTokenPrice={pool.stakingTokenPrice ?? 0}
      stakingTokenBalance={
        (pool.userData?.stakingTokenBalance
          ? wayaAsBigNumber?.plus(pool.userData?.stakingTokenBalance)
          : wayaAsBigNumber) ?? BIG_ZERO
      }
      stakingTokenDecimals={pool.stakingToken.decimals}
      autoCompoundFrequency={1}
      strategy={
        wayaVaultView
          ? (state, dispatch) => (
              <LockedRoiStrategy
                state={state}
                dispatch={dispatch}
                stakingTokenPrice={pool.stakingTokenPrice}
                earningTokenPrice={pool.earningTokenPrice}
                duration={duration}
              />
            )
          : null
      }
      header={
        pool.vaultKey === VaultKey.WayaVault ? (
          <ButtonMenu
            mb="24px"
            fullWidth
            scale="sm"
            variant="subtle"
            activeIndex={wayaVaultView}
            onItemClick={setWayaVaultView}
          >
            {buttonMenuItems}
          </ButtonMenu>
        ) : (
          <></>
        )
      }
      {...rest}
    >
      {wayaVaultView && (
        <Box mt="16px">
          <LockDurationField
            duration={duration}
            setDuration={setDuration}
            isOverMax={false}
            isMaxSelected={isMaxSelected}
            setIsMaxSelected={setIsMaxSelected}
          />
        </Box>
      )}
    </RoiCalculatorModal>
  )
}

function LockedRoiStrategy({ state, dispatch, earningTokenPrice, duration, stakingTokenPrice }) {
  const { getLockedApy } = useVaultApy()
  const { principalAsUSD, roiUSD } = state.data
  const { compounding, compoundingFrequency, stakingDuration, mode } = state.controls

  useEffect(() => {
    if (mode === CalculatorMode.ROI_BASED_ON_PRINCIPAL) {
      const principalInUSDAsNumber = parseFloat(principalAsUSD)
      const interest =
        (principalInUSDAsNumber / earningTokenPrice) * (+getLockedApy(duration)! / 100) * (duration / 31449600)

      const hasInterest = !Number.isNaN(interest)
      const roiTokens = hasInterest ? interest : 0
      const roiAsUSD = hasInterest ? roiTokens * earningTokenPrice : 0
      const roiPercentage = hasInterest
        ? getRoi({
            amountEarned: roiAsUSD,
            amountInvested: principalInUSDAsNumber,
          })
        : 0
      dispatch({ type: 'setRoi', payload: { roiUSD: roiAsUSD, roiTokens, roiPercentage } })
    }
  }, [
    principalAsUSD,
    stakingDuration,
    earningTokenPrice,
    compounding,
    compoundingFrequency,
    mode,
    duration,
    dispatch,
    getLockedApy,
  ])

  useEffect(() => {
    if (mode === CalculatorMode.PRINCIPAL_BASED_ON_ROI) {
      const principalUSD = roiUSD / (+getLockedApy(duration)! / 100) / (duration / 31449600)
      const roiPercentage = getRoi({
        amountEarned: roiUSD,
        amountInvested: principalUSD,
      })
      const principalToken = principalUSD / stakingTokenPrice
      dispatch({
        type: 'setPrincipalForTargetRoi',
        payload: {
          principalAsUSD: principalUSD.toFixed(2),
          principalAsToken: principalToken.toFixed(10),
          roiPercentage,
        },
      })
    }
  }, [dispatch, duration, getLockedApy, mode, roiUSD, stakingTokenPrice])

  return null
}
