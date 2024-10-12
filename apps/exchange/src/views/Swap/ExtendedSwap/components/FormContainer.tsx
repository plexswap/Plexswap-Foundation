import { Column } from '@plexswap/ui-plex'
import { PropsWithChildren, memo } from 'react'

import { Wrapper } from '../../components/styleds'

export const FormContainer = memo(function FormContainer({ children }: PropsWithChildren) {
  return (
    <Wrapper id="swap-page" style={{ minHeight: '412px' }}>
      <Column gap="sm">{children}</Column>
    </Wrapper>
  )
})
