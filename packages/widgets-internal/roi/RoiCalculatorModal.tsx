import { useTranslation } from "@plexswap/localization";
import { Modal, ModalCore, ModalCoreProps } from "@plexswap/ui-plex";
import { styled } from "styled-components";

import { RoiCalculator, RoiCalculatorProps } from "./RoiCalculator";

export const StyledModal = styled(Modal)`
  & > :nth-child(2) {
    padding: 0;
  }

  ${({ theme }) => theme.mediaQueries.md} {
    width: 860px;
  }
`;

export function RoiCalculatorModal({
  isOpen,
  closeOnOverlayClick,
  onDismiss,
  ...rest
}: RoiCalculatorProps & ModalCoreProps) {
  const { t } = useTranslation();

  return (
    <ModalCore onDismiss={onDismiss} isOpen={isOpen} closeOnOverlayClick={closeOnOverlayClick}>
      <StyledModal title={t("ROI Calculator")}>
        <RoiCalculator {...rest} />
      </StyledModal>
    </ModalCore>
  );
}
