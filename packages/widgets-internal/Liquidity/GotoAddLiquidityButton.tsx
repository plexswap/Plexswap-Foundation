import { useTranslation } from "@plexswap/localization";
import { AddIcon, Button } from "@plexswap/ui-plex";
import { NextLinkFromReactRouter } from "./../Mixed/NextLink";

export function GotoAddLiquidityButton() {
  const { t } = useTranslation();

  return (
    <NextLinkFromReactRouter to="/add">
      <Button id="join-pool-button" width="100%" startIcon={<AddIcon color="invertedContrast" />}>
        {t("Add Liquidity")}
      </Button>
    </NextLinkFromReactRouter>
  );
}
