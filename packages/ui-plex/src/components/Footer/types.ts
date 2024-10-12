import { Language } from "../LangSelector/types";
import { FlexProps } from "../Box";

export type FooterLinkType = {
  label: string;
  items: { label: string; href?: string; isHighlighted?: boolean }[];
};

export type FooterProps = {
  items: FooterLinkType[];
  buyWayaLabel: string;
  buyWayaLink: string;
  isDark: boolean;
  toggleTheme: (isDark: boolean) => void;
  wayaPriceUsd?: number;
  currentLang: string;
  langs: Language[];
  chainId: number;
  setLang: (lang: Language) => void;
} & FlexProps;
