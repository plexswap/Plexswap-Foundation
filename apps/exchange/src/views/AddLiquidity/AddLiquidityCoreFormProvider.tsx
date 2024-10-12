import { useMemo } from 'react'
import { AddLiquidityAtomProvider, createFormAtom } from 'state/mint/reducer'

export default function AddLiquidityCoreFormProvider({ children }: { children: React.ReactNode }) {
  const formAtom = useMemo(() => createFormAtom(), [])

  return (
    <AddLiquidityAtomProvider
      value={{
        formAtom,
      }}
    >
      {children}
    </AddLiquidityAtomProvider>
  )
}
