import noop from "lodash/noop";
import { DropdownMenuItems, DropdownMenuItemType } from "../../components/DropdownMenu/types";
import { MenuItemsType } from "../../components/MenuItems/types";
import { SwapIcon, SwapFillIcon, EarnFillIcon, EarnIcon, MoreIcon } from "../../components/Svg";
import { LinkStatus } from "./types";

export const status = {
  LIVE: <LinkStatus>{
    text: "LIVE",
    color: "failure",
  },
  SOON: <LinkStatus>{
    text: "SOON",
    color: "warning",
  },
  NEW: <LinkStatus>{
    text: "NEW",
    color: "success",
  },
};

export const links: MenuItemsType[] = [
  {
    label: "Trade",
    href: "/swap",
    icon: SwapIcon,
    fillIcon: SwapFillIcon,
    items: [
      {
        label: "Swap",
        href: "/swap",
      },
      {
        label: "Limit",
        href: "/limit-orders",
      },
      {
        label: "Liquidity",
        href: "/liquidity",
      },
    ],
  },
  {
    label: "Earn",
    href: "/farms",
    icon: EarnIcon,
    fillIcon: EarnFillIcon,
    items: [
      {
        label: "Farms",
        href: "/farms",
      },
      {
        label: "Silos",
        href: "/pools",
      },
    ],
  },
  {
    label: "Info",
    href: "",
    icon: MoreIcon,
    items: [
      {
        label: "Documentation",
        href: "/",
        type: DropdownMenuItemType.EXTERNAL_LINK,
      },
      {
        type: DropdownMenuItemType.DIVIDER,
      },
      {
        label: "Crypto News",
        href: "/",
        type: DropdownMenuItemType.EXTERNAL_LINK,
      },
    ],
  },
];

export const userMenulinks: DropdownMenuItems[] = [
  {
    label: "Wallet",
    onClick: noop,
    type: DropdownMenuItemType.BUTTON,
  },
  {
    label: "Transactions",
    type: DropdownMenuItemType.BUTTON,
  },
  {
    type: DropdownMenuItemType.DIVIDER,
  },
  {
    type: DropdownMenuItemType.BUTTON,
    disabled: true,
    label: "Dashboard",
  },
  {
    type: DropdownMenuItemType.BUTTON,
    disabled: true,
    label: "Portfolio",
  },
  {
    type: DropdownMenuItemType.EXTERNAL_LINK,
    href: "https://swap.plexfinance.us",
    label: "Link",
  },
  {
    type: DropdownMenuItemType.DIVIDER,
  },
  {
    type: DropdownMenuItemType.BUTTON,
    onClick: noop,
    label: "Disconnect",
  },
];

export const MENU_HEIGHT = 56;
export const MENU_ENTRY_HEIGHT = 48;
export const MOBILE_MENU_HEIGHT = 44;
export const SIDEBAR_WIDTH_FULL = 240;
export const SIDEBAR_WIDTH_REDUCED = 56;
export const TOP_BANNER_HEIGHT = 70;
export const TOP_BANNER_HEIGHT_MOBILE = 84;
