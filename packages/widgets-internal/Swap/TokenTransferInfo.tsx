import { Currency } from "@plexswap/sdk-core";
import {  ArrowForwardIcon, Box, Flex, Text } from '@plexswap/ui-plex';
import { CurrencyLogo } from "./../Mixed/CurrencyLogo"

interface TokenTransferInfoProps {
  symbolA?: string;
  symbolB?: string;
  amountA: string;
  amountB: string;
  currencyA?: Currency;
  currencyB?: Currency;
}

const TokenTransferInfo: React.FC<TokenTransferInfoProps> = ({
  symbolA,
  symbolB,
  amountA,
  amountB,
  currencyA,
  currencyB,
}) => {
  return (
    <Flex>
      <Flex>
        <Text mr="4px" fontSize="14px">{`${amountA} ${symbolA}`}</Text>
        <CurrencyLogo size="20px" currency={currencyA} />
      </Flex>
      <Box m="0 8px">
        <ArrowForwardIcon color="textSubtle" />
      </Box>
      <Flex>
        <Text mr="4px" fontSize="14px">{`${amountB} ${symbolB}`}</Text>
        <CurrencyLogo size="20px" currency={currencyB} />
      </Flex>
    </Flex>
  );
};

export default TokenTransferInfo;
