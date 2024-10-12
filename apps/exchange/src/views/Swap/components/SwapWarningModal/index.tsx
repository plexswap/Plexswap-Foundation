import { ChainId } from '@plexswap/chains'
import { useTranslation } from '@plexswap/localization'
import { WrappedTokenInfo } from '@plexswap/metalists'
import { Box, Heading, Message, ModalBody, ModalContainer, ModalHeader } from '@plexswap/ui-plex'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useTheme from 'hooks/useTheme'
import { styled } from 'styled-components'
import BSC_WARNING_LIST from './56'
import Acknowledgement from './Acknowledgement'

const StyledModalContainer = styled(ModalContainer)`
  max-width: 440px;
`

const MessageContainer = styled(Message)`
  align-items: flex-start;
  justify-content: flex-start;
`

interface SwapWarningModalProps {
  swapCurrency: WrappedTokenInfo
  onDismiss?: () => void
}

const SwapWarningModal: React.FC<React.PropsWithChildren<SwapWarningModalProps>> = ({ swapCurrency, onDismiss }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { chainId } = useActiveChainId()

  const TOKEN_WARNINGS = {
    [ChainId.BSC]: BSC_WARNING_LIST,
  }

  const SWAP_WARNING = chainId ? TOKEN_WARNINGS?.[chainId]?.[swapCurrency.address] : undefined

  return (
    <StyledModalContainer minWidth="280px">
      <ModalHeader background={theme.colors.gradientCardHeader}>
        <Heading p="12px 24px">{t('Notice for trading %symbol%', { symbol: SWAP_WARNING?.symbol })}</Heading>
      </ModalHeader>
      <ModalBody p="24px">
        <MessageContainer variant="warning" mb="24px">
          <Box>{SWAP_WARNING?.component}</Box>
        </MessageContainer>
        <Acknowledgement handleContinueClick={onDismiss} />
      </ModalBody>
    </StyledModalContainer>
  )
}

export default SwapWarningModal