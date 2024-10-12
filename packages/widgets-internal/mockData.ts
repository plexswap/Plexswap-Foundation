import { ChainId } from "@plexswap/chains";
import { ERC20Token } from "@plexswap/sdk-core";

// For StoryBook
export const wayaToken = new ERC20Token(
  ChainId.BSC,
  "0x32d9F70F6eF86718A51021ad269522Abf4CFFE49",
  18,
  "WAYA",
  "Plexswap Token",
  "https://plexswap.finance/"
);

export const bscToken = new ERC20Token(
  ChainId.BSC,
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  18,
  "BNB",
  "BNB",
  "https://www.binance.com/"
);
