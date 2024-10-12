import { Balance, Flex, Heading, RefreshIcon } from '@plexswap/ui-plex';
import { formatLpBalance, getBalanceNumber } from "@plexswap/utils/formatBalance";
import { BigNumber } from "bignumber.js";
import { useMemo } from "react";

interface StakedLPProps {
  stakedBalance: BigNumber;
  tokenSymbol: string;
  quoteTokenSymbol: string;
  lpTotalSupply: BigNumber;
  lpTokenPrice: BigNumber;
  tokenAmountTotal: BigNumber;
  quoteTokenAmountTotal: BigNumber;
  pendingFarmLength?: number;
  decimals: number;
  onClickLoadingIcon?: () => void;
}

const StakedLP: React.FunctionComponent<React.PropsWithChildren<StakedLPProps>> = ({
  stakedBalance,
  quoteTokenSymbol,
  tokenSymbol,
  lpTotalSupply,
  lpTokenPrice,
  tokenAmountTotal,
  quoteTokenAmountTotal,
  pendingFarmLength = 0,
  decimals,
  onClickLoadingIcon,
}) => {
  const displayBalance = useMemo(() => {
    return formatLpBalance(stakedBalance, decimals);
  }, [stakedBalance, decimals]);

  return (
    <Flex flexDirection="column" alignItems="flex-start">
      <Flex>
        <Heading color={stakedBalance.eq(0) ? "textDisabled" : "text"}>{displayBalance}</Heading>
        {pendingFarmLength > 0 && <RefreshIcon style={{ cursor: "pointer" }} spin onClick={onClickLoadingIcon} />}
      </Flex>
      {stakedBalance.gt(0) && lpTokenPrice.gt(0) && (
        <>
          <Balance
            fontSize="12px"
            color="textSubtle"
            decimals={2}
            value={getBalanceNumber(lpTokenPrice.times(stakedBalance), decimals)}
            unit=" USD"
            prefix="~"
          />
          <Flex flexDirection={["column", "column", "row"]}>
            <Balance
              fontSize="12px"
              color="textSubtle"
              decimals={2}
              value={stakedBalance.div(lpTotalSupply).times(tokenAmountTotal).toNumber()}
              unit={` ${tokenSymbol}`}
            />
            <Balance
              fontSize="12px"
              color="textSubtle"
              decimals={2}
              ml={["0", "0", "4px"]}
              value={stakedBalance.div(lpTotalSupply).times(quoteTokenAmountTotal).toNumber()}
              unit={` ${quoteTokenSymbol}`}
            />
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default StakedLP;