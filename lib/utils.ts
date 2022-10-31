import Decimal from "decimal.js";

export const sumReducer = (sum: number, a: number) => sum + a;

const shrinkToken = (value: string | number, decimals: string | number, fixed?: number): string => {
  return new Decimal(value).div(new Decimal(10).pow(decimals)).toFixed(fixed);
};

export const toUsd = (balance: string, asset: any) =>
  asset.price?.usd
    ? Number(shrinkToken(balance, asset.metadata.decimals + asset.config.extra_decimals)) *
      asset.price.usd
    : 0;

export const transformContractAssets = (assets: any, metadata: any, prices: any, refPrices: any) =>
  assets.map((asset: any, i: number) => {
    const price = prices.prices.find((p: any) => p.asset_id === asset.token_id);
    const usd =
      Number(price?.price?.multiplier) / 10 ** (price?.price?.decimals - metadata[i].decimals);

    delete metadata[i].icon;
    return {
      ...asset,
      metadata: metadata[i],
      price: {
        ...price?.price,
        usd: usd ? usd : Number(refPrices[asset.token_id].price),
      },
    };
  });