import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

interface Ok {
  ip?: string | string[] | undefined;
}

const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok>) {
  await runMiddleware(req, res, cors);
  const ip = req.headers["x-forwarded-for"];
  return res.status(200).json({ ip });
}
