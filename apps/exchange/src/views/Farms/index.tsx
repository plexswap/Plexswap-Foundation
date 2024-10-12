import { ConnectorNames } from 'config/wallet'
import { ExtendEthereum } from 'global'
import { useAccount } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import FarmsExtended from './FarmsExtended'
import { FarmsContext, FarmsExtendedContext } from './context'

export function useIsBloctoETH() {
  const { chain } = useAccount()
  const { isConnected, connector } = useAccount()
  const isETH = chain?.id === mainnet.id
  return (
    (connector?.id === ConnectorNames.Blocto ||
      (typeof window !== 'undefined' && Boolean((window.ethereum as ExtendEthereum)?.isBlocto))) &&
    isConnected &&
    isETH
  )
}

export const FarmsExtendedPageLayout: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return <FarmsExtended>{children}</FarmsExtended>
}

export { FarmsContext, FarmsExtendedContext }
