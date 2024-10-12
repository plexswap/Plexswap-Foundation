import React from "react";
import { Flex, Box } from "../Box";
import { StyledFooter, StyledIconMobileContainer, StyledSocialLinks, StyledToolsContainer } from "./styles";
import { FooterProps } from "./types";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { LogoWithTextIcon } from "../Svg";

const MenuItem: React.FC<React.PropsWithChildren<FooterProps>> = ({
  items,
  isDark,
  toggleTheme,
  currentLang,
  langs,
  setLang,
  wayaPriceUsd,
  buyWayaLabel,
  buyWayaLink,
  chainId,
  ...props
}) => {
  return (
    <StyledFooter p={["42px 32px", null, "10px 20px 10px 20px"]} {...props} justifyContent="center" data-theme="dark">
      <Flex flexDirection="row" justifyContent="space-between" width={["100%", null, "1200px;"]}>
        <StyledIconMobileContainer display={["block", null, "none"]}>
          <LogoWithTextIcon isDark width="130px" />
        </StyledIconMobileContainer>

        <Flex flexDirection="row" alignItems="flex-start">
          <Box display={["none", null, "block"]}>
            <LogoWithTextIcon isDark width="160px" />
          </Box>
        </Flex>

        <StyledSocialLinks order={[2]} justify-content="center" alignItems="center" />

        <StyledToolsContainer order={[3]} flexDirection="row" justifyContent="flex-end">
          <ThemeSwitcher isDark={isDark} toggleTheme={toggleTheme} />
        </StyledToolsContainer>
      </Flex>
    </StyledFooter>
  );
};

export default MenuItem;
