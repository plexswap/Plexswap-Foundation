import { useTranslation } from "@plexswap/localization";
import { Text } from "@plexswap/ui-plex";

export function LiquidityNotConnect() {
  const { t } = useTranslation();

  return (
    <Text color="textSubtle" textAlign="center">
      {t("Connect to a wallet to view your liquidity.")}
    </Text>
  );
}
