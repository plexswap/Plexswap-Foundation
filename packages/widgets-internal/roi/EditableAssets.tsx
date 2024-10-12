import { useTranslation } from "@plexswap/localization";
import { ReactNode, memo, useCallback, useRef } from "react";

import { Button, Flex } from "@plexswap/ui-plex";
import { AssetCard, AssetCardProps, CardSection, SectionTitle } from "./AssetCard";

interface Props extends AssetCardProps {
  title?: ReactNode;
  onReset?: () => void;
}

export const EditableAssets = memo(function EditableAssets({ title, onReset, ...rest }: Props) {
  const { t } = useTranslation();
  const firstPriceInputRef = useRef<HTMLInputElement>(null);
  const onEdit = useCallback(() => {
    firstPriceInputRef.current?.focus();
    firstPriceInputRef.current?.select();
  }, []);

  return (
    <CardSection
      header={
        <>
          <SectionTitle>{title}</SectionTitle>
          <Flex>
            <Button variant="secondary" scale="xs" mr="0.5em" onClick={onEdit} style={{ textTransform: "uppercase" }}>
              {t("Edit")}
            </Button>
            <Button variant="secondary" scale="xs" onClick={onReset} style={{ textTransform: "uppercase" }}>
              {t("Reset")}
            </Button>
          </Flex>
        </>
      }
    >
      <AssetCard {...rest} firstPriceInputRef={firstPriceInputRef} />
    </CardSection>
  );
});
