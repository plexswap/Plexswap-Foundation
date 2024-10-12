import { useMemo } from 'react'
import { createFormAtom, RemoveLiquidityAtomProvider } from 'state/burn/reducer'

export default function RemoveLiquidityCoreFormProvider({ children }: { children: React.ReactNode }) {
  const formAtom = useMemo(() => createFormAtom(), [])

  return (
    <RemoveLiquidityAtomProvider
      value={{
        formAtom,
      }}
    >
      {children}
    </RemoveLiquidityAtomProvider>
  )
}
