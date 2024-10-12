import { useTranslation } from "@plexswap/localization";
import { styled } from "styled-components";
import { Link } from "../Link";
import { Text } from "../Text";

const InlineText = styled(Text)`
  display: inline;
`;

const InlineLink = styled(Link)`
  display: inline-block;
  margin: 0 4px;
`;

interface FarmMultiplierInfoProps {
  farmWayaPerSecond: string;
  totalMultipliers: string;
}

export const FarmMultiplierInfo: React.FC<React.PropsWithChildren<FarmMultiplierInfoProps>> = ({
  farmWayaPerSecond,
  totalMultipliers,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Text bold>
        {t("Farm’s WAYA Per Second:")}
        <InlineText marginLeft={2}>{farmWayaPerSecond}</InlineText>
      </Text>
      <Text bold>
        {t("Total Multipliers:")}
        <InlineText marginLeft={2}>{totalMultipliers}</InlineText>
      </Text>
      <Text my="24px">
        {t(
          "The Farm Multiplier represents the proportion of WAYA rewards each farm receives as a proportion of its farm group."
        )}
      </Text>
      <Text my="24px">
        {t("For example, if a 1x farm received 1 WAYA per block, a 40x farm would receive 40 WAYA per block.")}
      </Text>
      <Text>{t("Different farm groups have different sets of multipliers.")}</Text>
    </>
  );
};
