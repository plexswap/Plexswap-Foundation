import { useTranslation } from "@plexswap/localization";
import { Text } from '@plexswap/ui-plex';
import { ActionContent, ActionTitles, StyledActionContainer } from "./styles";

const AccountNotConnect = ({
  children,
  wayaInfoSlot,
}: {
  children: React.ReactNode;
  wayaInfoSlot?: React.ReactElement;
}) => {
  const { t } = useTranslation();

  return (
    <StyledActionContainer>
      <ActionTitles>
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
          {t("Start Farming")}
        </Text>
      </ActionTitles>
      <ActionContent style={{ justifyContent: "flex-start", alignItems: "center", gap: 16 }}>{children}</ActionContent>
      {wayaInfoSlot}
    </StyledActionContainer>
  );
};

export default AccountNotConnect;
