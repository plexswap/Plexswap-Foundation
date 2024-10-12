import { useTranslation } from "@plexswap/localization";
import { Button, Text, useMatchBreakpoints } from "@plexswap/ui-plex";
import { ActionContent, ActionTitles, StyledActionContainer } from "./styles";

export interface EnableStakeActionProps {
  pendingTx: boolean;
  handleApprove: () => void;
  wayaInfoSlot?: React.ReactElement;
}

const EnableStakeAction: React.FunctionComponent<React.PropsWithChildren<EnableStakeActionProps>> = ({
  pendingTx,
  handleApprove,
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
      {!wayaInfoSlot && (
        <ActionTitles>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
            {t("Enable Farm")}
          </Text>
        </ActionTitles>
      )}
      <ActionContent style={wayaInfoSlot ? { flexGrow: 1, width: isMobile ? "100%" : "30%" } : undefined}>
        <Button width="100%" disabled={pendingTx} onClick={handleApprove} variant="secondary">
          {t("Enable")}
        </Button>
      </ActionContent>
      {wayaInfoSlot}
    </StyledActionContainer>
  );
};

export default EnableStakeAction;
