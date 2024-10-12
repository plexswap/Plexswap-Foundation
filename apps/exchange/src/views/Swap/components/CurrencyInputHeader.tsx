import { useTranslation } from '@plexswap/localization'
import { SwapWidget as Swap } from '@plexswap/widgets-internal'
import {
  Flex,
  HistoryIcon,
  IconButton,
  NotificationDot,
  Text,
  TooltipText,
  useModal,
  useTooltip
} from '@plexswap/ui-plex'
import { useExpertMode } from '@plexswap/utils/user'
import TransactionsModal from 'components/App/Transactions/TransactionsModal'
import InternalLink from 'components/Links'
import GlobalSettings from 'components/Menu/GlobalSettings'
import RefreshIcon from 'components/Svg/RefreshIcon'
import { CHAIN_REFRESH_TIME } from 'config/constants/exchange'
import { SUPPORT_BUY_CRYPTO } from 'config/constants/supportedChains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useAtom } from 'jotai'
import Image from 'next/image'
import { ReactElement, memo, useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import atomWithStorageWithErrorCatch from 'utils/atomWithStorageWithErrorCatch'
import BuyCryptoIcon from '../../../../public/images/MoneyBag.svg'
import { SettingsMode } from '../../../components/Menu/GlobalSettings/types'

interface Props {
  title: string | ReactElement
  subtitle: string
  noConfig?: boolean
  hasAmount: boolean
  onRefreshPrice: () => void
}

const mobileShowOnceTokenHighlightAtom = atomWithStorageWithErrorCatch('pcs::mobileShowOnceTokenHighlightCore', true)

const CurrencyInputHeader: React.FC<React.PropsWithChildren<Props>> = memo(
  ({ subtitle, title, hasAmount, onRefreshPrice }) => {
    const { t } = useTranslation()
    const { chainId } = useActiveChainId()
    const [mobileTooltipShowOnce, setMobileTooltipShowOnce] = useAtom(mobileShowOnceTokenHighlightAtom)
    const [mobileTooltipShow, setMobileTooltipShow] = useState(false)
    const {
      tooltip: buyCryptoTooltip,
      tooltipVisible: buyCryptoTooltipVisible,
      targetRef: buyCryptoTargetRef,
    } = useTooltip(<Text>{t('Buy crypto with fiat.')}</Text>, {
      placement: isMobile ? 'top' : 'bottom',
      trigger: isMobile ? 'focus' : 'hover',
      ...(isMobile && { manualVisible: mobileTooltipShow }),
    })

    const [expertMode] = useExpertMode()
    const [onPresentTransactionsModal] = useModal(<TransactionsModal />)

    const mobileTooltipClickOutside = useCallback(() => {
      setMobileTooltipShow(false)
    }, [])

    useEffect(() => {
      if (isMobile && !mobileTooltipShowOnce) {
        setMobileTooltipShow(true)
        setMobileTooltipShowOnce(true)
      }
    }, [mobileTooltipShowOnce, setMobileTooltipShowOnce])

    useEffect(() => {
      document.body.addEventListener('click', mobileTooltipClickOutside)
      return () => {
        document.body.removeEventListener('click', mobileTooltipClickOutside)
      }
    }, [mobileTooltipClickOutside])

    const titleContent = (
      <Flex width="100%" alignItems="center" justifyContent="space-between" flexDirection="column">
        <Flex flexDirection="column" alignItems="flex-start" width="100%" marginBottom={15}>
          <Swap.CurrencyInputHeaderTitle>{title}</Swap.CurrencyInputHeaderTitle>
        </Flex>
        <Flex justifyContent="start" width="100%" height="17px" alignItems="center" mb="14px">
          <Swap.CurrencyInputHeaderSubTitle>{subtitle}</Swap.CurrencyInputHeaderSubTitle>
        </Flex>
        <Flex width="100%" justifyContent="end">
          {SUPPORT_BUY_CRYPTO.includes(chainId) ? (
            <Flex alignItems="center" justifyContent="center" px="4px" mt="5px">
              <TooltipText
                ref={buyCryptoTargetRef}
                onClick={() => setMobileTooltipShow(false)}
                display="flex"
                style={{ justifyContent: 'center' }}
              >
                <InternalLink href="/buy-crypto">
                  <Image src={BuyCryptoIcon} alt="#" style={{ justifyContent: 'center' }} />
                </InternalLink>
              </TooltipText>
              {buyCryptoTooltipVisible && (!isMobile || mobileTooltipShow) && buyCryptoTooltip}
            </Flex>
          ) : null}
          <NotificationDot show={expertMode}>
            <GlobalSettings color="textSubtle" mr="0" mode={SettingsMode.SWAP_LIQUIDITY} />
          </NotificationDot>
          <IconButton onClick={onPresentTransactionsModal} variant="text" scale="sm">
            <HistoryIcon color="textSubtle" width="24px" />
          </IconButton>
          <IconButton variant="text" scale="sm" onClick={onRefreshPrice}>
            <RefreshIcon
              disabled={!hasAmount}
              color="textSubtle"
              width="27px"
              duration={CHAIN_REFRESH_TIME[chainId] ? CHAIN_REFRESH_TIME[chainId] / 1000 : undefined}
            />
          </IconButton>
        </Flex>
      </Flex>
    )

    return <Swap.CurrencyInputHeader title={titleContent} subtitle={<></>} />
  },
)

export default CurrencyInputHeader
