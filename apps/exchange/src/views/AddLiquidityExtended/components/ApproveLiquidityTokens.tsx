import { useTranslation } from '@plexswap/localization'
import { Currency, CurrencyAmount } from '@plexswap/sdk-core'
import { Button, Dots, RowBetween } from '@plexswap/ui-plex'
import { ApprovalState } from 'hooks/useApproveCallback'
import { Field } from 'state/mint/actions'
import { Address } from 'viem'

interface ApproveLiquidityTokensProps {
  currencies: {
    [Field.CURRENCY_A]?: Currency
    [Field.CURRENCY_B]?: Currency
  }
  shouldShowApprovalGroup: boolean
  showFieldAApproval: boolean
  approveACallback: () => Promise<{ hash: Address } | undefined>
  revokeACallback: () => Promise<{ hash: Address } | undefined>
  currentAllowanceA: CurrencyAmount<Currency> | undefined
  approvalA: ApprovalState
  showFieldBApproval: boolean
  approveBCallback: () => Promise<{ hash: Address } | undefined>
  revokeBCallback: () => Promise<{ hash: Address } | undefined>
  currentAllowanceB: CurrencyAmount<Currency> | undefined
  approvalB: ApprovalState
}

export default function ApproveLiquidityTokens({
  shouldShowApprovalGroup,
  showFieldAApproval,
  approvalA,
  approveACallback,
  currencies,
  showFieldBApproval,
  approvalB,
  approveBCallback,
}: ApproveLiquidityTokensProps) {
  const { t } = useTranslation()

  return shouldShowApprovalGroup ? (
    <RowBetween style={{ gap: '8px' }}>
      {showFieldAApproval &&
        ( <Button onClick={approveACallback} disabled={approvalA === ApprovalState.PENDING} width="100%">
            {approvalA === ApprovalState.PENDING ? (
              <Dots>{t('Enabling %asset%', { asset: currencies[Field.CURRENCY_A]?.symbol })}</Dots>
            ) : (
              t('Enable %asset%', { asset: currencies[Field.CURRENCY_A]?.symbol })
            )}
          </Button>
        )}
      {showFieldBApproval &&
        ( <Button onClick={approveBCallback} disabled={approvalB === ApprovalState.PENDING} width="100%">
            {approvalB === ApprovalState.PENDING ? (
              <Dots>{t('Enabling %asset%', { asset: currencies[Field.CURRENCY_B]?.symbol })}</Dots>
            ) : (
              t('Enable %asset%', { asset: currencies[Field.CURRENCY_B]?.symbol })
            )}
          </Button>
        )}
    </RowBetween>
  ) : null
}