import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

interface Error {
  error: string;
}

interface Event {
  block_timestamp: bigint;
  receipt_id: string;
  status: string;
  event: string;
}

interface EventData {
  event: string;
  data: {
    account_id: string;
    amount: string;
    token_id: string;
  }[];
}

interface Transaction {
  block_timestamp: bigint;
  receipt_id: string;
  status: string;
  event: EventData;
}

const transformEventData = ({ event, data }: EventData) => ({
  event,
  data,
});

const transformEvent = (event: Event) => ({
  ...event,
  event: transformEventData(JSON.parse(event.event)),
});

const prisma = new PrismaClient();
const burrow_contract = "contract.main.burrow.near";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Transaction[] | Error>,
) {
  const { account, limit = 10, offset = 0 } = req.query;

  if (Number.isNaN(Number(limit)) || Number.isNaN(Number(offset))) {
    return res.status(400).send({ error: "Invalid limit or offset" });
  }

  try {
    const transactions = await prisma.$queryRaw<Event[]>`
        SELECT block_timestamp, receipt_id, status, event FROM events
          WHERE account_id = ${burrow_contract} AND event LIKE ${"%" + account + "%"}
          ORDER BY block_timestamp DESC
          OFFSET ${Number(offset)}
          limit ${Number(limit)}
        `;

    return res.status(200).json(transactions.map(transformEvent));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
