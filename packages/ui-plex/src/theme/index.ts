import { vars } from "@plexswap/style";
import { AlertTheme } from "../components/Alert/types";
import { CardTheme } from "../components/Card/types";
import { PlexToggleTheme } from "../components/PlexToggle/types";
import { RadioTheme } from "../components/Radio/types";
import { ToggleTheme } from "../components/Toggle/theme";
import { TooltipTheme } from "../components/Tooltip/types";
import { NavThemeType } from "../widgets/Menu/theme";
import { ModalTheme } from "../widgets/Modal/types";
import { Breakpoints, MediaQueries, ZIndices } from "./types";

export interface PlexTheme {
  siteWidth: number;
  isDark: boolean;
  alert: AlertTheme;
  colors: typeof vars.colors;
  card: CardTheme;
  nav: NavThemeType;
  modal: ModalTheme;
  plexToggle: PlexToggleTheme;
  radio: RadioTheme;
  toggle: ToggleTheme;
  tooltip: TooltipTheme;
  breakpoints: Breakpoints;
  mediaQueries: MediaQueries;
  spacing: typeof vars.space;
  shadows: typeof vars.shadows;
  radii: typeof vars.radii;
  zIndices: ZIndices;
}

export { baseColors, darkColors, lightColors } from "./colors";
export { default as dark } from "./dark";
export { default as light } from "./light";
export * from "./types";
