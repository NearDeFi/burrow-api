import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

interface Error {
  error: string;
}

interface Count {
  count: number;
}

const prisma = new PrismaClient();
const burrow_contract = "contract.main.burrow.near";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Count | Error>) {
  const { account } = req.query;

  try {
    const [transactions] = await prisma.$queryRaw<Count[]>`
        SELECT COUNT(*) as count FROM events
          WHERE account_id = ${burrow_contract} AND event LIKE ${"%" + account + "%"}
        `;

    const count = Number(transactions.count);

    return res.status(200).json({ count });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
