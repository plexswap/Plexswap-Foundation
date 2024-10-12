import { ChainId } from "@plexswap/chains";
import { useTranslation } from "@plexswap/localization";
import { useTooltip, FarmMultiplierInfo, Flex, HelpIcon, LinkExternal, ScanLink, Skeleton, Text } from '@plexswap/ui-plex';
import { ReactElement } from "react";
import { styled } from "styled-components";

export interface ExpandableSectionProps {
  scanAddress?: { link: string; chainId?: number; icon?: ReactElement };
  infoAddress?: string;
  removed?: boolean;
  totalValueFormatted?: string;
  lpLabel: string;
  onAddLiquidity?: (() => void) | string;
  alignLinksToRight?: boolean;
  totalValueLabel?: string;
  multiplier?: string;
  farmWayaPerSecond?: string;
  totalMultipliers?: string;
  isCoreWayaWrapperFarm?: boolean;
}

const Wrapper = styled.div`
  margin-top: 24px;
`;

const StyledLinkExternal = styled(LinkExternal)`
  font-weight: 400;
`;

const StyledScanLink = styled(ScanLink)`
  font-weight: 400;
`;

const StyledText = styled(Text)`
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

export const DetailsSection: React.FC<React.PropsWithChildren<ExpandableSectionProps>> = ({
  scanAddress,
  infoAddress,
  removed,
  totalValueLabel,
  totalValueFormatted,
  lpLabel,
  onAddLiquidity,
  alignLinksToRight = true,
  multiplier,
  farmWayaPerSecond,
  totalMultipliers,
  isCoreWayaWrapperFarm,
}) => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation();

  const multiplierTooltipContent = FarmMultiplierInfo({
    farmWayaPerSecond: farmWayaPerSecond ?? "-",
    totalMultipliers: totalMultipliers ?? "-",
  });

  const { targetRef, tooltip, tooltipVisible } = useTooltip(multiplierTooltipContent, {
    placement: "bottom",
  });

  return (
    <Wrapper>
      <Flex justifyContent="space-between">
        <Text>{totalValueLabel || t("Staked Liquidity")}:</Text>
        {totalValueFormatted ? <Text>{totalValueFormatted}</Text> : <Skeleton width={75} height={25} />}
      </Flex>
      {!isCoreWayaWrapperFarm && (
        <Flex justifyContent="space-between">
          <Text>{t("Multiplier")}:</Text>
          {multiplier ? (
            <Flex>
              <Text>{multiplier}</Text>
              {tooltipVisible && tooltip}
              <Flex ref={targetRef}>
                <HelpIcon ml="4px" width="20px" height="20px" color="textSubtle" />
              </Flex>
            </Flex>
          ) : (
            <Skeleton width={75} height={25} />
          )}
        </Flex>
      )}
      {!removed && (
        <Flex mb="2px" justifyContent={alignLinksToRight ? "flex-end" : "flex-start"}>
          {onAddLiquidity ? (
            typeof onAddLiquidity === "string" ? (
              <StyledLinkExternal href={onAddLiquidity}>{t("Add %symbol%", { symbol: lpLabel })}</StyledLinkExternal>
            ) : (
              <StyledText color="primary" onClick={onAddLiquidity}>
                {t("Add %symbol%", { symbol: lpLabel })}
              </StyledText>
            )
          ) : null}
        </Flex>
      )}
      {infoAddress && (
        <Flex mb="2px" justifyContent={alignLinksToRight ? "flex-end" : "flex-start"}>
          <StyledLinkExternal href={infoAddress}>{t("View Tutorial")}</StyledLinkExternal>
        </Flex>
      )}
      {scanAddress && (
        <Flex mb="2px" justifyContent={alignLinksToRight ? "flex-end" : "flex-start"}>
          <StyledScanLink
            icon={scanAddress.icon}
            useBscCoinFallback={
              scanAddress.chainId ? [ChainId.BSC, ChainId.BSC_TESTNET].includes(scanAddress.chainId) : false
            }
            href={scanAddress.link}
          >
            {t("View Contract")}
          </StyledScanLink>
        </Flex>
      )}
    </Wrapper>
  );
};