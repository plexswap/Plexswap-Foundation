import { ChainId, getChainName } from "@plexswap/chains";
import { Currency, NATIVE, Token } from "@plexswap/sdk-core";
import { bscTokens } from "@plexswap/tokens";
import memoize from "lodash/memoize";
import { getAddress } from "viem";
import { CurrencyInfo } from "./types";

export const ASSET_CDN = 'https://assets.plexfinance.us';

const mapping: { [key: number]: string } = {
  [ChainId.BSC]: "smartchain",
};

export const getTokenLogoURL = memoize(
  (token?: Token) => {
    if (token && mapping[token.chainId]) {
      return `https://assets-cdn.trustwallet.com/blockchains/${mapping[token.chainId]}/assets/${getAddress(
        token.address
      )}/logo.png`;
    }
    return null;
  },
  (t) => `${t?.chainId}#${t?.address}`
);

export const getTokenLogoURLByAddress = memoize(
  (address?: string, chainId?: number) => {
    if (address && chainId && mapping[chainId]) {
      return `https://assets-cdn.trustwallet.com/blockchains/${mapping[chainId]}/assets/${getAddress(
        address
      )}/logo.png`;
    }
    return null;
  },
  (address, chainId) => `${chainId}#${address}`
);

const chainName: { [key: number]: string } = {
  [ChainId.BSC]: "bsc",
  [ChainId.BSC_TESTNET]: "bsctestnet",
  [ChainId.PLEXCHAIN]:   "plexchain"
};

export const getTokenListTokenUrl = (token: Pick<Token, "chainId" | "address">) =>
  Object.keys(chainName).includes(String(token.chainId))
    ? `https://metalists.plexfinance.us/images/${`${getChainName(token.chainId)?.toLowerCase()}/`}${token.address}.png`
    : null;

const commonCurrencySymbols = [bscTokens.waya, NATIVE[ChainId.BSC], bscTokens.busd].map(({ symbol }) => symbol);

export const getCommonCurrencyUrl = memoize(
  (currency?: Currency): string | undefined => getCommonCurrencyUrlBySymbol(currency?.symbol),
  (currency?: Currency) => `logoUrls#${currency?.chainId}#${currency?.symbol}`
);

export const getCommonCurrencyUrlBySymbol = memoize(
  (symbol?: string): string | undefined =>
    symbol && commonCurrencySymbols.includes(symbol)
      ? 
      `https://metalists.plexfinance.us/images/symbol/${symbol.toLocaleLowerCase()}.png`
      : undefined,
  (symbol?: string) => `logoUrls#symbol#${symbol}`
);

type GetLogoUrlsOptions = {
  useTrustWallet?: boolean;
};

export const getCurrencyLogoUrls = memoize(
  (currency: Currency | undefined, { useTrustWallet = true }: GetLogoUrlsOptions = {}): string[] => {
    const trustWalletLogo = getTokenLogoURL(currency?.wrapped);
    const logoUrl = currency ? getTokenListTokenUrl(currency.wrapped) : null;
    return [getCommonCurrencyUrl(currency), useTrustWallet ? trustWalletLogo : undefined, logoUrl].filter(
      (url): url is string => !!url
    );
  },
  (currency: Currency | undefined, options?: GetLogoUrlsOptions) =>
    `logoUrls#${currency?.chainId}#${currency?.wrapped?.address}#${options ? JSON.stringify(options) : ""}`
);

export const getCurrencyLogoUrlsByInfo = memoize(
  (currency: CurrencyInfo | undefined, { useTrustWallet = true }: GetLogoUrlsOptions = {}): string[] => {
    if (!currency) {
      return [];
    }
    const { chainId, address, symbol } = currency;
    const trustWalletLogo = getTokenLogoURLByAddress(address, chainId);
    const logoUrl = chainId && address ? getTokenListTokenUrl({ chainId, address }) : null;
    return [getCommonCurrencyUrlBySymbol(symbol), useTrustWallet ? trustWalletLogo : undefined, logoUrl].filter(
      (url): url is string => !!url
    );
  },
  (currency, options) =>
    `logoUrls#${currency?.chainId}#${currency?.symbol}#${currency?.address}#${options ? JSON.stringify(options) : ""}`
);