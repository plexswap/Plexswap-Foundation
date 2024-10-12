import {
  MenuItemsType,
  DropdownMenuItemType,
  SwapIcon,
  SwapFillIcon,
  EarnFillIcon,
  EarnIcon,
  MoreIcon,
} from '@plexswap/ui-plex'
import { ContextApi } from '@plexswap/localization'

import { DropdownMenuItems } from '@plexswap/ui-plex/src/components/DropdownMenu/types'
import { SUPPORT_BUY_CRYPTO, SUPPORT_FARMS, SUPPORT_ONLY_BSC, SUPPORT_POOLS } from 'config/constants/supportedChains'

export type ConfigMenuDropDownItemsType = DropdownMenuItems & { hideSubNav?: boolean }
export type ConfigMenuItemsType = Omit<MenuItemsType, 'items'> & { hideSubNav?: boolean; image?: string } & {
  items?: ConfigMenuDropDownItemsType[]
}

const addMenuItemSupported = (item, chainId) => {
  if (!chainId || !item.supportChainIds) {
    return item
  }
  if (item.supportChainIds?.includes(chainId)) {
    return item
  }
  return {
    ...item,
    disabled: true,
  }
}

const config: (t: ContextApi['t'], isDark: boolean, languageCode?: string, chainId?: number) => ConfigMenuItemsType[] =
  (t, isDark, languageCode, chainId) =>
    [
      {
        label: t('Trade'),
        icon: SwapIcon,
        fillIcon: SwapFillIcon,
        href: '/swap',
        showItemsOnMobile: false,
        items: [
          {
            label: t('Swap'),
            href: '/swap',
          },
          {
            label: t('Liquidity'),
            href: '/liquidity',
          },
          {
            label: t('Limit'),
            href: '/limit-orders',
            supportChainIds: SUPPORT_ONLY_BSC,
          },
          {
            label: t('Bridge'),
            href: 'https://bridge.plexfinance.us/',
            type: DropdownMenuItemType.EXTERNAL_LINK,
          },
        {
          label: t('Buy Crypto'),
          href: '/buy-crypto',
          supportChainIds: SUPPORT_BUY_CRYPTO,
        },
        ].map((item) => addMenuItemSupported(item, chainId)),
      },
      {
        label: t('Earn'),
        href: '/farms',
        icon: EarnIcon,
        fillIcon: EarnFillIcon,
        items: [
          {
            label: t('Farms'),
            href: '/farms',
          supportChainIds: SUPPORT_FARMS,
          },
          {
            label: t('Silos'),
            href: '/pools',
          supportChainIds: SUPPORT_POOLS,
          },
        ].map((item) => addMenuItemSupported(item, chainId)),
      },
      {
        label: 'Info',
        href: '',
        icon: MoreIcon,
        hideSubNav: true,
        items: [
      {
        label: t('Documentation'),
        href: 'https://docs.plexfinance.us',
        type: DropdownMenuItemType.EXTERNAL_LINK,
      },
      {
        type: DropdownMenuItemType.DIVIDER,
      },
      {
        label: t('Crypto News'),
        href: 'https://news.symplexia.com/category/new-economy/cryptocurrency/',
        type: DropdownMenuItemType.EXTERNAL_LINK,
      },
      {
        label: t('PLEX-F Info'),
        href: 'https://finance.symplexia.com/',
        type: DropdownMenuItemType.EXTERNAL_LINK,
      },
        ].map((item) => addMenuItemSupported(item, chainId)),
      },
    ].map((item) => addMenuItemSupported(item, chainId))

export default config
