import * as nearAPI from "near-api-js";
import Decimal from "decimal.js";
import { uniq } from "lodash";

import { CONTRACT_NAME } from "./config";
import { getTotalBalance, shrinkToken, sumReducer, toUsd, transformContractAssets } from "./utils";
import { IftContractCall } from "./interfaces";
import { config } from "./config";

const { connect } = nearAPI;

export const ftContractCall = async ({
  contractName = CONTRACT_NAME,
  method,
  args = {},
}: IftContractCall) => {
  const near = await connect(config);

  const account = await near.account("root.near");

  const contract = new nearAPI.Contract(account, contractName, {
    viewMethods: [
      "get_asset",
      "get_assets_paged",
      "ft_metadata",
      "get_config",
      "get_price_data",
      "get_asset_farm",
    ],
    changeMethods: [],
  }) as any;

  return contract[method](args);
};

export const getAssets = async () => {
  const assets = await ftContractCall({ method: "get_assets_paged" });
  const tokenIds = assets.map(([id]: [string]) => id);

  const assetsDetailed = await Promise.all(
    tokenIds.map((token_id: string) => ftContractCall({ method: "get_asset", args: { token_id } })),
  );

  const metadata = await Promise.all(
    tokenIds.map((tokenId: string) =>
      ftContractCall({ method: "ft_metadata", contractName: tokenId }),
    ),
  );

  const config = await ftContractCall({ method: "get_config" });

  const prices = await ftContractCall({
    method: "get_price_data",
    contractName: config["oracle_account_id"],
  });

  const refPrices = await fetch(
    "https://raw.githubusercontent.com/NearDeFi/token-prices/main/ref-prices.json",
  ).then((r) => r.json());

  return transformContractAssets(assetsDetailed, metadata, prices, refPrices);
};

const getNetLiquidityAPY = async (assets: any) => {
  const netLiquidityFarm = await ftContractCall({
    method: "get_asset_farm",
    args: { farm_id: "NetTvl" },
  });
  const totalDailyNetLiquidityRewards = Object.entries(netLiquidityFarm.rewards)
    .map(([rewardTokenId, farm]: any) => {
      const rewardAsset = assets.find((a: any) => a.token_id === rewardTokenId);
      const assetDecimals = rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
      const dailyAmount = Number(shrinkToken(farm.reward_per_day, assetDecimals));
      return dailyAmount * rewardAsset.price.usd * (rewardAsset.config.net_tvl_multiplier / 10000);
    })
    .reduce(sumReducer, 0);

  const supplied = getTotalBalance(assets, "supplied");
  const borrowed = getTotalBalance(assets, "borrowed");

  const totalProtocolLiquidity = supplied - borrowed;
  const netLiquidtyAPY = ((totalDailyNetLiquidityRewards * 365) / totalProtocolLiquidity) * 100;

  const rewardTokens = Object.entries(netLiquidityFarm.rewards).map(
    ([rewardTokenId]) => rewardTokenId,
  );

  return [netLiquidtyAPY, rewardTokens];
};

export const getRewards = async (assets: any) => {
  const [apyRewardTvl, rewardTokensTVL] = (await getNetLiquidityAPY(assets)) as any;

  const rewards = assets.map((asset: any) => {
    const apyBase = asset["supply_apr"] * 100;
    const apyBaseBorrow = asset["borrow_apr"] * 100;
    const tokenId = asset.token_id;
    const totalSupplyUsd = toUsd(asset.supplied.balance, asset);
    const totalBorrowUsd = toUsd(asset.borrowed.balance, asset);

    const suppliedFarmRewards =
      asset.farms.find((farm: any) => farm.farm_id.Supplied === tokenId)?.rewards || {};

    const rewardTokens = uniq(
      Object.entries(suppliedFarmRewards)
        .map(([rewardTokenId]) => rewardTokenId)
        .concat(rewardTokensTVL),
    );

    const apyRewards = Object.entries(suppliedFarmRewards).map(([rewardTokenId, reward]: any) => {
      const rewardAsset = assets.find((a: any) => a.token_id === rewardTokenId);
      const decimals = rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
      const price = rewardAsset.price?.usd || 0;
      return (
        new Decimal(reward.reward_per_day)
          .div(new Decimal(10).pow(decimals))
          .mul(365)
          .mul(price)
          .div(totalSupplyUsd)
          .mul(100)
          .toNumber() || 0
      );
    });

    const apyReward = apyRewards.reduce(sumReducer, 0);

    const borrowedFarmRewards =
      asset.farms.find((farm: any) => farm.farm_id.Borrowed === tokenId)?.rewards || {};

    const rewardTokensBorrow = Object.entries(borrowedFarmRewards).map(
      ([rewardTokenId]) => rewardTokenId,
    );

    const apyRewardBorrow = Object.entries(borrowedFarmRewards)
      .map(([rewardTokenId, reward]: any) => {
        const rewardAsset = assets.find((a: any) => a.token_id === rewardTokenId);
        const decimals = rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;
        const price = rewardAsset.price?.usd || 0;
        return (
          new Decimal(reward.reward_per_day)
            .div(new Decimal(10).pow(decimals))
            .mul(365)
            .mul(price)
            .div(totalBorrowUsd)
            .mul(100)
            .toNumber() || 0
        );
      })
      .reduce(sumReducer, 0);

    return {
      token_id: asset.token_id,
      chain: "NEAR",
      project: "Burrow",
      symbol: asset.metadata.symbol,
      tvlUsd: totalSupplyUsd - totalBorrowUsd,
      apyReward,
      apyRewardTvl,
      apyBase,
      rewardTokens,
      totalSupplyUsd,
      totalBorrowUsd,
      apyBaseBorrow,
      apyRewardBorrow,
      rewardTokensBorrow,
      ltv: asset.config.volatility_ratio,
    };
  });

  return rewards;
};
