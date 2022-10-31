import type { NextApiRequest, NextApiResponse } from "next";

import { getAssets, getRewards } from "../../lib";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const assets = await getAssets();
  const rewards = getRewards(assets);

  return res.status(200).json(rewards);
}
