import { useTranslation } from "@plexswap/localization";
import {
    AutoRenewIcon,
    Box,
    Button,
    CalculateIcon,
    ErrorIcon,
    Flex,
    IconButton,
    LinkExternal,
    Message,
    MessageText,
    Modal,
    ModalActions,
    ModalBody,
    ModalCore,
    ModalInput,
    RoiCalculatorModal,
    Skeleton,
    Text,
    WarningIcon,
} from "@plexswap/ui-plex";
import { BIG_ZERO } from "@plexswap/utils/bigNumber";
import { getInterestBreakdown } from "@plexswap/utils/compoundApyHelpers";
import { formatNumber, getDecimalAmount, getFullDisplayBalance } from "@plexswap/utils/formatBalance";
import { trimTrailZero } from "@plexswap/utils/trimTrailZero";
import BigNumber from "bignumber.js";
import _toNumber from "lodash/toNumber";
import { useCallback, useMemo, useState } from "react";
import { styled } from "styled-components";

const AnnualRoiContainer = styled(Flex)`
  cursor: pointer;
`;

const AnnualRoiDisplay = styled(Text)`
  width: 72px;
  max-width: 72px;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
`;

interface DepositModalProps {
  account?: string;
  pid: number;
  max: BigNumber;
  stakedBalance: BigNumber;
  multiplier?: string;
  lpPrice?: BigNumber;
  lpLabel?: string;
  tokenName?: string;
  apr?: number;
  lpRewardsApr?: number;
  displayApr?: string;
  addLiquidityUrl?: string;
  wayaPrice?: BigNumber;
  showActiveBooster?: boolean;
  lpTotalSupply: BigNumber;
  wayaMultiplier?: number | null;
  showCrossChainFarmWarning?: boolean;
  crossChainWarningText?: string;
  decimals: number;
  allowance?: BigNumber;
  enablePendingTx?: boolean;
  showTopMessageText?: null | string;
  dualTokenRewardApr?: number;
  farmWayaPerSecond?: string;
  totalMultipliers?: string;
  rewardWayaPerSecond?: boolean;
  onDismiss?: () => void;
  onConfirm: (amount: string) => void;
  handleApprove?: () => void;
  wayaCalculatorSlot?: (stakingTokenBalance: string) => React.ReactNode;
  isBooster?: boolean;
  boosterMultiplier?: number;
}

const DepositModal: React.FC<React.PropsWithChildren<DepositModalProps>> = ({
  account,
  max,
  stakedBalance,
  tokenName = "",
  multiplier,
  displayApr,
  lpPrice = BIG_ZERO,
  lpLabel = "",
  apr = 0,
  addLiquidityUrl = "",
  wayaPrice = BIG_ZERO,
  showActiveBooster,
  wayaMultiplier,
  showCrossChainFarmWarning,
  crossChainWarningText,
  decimals,
  allowance,
  enablePendingTx,
  showTopMessageText,
  dualTokenRewardApr,
  farmWayaPerSecond,
  totalMultipliers,
  rewardWayaPerSecond,
  lpRewardsApr,
  onConfirm,
  onDismiss,
  handleApprove,
  wayaCalculatorSlot,
  isBooster,
  boosterMultiplier,
}) => {
  const [val, setVal] = useState("");
  const [valUSDPrice, setValUSDPrice] = useState(BIG_ZERO);
  const [pendingTx, setPendingTx] = useState(false);
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);
  const { t } = useTranslation();
  const fullBalance = useMemo(() => {
    return getFullDisplayBalance(max, decimals);
  }, [max, decimals]);

  const needEnable = useMemo(() => {
    if (allowance) {
      const amount = getDecimalAmount(new BigNumber(val), decimals);
      return amount.gt(allowance);
    }
    return false;
  }, [allowance, decimals, val]);

  const lpTokensToStake = useMemo(() => new BigNumber(val), [val]);
  const fullBalanceNumber = useMemo(() => new BigNumber(fullBalance), [fullBalance]);

  const usdToStake = useMemo(() => lpTokensToStake.times(lpPrice), [lpTokensToStake, lpPrice]);

  const interestBreakdown = useMemo(
    () =>
      getInterestBreakdown({
        principalInUSD: !lpTokensToStake.isNaN() ? usdToStake.toNumber() : 0,
        apr,
        earningTokenPrice: wayaPrice.toNumber(),
      }),
    [lpTokensToStake, usdToStake, wayaPrice, apr]
  );

  const annualRoi = useMemo(() => wayaPrice.times(interestBreakdown[3]), [wayaPrice, interestBreakdown]);
  const annualRoiAsNumber = useMemo(() => annualRoi.toNumber(), [annualRoi]);
  const formattedAnnualRoi = useMemo(
    () => formatNumber(annualRoiAsNumber, annualRoi.gt(10000) ? 0 : 2, annualRoi.gt(10000) ? 0 : 2),
    [annualRoiAsNumber, annualRoi]
  );

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.validity.valid) {
        const inputVal = e.currentTarget.value.replace(/,/g, ".");
        setVal(inputVal);

        const USDPrice = inputVal === "" ? BIG_ZERO : new BigNumber(inputVal).times(lpPrice);
        setValUSDPrice(USDPrice);
      }
    },
    [setVal, setValUSDPrice, lpPrice]
  );

  const handleSelectMax = useCallback(() => {
    setVal(fullBalance);

    const USDPrice = new BigNumber(fullBalance).times(lpPrice);
    setValUSDPrice(USDPrice);
  }, [fullBalance, setVal, setValUSDPrice, lpPrice]);

  const handlePercentInput = useCallback(
    (percent: number) => {
      const totalAmount = fullBalanceNumber.dividedBy(100).multipliedBy(percent);
      const amount = trimTrailZero(totalAmount.toNumber().toFixed(decimals));
      setVal(amount as string);

      const USDPrice = totalAmount.times(lpPrice);
      setValUSDPrice(USDPrice);
    },
    [fullBalanceNumber, decimals, lpPrice]
  );

  console.log({
    display: isBooster ? (_toNumber(displayApr) - apr + apr * (boosterMultiplier ?? 1)).toFixed(2) : displayApr,
    apr,
    lpRewardsApr,
  });

  if (showRoiCalculator) {
    return (
      <ModalCore isOpen={showRoiCalculator}>
        <RoiCalculatorModal
          account={account}
          linkLabel={t("Add %symbol%", { symbol: lpLabel })}
          stakingTokenBalance={stakedBalance.plus(max)}
          stakingTokenDecimals={decimals}
          stakingTokenSymbol={tokenName}
          stakingTokenPrice={lpPrice.toNumber()}
          earningTokenPrice={wayaPrice.toNumber()}
          apr={isBooster ? apr * (boosterMultiplier ?? 1) : apr}
          multiplier={multiplier}
          displayApr={
            isBooster ? (_toNumber(displayApr) - apr + apr * (boosterMultiplier ?? 1)).toFixed(2) : displayApr
          }
          linkHref={addLiquidityUrl}
          isFarm
          initialValue={val}
          dualTokenRewardApr={dualTokenRewardApr}
          farmWayaPerSecond={farmWayaPerSecond}
          totalMultipliers={totalMultipliers}
          rewardWayaPerSecond={rewardWayaPerSecond}
          lpRewardsApr={lpRewardsApr}
          onBack={() => setShowRoiCalculator(false)}
          wayaCalculatorSlot={wayaCalculatorSlot}
        />
      </ModalCore>
    );
  }

  return (
    <Modal title={t("Stake LP tokens")} onDismiss={onDismiss}>
      <ModalBody width={["100%", "100%", "100%", "420px"]}>
        {showTopMessageText && (
          <Box mb="15px">
            <Message variant="danger" icon={<WarningIcon width="24px" color="failure" />}>
              <MessageText>{showTopMessageText}</MessageText>
            </Message>
          </Box>
        )}
        <ModalInput
          value={val}
          valueUSDPrice={valUSDPrice}
          onSelectMax={handleSelectMax}
          onPercentInput={handlePercentInput}
          onChange={handleChange}
          max={fullBalance}
          maxAmount={fullBalanceNumber}
          symbol={tokenName}
          addLiquidityUrl={addLiquidityUrl}
          inputTitle={t("Stake")}
          decimals={decimals}
          needEnable={needEnable}
        />
        {showActiveBooster ? (
          <Message variant="warning" icon={<ErrorIcon width="24px" color="warning" />} mt="32px">
            <MessageText>
              {t("The yield booster multiplier will be updated based on the latest staking conditions.")}
            </MessageText>
          </Message>
        ) : null}
        <Flex mt="24px" alignItems="center" justifyContent="space-between">
          <Text mr="8px" color="textSubtle">
            {t("Annual ROI at current rates")}:
          </Text>
          {Number.isFinite(annualRoiAsNumber) ? (
            <AnnualRoiContainer
              alignItems="center"
              onClick={() => {
                setShowRoiCalculator(true);
              }}
            >
              <AnnualRoiDisplay>${formattedAnnualRoi}</AnnualRoiDisplay>
              <IconButton variant="text" scale="sm">
                <CalculateIcon color="textSubtle" width="18px" />
              </IconButton>
            </AnnualRoiContainer>
          ) : (
            <Skeleton width={60} />
          )}
        </Flex>
        {showCrossChainFarmWarning && (
          <Box mt="15px">
            <Message variant="warning">
              <MessageText>{crossChainWarningText}</MessageText>
            </Message>
          </Box>
        )}
        <ModalActions>
          <Button variant="secondary" onClick={onDismiss} width="100%" disabled={pendingTx}>
            {t("Cancel")}
          </Button>
          {needEnable ? (
            <Button
              width="100%"
              isLoading={enablePendingTx}
              endIcon={enablePendingTx ? <AutoRenewIcon spin color="currentColor" /> : null}
              onClick={handleApprove}
            >
              {t("Enable")}
            </Button>
          ) : pendingTx ? (
            <Button width="100%" isLoading={pendingTx} endIcon={<AutoRenewIcon spin color="currentColor" />}>
              {t("Confirming")}
            </Button>
          ) : (
            <Button
              width="100%"
              disabled={!lpTokensToStake.isFinite() || lpTokensToStake.eq(0) || lpTokensToStake.gt(fullBalanceNumber)}
              onClick={async () => {
                setPendingTx(true);
                await onConfirm(val);
                onDismiss?.();
                setPendingTx(false);
              }}
            >
              {t("Confirm")}
            </Button>
          )}
        </ModalActions>
        <LinkExternal href={addLiquidityUrl} style={{ alignSelf: "center" }}>
          {t("Add %symbol%", { symbol: tokenName })}
        </LinkExternal>
      </ModalBody>
    </Modal>
  );
};

export default DepositModal;