import { darkColors, lightColors } from "../../theme/colors";
import { PlexToggleTheme } from "./types";

export const light: PlexToggleTheme = {
  handleBackground: lightColors.backgroundAlt,
  handleShadow: lightColors.textDisabled,
};

export const dark: PlexToggleTheme = {
  handleBackground: darkColors.backgroundAlt,
  handleShadow: darkColors.textDisabled,
};
