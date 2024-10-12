import { ElementType, ReactElement, ReactNode } from "react";
import { FooterLinkType } from "../../components/Footer/types";
import { MenuItemsType } from "../../components/MenuItems/types";
import { SubMenuItemsType } from "../../components/SubMenuItems/types";
import { Colors } from "../../theme/types";
import { Language } from "@plexswap/localization";

export interface LinkStatus {
  text: string;
  color: keyof Colors;
}

export interface NavProps {
  linkComponent?: ElementType;
  rightSide?: ReactNode;
  banner?: ReactElement;
  links: Array<MenuItemsType>;
  subLinks?: Array<SubMenuItemsType>;
  footerLinks: Array<FooterLinkType>;
  activeItem?: string;
  activeSubItem?: string;
  isDark: boolean;
  toggleTheme: (isDark: boolean) => void;
  wayaPriceUsd?: number;
  currentLang: string;
  buyWayaLabel: string;
  buyWayaLink: string;
  langs: Language[];
  chainId: number;
  setLang: (lang: Language) => void;
}
