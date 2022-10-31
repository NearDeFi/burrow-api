import * as nearAPI from "near-api-js";
import Decimal from "decimal.js";

import { CONTRACT_NAME } from "./config";
import { sumReducer, toUsd, transformContractAssets } from "./utils";
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
    viewMethods: ["get_asset", "get_assets_paged", "ft_metadata", "get_config", "get_price_data"],
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

export const getRewards = (assets: any) => {
  const rewards = assets.map((asset: any) => {
    const apyBase = asset["supply_apr"] * 100;
    const tokenId = asset.token_id;
    const totalDeposits = toUsd(asset.supplied.balance, asset);

    const suppliedFarmRewards =
      asset.farms.find((farm: any) => farm.farm_id.Supplied === tokenId)?.rewards || {};

    const rewardTokens = Object.entries(suppliedFarmRewards).map(
      ([rewardTokenId]) => rewardTokenId,
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
          .div(totalDeposits)
          .mul(100)
          .toNumber() || 0
      );
    });

    const apyReward = apyRewards.reduce(sumReducer, 0);

    return {
      token_id: asset.token_id,
      chain: "NEAR",
      project: "Burrow",
      symbol: asset.metadata.symbol,
      tvlUsd: totalDeposits,
      apyReward,
      apyBase,
      rewardTokens,
    };
  });

  return rewards;
};
