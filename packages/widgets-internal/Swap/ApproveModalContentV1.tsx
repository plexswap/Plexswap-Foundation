import { useTranslation } from "@plexswap/localization";
import { useTooltip, AutoColumn, Box, ColumnCenter, Flex, Spinner, Text, TooltipText } from '@plexswap/ui-plex';

interface ApproveModalContentProps {
  title: string;
  isMM?: boolean;
  isBonus: boolean;
}

export const ApproveModalContentV1: React.FC<ApproveModalContentProps> = ({ title, isMM, isBonus }) => {
  const { t } = useTranslation();
  const { targetRef, tooltip, tooltipVisible } = useTooltip(
    <Text>{t("Plexswap AMM includes Core and Stable swap.")}</Text>,
    { placement: "top" }
  );

  return (
    <Box width="100%">
      <Box mb="16px">
        <ColumnCenter>
          <Spinner />
        </ColumnCenter>
      </Box>
      <AutoColumn gap="12px" justify="center">
        <Text bold textAlign="center">
          {title}
        </Text>
        <Flex>
          <Text fontSize="14px">{t("Swapping thru:")}</Text>
          {isMM ? (
            <Text ml="4px" fontSize="14px">
              {t("Plexswap MM")}
            </Text>
          ) : isBonus ? (
            <Text ml="4px" fontSize="14px">
              {t("Bonus Route")}
            </Text>
          ) : (
            <>
              <TooltipText ml="4px" fontSize="14px" color="textSubtle" ref={targetRef}>
                {t("Plexswap AMM")}
              </TooltipText>
              {tooltipVisible && tooltip}
            </>
          )}
        </Flex>
      </AutoColumn>
    </Box>
  );
};
