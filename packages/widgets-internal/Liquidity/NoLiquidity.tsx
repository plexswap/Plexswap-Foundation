import { useTranslation } from "@plexswap/localization";
import { Text } from "@plexswap/ui-plex";

export function NoLiquidity() {
  const { t } = useTranslation();

  return (
    <Text color="textSubtle" textAlign="center">
      {t("No liquidity found.")}
    </Text>
  );
}
