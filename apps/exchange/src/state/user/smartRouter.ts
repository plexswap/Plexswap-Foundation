import { userSingleHopAtom } from '@plexswap/utils/user'
import { atom, useAtom, useAtomValue } from 'jotai'
import atomWithStorageWithErrorCatch from 'utils/atomWithStorageWithErrorCatch'

const userUseStableSwapAtom = atomWithStorageWithErrorCatch<boolean>('pcs:useStableSwap', true)
const userUseCoreSwapAtom = atomWithStorageWithErrorCatch<boolean>('pcs:useCoreSwap', true)
const userUseExtendedSwapAtom = atomWithStorageWithErrorCatch<boolean>('pcs:useExtendedSwap', true)
const userUserSplitRouteAtom = atomWithStorageWithErrorCatch<boolean>('pcs:useSplitRouting', true)
const userUseMMLinkedPoolAtom = atomWithStorageWithErrorCatch<boolean>('pcs:useMMlinkedPool', true)

export function useUserStableSwapEnable() {
  return useAtom(userUseStableSwapAtom)
}

export function useUserCoreSwapEnable() {
  return useAtom(userUseCoreSwapAtom)
}

export function useUserExtendedSwapEnable() {
  return useAtom(userUseExtendedSwapAtom)
}

export function useUserSplitRouteEnable() {
  return useAtom(userUserSplitRouteAtom)
}

export function useMMLinkedPoolByDefault() {
  return useAtom(userUseMMLinkedPoolAtom)
}

const derivedOnlyOneAMMSourceEnabledAtom = atom((get) => {
  return [get(userUseStableSwapAtom), get(userUseCoreSwapAtom), get(userUseExtendedSwapAtom)].filter(Boolean).length === 1
})

export function useOnlyOneAMMSourceEnabled() {
  return useAtomValue(derivedOnlyOneAMMSourceEnabledAtom)
}

const derivedRoutingSettingChangedAtom = atom(
  (get) => {
    return [
      get(userUseStableSwapAtom),
      get(userUseCoreSwapAtom),
      get(userUseExtendedSwapAtom),
      get(userUserSplitRouteAtom),
      get(userUseMMLinkedPoolAtom),
      !get(userSingleHopAtom),
    ].some((x) => x === false)
  },
  (_, set) => {
    set(userUseStableSwapAtom, true)
    set(userUseCoreSwapAtom, true)
    set(userUseExtendedSwapAtom, true)
    set(userUserSplitRouteAtom, true)
    set(userUseMMLinkedPoolAtom, true)
    set(userSingleHopAtom, false)
  },
)

export function useRoutingSettingChanged() {
  return useAtom(derivedRoutingSettingChangedAtom)
}