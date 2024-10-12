import { ChainId } from '@plexswap/chains'
import { useTranslation } from '@plexswap/localization'
import {
  AtomBox,
  AutoColumn,
  AutoRow,
  Button,
  ButtonProps,
  Checkbox,
  Flex,
  InjectedModalProps,
  Message,
  MessageText,
  Modal,
  ModalCore,
  NotificationDot,
  PlexToggle,
  PreTitle,
  QuestionHelper,
  RowFixed,
  Text,
  Toggle
} from '@plexswap/ui-plex'

import { ExpertModal } from '@plexswap/widgets-internal'

import {
  useExpertMode,
  useUserExpertModeAcknowledgement,
  useUserSingleHopOnly
} from '@plexswap/utils/user'

import { useActiveChainId } from 'hooks/useActiveChainId'
import { ReactNode, useCallback, useState } from 'react'
import { useSwapActionHandlers } from 'state/swap/useSwapActionHandlers'
import {
  useOnlyOneAMMSourceEnabled,
  useRoutingSettingChanged,
  useUserCoreSwapEnable,
  useUserExtendedSwapEnable,
  useUserSplitRouteEnable,
  useUserStableSwapEnable,
} from 'state/user/smartRouter'
import { styled } from 'styled-components'
import GasSettings from './GasSettings'
import TransactionSettings from './TransactionSettings'
import { SettingsMode } from './types'

const ScrollableContainer = styled(Flex)`
  flex-direction: column;
  height: auto;
  ${({ theme }) => theme.mediaQueries.xs} {
    max-height: 90vh;
  }
  ${({ theme }) => theme.mediaQueries.md} {
    max-height: none;
  }
`

export const withCustomOnDismiss =
  (Component) =>
  ({
    onDismiss,
    customOnDismiss,
    mode,
    ...props
  }: {
    onDismiss?: () => void
    customOnDismiss: () => void
    mode: SettingsMode
  }) => {
    const handleDismiss = useCallback(() => {
      onDismiss?.()
      if (customOnDismiss) {
        customOnDismiss()
      }
    }, [customOnDismiss, onDismiss])

    return <Component {...props} mode={mode} onDismiss={handleDismiss} />
  }

const SettingsModal: React.FC<React.PropsWithChildren<InjectedModalProps>> = ({ onDismiss, mode }) => {
  const [showConfirmExpertModal, setShowConfirmExpertModal] = useState(false)
  const [showExpertModeAcknowledgement, setShowExpertModeAcknowledgement] = useUserExpertModeAcknowledgement()
  const [expertMode, setExpertMode] = useExpertMode()

  const { onChangeRecipient } = useSwapActionHandlers()
  const { chainId } = useActiveChainId()
  const { t } = useTranslation()

  if (showConfirmExpertModal) {
    return (
      <ExpertModal
        setShowConfirmExpertModal={setShowConfirmExpertModal}
        onDismiss={onDismiss}
        toggleExpertMode={() => setExpertMode((s) => !s)}
        setShowExpertModeAcknowledgement={setShowExpertModeAcknowledgement}
      />
    )
  }

  const handleExpertModeToggle = () => {
    if (expertMode || !showExpertModeAcknowledgement) {
      onChangeRecipient(null)
      setExpertMode((s) => !s)
    } else {
      setShowConfirmExpertModal(true)
    }
  }

  return (
    <Modal title={t('Settings')} headerBackground="gradientCardHeader" onDismiss={onDismiss}>
      <ScrollableContainer>
        {mode === SettingsMode.GLOBAL && (
          <>
            <Flex pb="24px" flexDirection="column">
              <PreTitle mb="24px">{t('Global')}</PreTitle>
            </Flex>
          </>
        )}
        {mode === SettingsMode.SWAP_LIQUIDITY && (
          <>
            <Flex pt="3px" flexDirection="column">
              <PreTitle>{t('Swaps & Liquidity')}</PreTitle>
              <Flex justifyContent="space-between" alignItems="center" mb="24px">
                {chainId === ChainId.BSC && <GasSettings />}
              </Flex>
              <TransactionSettings />
            </Flex>
            <Flex justifyContent="space-between" alignItems="center" mb="24px">
              <Flex alignItems="center">
                <Text>{t('Expert Mode')}</Text>
                <QuestionHelper
                  text={t('Bypasses confirmation modals and allows high slippage trades. Use at your own risk.')}
                  placement="top"
                  ml="4px"
                />
              </Flex>
              <Toggle
                id="toggle-expert-mode-button"
                scale="md"
                checked={expertMode}
                onChange={handleExpertModeToggle}
              />
            </Flex>
           <RoutingSettingsButton />
          </>
        )}
      </ScrollableContainer>
    </Modal>
  )
}

export default SettingsModal

export function RoutingSettingsButton({
  children,
  showRedDot = true,
  buttonProps,
}: {
  children?: ReactNode
  showRedDot?: boolean
  buttonProps?: ButtonProps
}) {
  const [show, setShow] = useState(false)
  const { t } = useTranslation()
  const [isRoutingSettingChange] = useRoutingSettingChanged()
  const handleDismiss = useCallback(() => setShow(false), [])
  return (
    <>
      <AtomBox textAlign="center">
        <NotificationDot show={isRoutingSettingChange && showRedDot}>
          <Button variant="text" onClick={() => setShow(true)} scale="sm" {...buttonProps}>
            {children || t('Customize Routing')}
          </Button>
        </NotificationDot>
      </AtomBox>
      <ModalCore isOpen={show} onDismiss={handleDismiss} closeOnOverlayClick>
        <RoutingSettings />
      </ModalCore>
    </>
  )
}

function RoutingSettings() {
  const { t } = useTranslation()

  const [isStableSwapByDefault, setIsStableSwapByDefault] = useUserStableSwapEnable()
  const [coreEnable, setCoreEnable] = useUserCoreSwapEnable()
  const [extendedEnable, setExtendedEnable] = useUserExtendedSwapEnable()
  const [split, setSplit] = useUserSplitRouteEnable()
  const [singleHopOnly, setSingleHopOnly] = useUserSingleHopOnly()
  const onlyOneAMMSourceEnabled = useOnlyOneAMMSourceEnabled()
  const [isRoutingSettingChange, reset] = useRoutingSettingChanged()

  return (
    <Modal
      title={t('Customize Routing')}
      headerRightSlot={
        isRoutingSettingChange && (
          <Button variant="text" scale="sm" onClick={reset}>
            {t('Reset')}
          </Button>
        )
      }
    >
      <AutoColumn
        width={{
          xs: '100%',
          md: 'screenSm',
        }}
        gap="16px"
      >
        <AtomBox>
          <PreTitle mb="24px">{t('Liquidity source')}</PreTitle>
          <Flex justifyContent="space-between" alignItems="center" mb="24px">
            <Flex alignItems="center">
              <Text>Plexswap Extended</Text>
              <QuestionHelper
                text={
                  <Flex>
                    <Text mr="5px">
                      {t(
                        'Extended offers concentrated liquidity to provide deeper liquidity for traders with the same amount of capital, offering lower slippage and more flexible trading fee tiers.',
                      )}
                    </Text>
                  </Flex>
                }
                placement="top"
                ml="4px"
              />
            </Flex>
            <Toggle
              disabled={extendedEnable && onlyOneAMMSourceEnabled}
              scale="md"
              checked={extendedEnable}
              onChange={() => setExtendedEnable((s) => !s)}
            />
          </Flex>
          <Flex justifyContent="space-between" alignItems="center" mb="24px">
            <Flex alignItems="center">
              <Text>Plexswap Core</Text>
              <QuestionHelper
                text={
                  <Flex flexDirection="column">
                    <Text mr="5px">
                      {t('The Core exchange is where a number of iconic, popular assets are traded.')}
                    </Text>
                    <Text mr="5px" mt="1em">
                      {t('Recommend leaving this on to ensure better trades.')}
                    </Text>
                  </Flex>
                }
                placement="top"
                ml="4px"
              />
            </Flex>
            <Toggle
              disabled={coreEnable && onlyOneAMMSourceEnabled}
              scale="md"
              checked={coreEnable}
              onChange={() => setCoreEnable((s) => !s)}
            />
          </Flex>
          <Flex justifyContent="space-between" alignItems="center" mb="24px">
            <Flex alignItems="center">
              <Text>Plexswap {t('StableSwap')}</Text>
              <QuestionHelper
                text={
                  <Flex flexDirection="column">
                    <Text mr="5px">
                      {t(
                        'StableSwap provides higher efficiency for stable or pegged assets and lower fees for trades.',
                      )}
                    </Text>
                  </Flex>
                }
                placement="top"
                ml="4px"
              />
            </Flex>
            <PlexToggle
              disabled={isStableSwapByDefault && onlyOneAMMSourceEnabled}
              id="stable-swap-toggle"
              scale="md"
              checked={isStableSwapByDefault}
              onChange={() => {
                setIsStableSwapByDefault((s) => !s)
              }}
            />
          </Flex>
          {onlyOneAMMSourceEnabled && (
            <Message variant="warning">
              <MessageText>
                {t('At least one AMM liquidity source has to be enabled to support normal trading.')}
              </MessageText>
            </Message>
          )}
        </AtomBox>
        <AtomBox>
          <PreTitle mb="24px">{t('Routing preference')}</PreTitle>
          <AutoRow alignItems="center" mb="24px">
            <RowFixed as="label" gap="16px">
              <Checkbox
                id="toggle-disable-multihop-button"
                checked={!singleHopOnly}
                scale="sm"
                onChange={() => {
                  setSingleHopOnly((s) => !s)
                }}
              />
              <Text>{t('Allow Multihops')}</Text>
            </RowFixed>
            <QuestionHelper
              text={
                <Flex flexDirection="column">
                  <Text mr="5px">
                    {t(
                      'Multihops enables token swaps through multiple hops between several pools to achieve the best deal.',
                    )}
                  </Text>
                  <Text mr="5px" mt="1em">
                    {t(
                      'Turning this off will only allow direct swap, which may cause higher slippage or even fund loss.',
                    )}
                  </Text>
                </Flex>
              }
              placement="top"
              ml="4px"
            />
          </AutoRow>
          <AutoRow alignItems="center" mb="24px">
            <RowFixed alignItems="center" as="label" gap="16px">
              <Checkbox
                id="toggle-disable-multihop-button"
                checked={split}
                scale="sm"
                onChange={() => {
                  setSplit((s) => !s)
                }}
              />
              <Text>{t('Allow Split Routing')}</Text>
            </RowFixed>
            <QuestionHelper
              text={
                <Flex flexDirection="column">
                  <Text mr="5px">
                    {t('Split routing enables token swaps to be broken into multiple routes to achieve the best deal.')}
                  </Text>
                  <Text mr="5px" mt="1em">
                    {t(
                      'Turning this off will only allow a single route, which may result in low efficiency or higher slippage.',
                    )}
                  </Text>
                </Flex>
              }
              placement="top"
              ml="4px"
            />
          </AutoRow>
        </AtomBox>
      </AutoColumn>
    </Modal>
  )
}