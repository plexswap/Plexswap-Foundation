import { useTranslation } from "@plexswap/localization";
import { Button, Text, useMatchBreakpoints } from "@plexswap/ui-plex";
import { ActionContent, ActionTitles, StyledActionContainer } from "./styles";

export interface StakeComponentProps {
  lpSymbol: string;
  isStakeReady: boolean;
  onPresentDeposit: () => void;
  wayaInfoSlot?: React.ReactElement;
}

const StakeComponent: React.FunctionComponent<React.PropsWithChildren<StakeComponentProps>> = ({
  lpSymbol,
  isStakeReady,
  onPresentDeposit,
  wayaInfoSlot,
}) => {
  const { t } = useTranslation();
  const { isMobile } = useMatchBreakpoints();
  return (
    <StyledActionContainer
      style={
        wayaInfoSlot
          ? {
              display: "flex",
              gap: 16,
              alignItems: "center",
              flexDirection: isMobile ? "column" : "row",
              minHeight: isMobile ? "auto" : undefined,
            }
          : undefined
      }
    >
      {(!wayaInfoSlot || isMobile) && (
        <ActionTitles style={wayaInfoSlot && isMobile ? { alignItems: "flex-start", width: "100%" } : undefined}>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px" pr="4px">
            {t("Stake")}
          </Text>
          <Text bold color="secondary" fontSize="12px">
            {lpSymbol}
          </Text>
        </ActionTitles>
      )}
      <ActionContent style={wayaInfoSlot ? { flexGrow: 1, width: isMobile ? "100%" : undefined } : undefined}>
        <Button width="100%" onClick={onPresentDeposit} variant="secondary" disabled={isStakeReady}>
          {t("Stake LP")}
        </Button>
      </ActionContent>
      {wayaInfoSlot}
    </StyledActionContainer>
  );
};

export default StakeComponent;
