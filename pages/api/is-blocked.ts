import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

interface Error {
  error: string;
}

interface Ok {
  ok: boolean;
  ip: string | string[] | undefined;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Error>) {
  await runMiddleware(req, res, cors);

  try {
    const ip = req.headers["x-forwarded-for"];

    console.log(ip);

    return res.status(200).json({ ok: true, ip });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
