import { useTranslation } from "@plexswap/localization";
import { Balance, Flex, Skeleton, Text } from '@plexswap/ui-plex';
import { getBalanceNumber } from "@plexswap/utils/formatBalance";
import BigNumber from "bignumber.js";
import { styled } from "styled-components";

import { BaseCell, CellContent } from "./BaseCell";

interface TotalStakedCellProps {
  stakingTokenDecimals: number;
  stakingTokenSymbol: string;
  totalStaked?: BigNumber;
}

const StyledCell = styled(BaseCell)`
  flex: 2 0 100px;
`;

export function TotalStakedCell({ stakingTokenSymbol, totalStaked, stakingTokenDecimals }: TotalStakedCellProps) {
  const { t } = useTranslation();

  return (
    <StyledCell role="cell">
      <CellContent>
        <Text fontSize="12px" color="textSubtle" textAlign="left">
          {t("Total staked")}
        </Text>
        {totalStaked && totalStaked.gte(0) ? (
          <Flex height="20px" alignItems="center">
            <Balance
              fontSize="16px"
              value={getBalanceNumber(totalStaked, stakingTokenDecimals)}
              decimals={3}
              unit={` ${stakingTokenSymbol}`}
            />
          </Flex>
        ) : (
          <Skeleton width="80px" height="16px" />
        )}
      </CellContent>
    </StyledCell>
  );
}
