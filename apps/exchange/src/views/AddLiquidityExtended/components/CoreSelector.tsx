import { useTranslation } from '@plexswap/localization'
import { Text } from '@plexswap/ui-plex'
import { EvenWidthAutoRow } from 'components/Layout/EvenWidthAutoRow'
import { SelectButton } from 'components/SelectButton'
import { TOTAL_FEE } from 'config/constants/info'
import { useState } from 'react'

import { HandleFeePoolSelectFn, SELECTOR_TYPE } from '../types'
import HideShowSelectorSection from './HideShowSelectorSection'

export function CoreSelector({
  isStable,
  handleFeePoolSelect,
  selectorType,
}: {
  isStable: boolean
  selectorType: SELECTOR_TYPE
  handleFeePoolSelect: HandleFeePoolSelectFn
}) {
  const { t } = useTranslation()
  const [showOptions, setShowOptions] = useState(false)

  return (
    <HideShowSelectorSection
      showOptions={showOptions}
      setShowOptions={setShowOptions}
      heading={
        selectorType === SELECTOR_TYPE.STABLE ? (
          <Text>StableSwap LP</Text>
        ) : selectorType === SELECTOR_TYPE.CORE ? (
          <Text>
            CORE LP - {(TOTAL_FEE * 100).toFixed(2)} {t('fee tier')}
          </Text>
        ) : (
          <Text>EXTENDED LP</Text>
        )
      }
      content={
        <EvenWidthAutoRow gap="4px">
          {isStable ? (
            <SelectButton
              isActive={selectorType === SELECTOR_TYPE.STABLE}
              onClick={() => handleFeePoolSelect({ type: SELECTOR_TYPE.STABLE })}
            >
              StableSwap LP
            </SelectButton>
          ) : (
            <SelectButton
              isActive={selectorType === SELECTOR_TYPE.EXTENDED}
              onClick={() => handleFeePoolSelect({ type: SELECTOR_TYPE.EXTENDED })}
            >
              EXTENDED LP
            </SelectButton>
          )}
          <SelectButton
            isActive={selectorType === SELECTOR_TYPE.CORE}
            onClick={() => handleFeePoolSelect({ type: SELECTOR_TYPE.CORE })}
          >
            CORE LP
          </SelectButton>
        </EvenWidthAutoRow>
      }
    />
  )
}
