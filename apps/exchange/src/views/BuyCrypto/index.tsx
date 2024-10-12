import { useDefaultsFromURLSearch } from 'state/buyCrypto/hooks'
import { useAccount } from 'wagmi'
import Page from '../Page'
import { BuyCryptoForm } from './containers/BuyCryptoForm'
import { StyledAppBody } from './styles'

export default function BuyCrypto() {
  const { address } = useAccount()
  useDefaultsFromURLSearch(address)

  return (
    <Page>
      <StyledAppBody mb="24px">
        <BuyCryptoForm />
      </StyledAppBody>
    </Page>
  )
}
