import { useTranslation } from "@plexswap/localization";
import { Skeleton, Text } from "@plexswap/ui-plex";
import { ActionContent, ActionTitles, StyledActionContainer } from "./styles";

const StakeActionDataNotReady: React.FC<{ wayaInfoSlot?: React.ReactElement }> = ({ wayaInfoSlot }) => {
  const { t } = useTranslation();
  return (
    <StyledActionContainer>
      <ActionTitles>
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
          {t("Start Farming")}
        </Text>
      </ActionTitles>
      <ActionContent>
        <Skeleton width={180} marginBottom={28} marginTop={14} />
      </ActionContent>
      {wayaInfoSlot}
    </StyledActionContainer>
  );
};

export default StakeActionDataNotReady;
