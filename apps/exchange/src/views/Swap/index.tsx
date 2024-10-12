import { Flex } from '@plexswap/ui-plex'
import { AppBody } from 'components/App'
import { useDefaultsFromURLSearch } from 'state/swap/hooks'
import Page from '../Page'
import { ExtendedSwapForm } from './ExtendedSwap'
import { StyledInputCurrencyWrapper, StyledSwapContainer } from './styles'

export default function Swap() {

  useDefaultsFromURLSearch()

  return (
    <Page>
      <Flex width={['328px', '100%']} height="100%" justifyContent="center" position="relative" alignItems="flex-start">
        <Flex flexDirection="column">
          <StyledSwapContainer>
            <StyledInputCurrencyWrapper mt='0'>
              <AppBody>
                <ExtendedSwapForm />
              </AppBody>
            </StyledInputCurrencyWrapper>
          </StyledSwapContainer>
        </Flex>
      </Flex>
    </Page>
  )
}