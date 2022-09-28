import type { NextApiRequest, NextApiResponse } from "next";

interface Error {
  error: string;
}

interface Ok {
  ok: boolean;
  ip: string | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Error>) {
  try {
    const ip = req.socket.remoteAddress;

    console.log(ip);

    return res.status(200).json({ ok: true, ip });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
