import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "redis";

const BLOCKED_COUNTRIES = [
  "CU", // Cuba
  "CF", // Central African Republic
  "IR", // Iran
  "IQ", // Iraq
  "LB", // Lebanon
  "LY", // Libya
  "KP", // North Korea
  "RU", // Russia
  "SO", // Somalia
  "SS", // South Sudan
  "SD", // Sudan and Darfur
  "SY", // Syria
  "VE", // Venezuela
  "YE", // Yemen
];

interface Error {
  error: string;
}

interface Ok {
  blocked: boolean;
  ip?: string;
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
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

    const ip = req.headers["x-forwarded-for"] as string;

    if (!ip) return res.status(200).json({ blocked: false });

    const value = await client.get(ip);

    if (value !== null) {
      return res.status(200).json({ blocked: !!value, ip });
    }

    const response = await fetch(`https://vpnapi.io/api/${ip}?key=${process.env.VPNAPI_KEY}`);

    if (!response.ok) {
      return res.status(200).json({ blocked: false, ip, error: "VPNAPI error" });
    }

    const ipInfo = await response.json();

    const {
      security: { vpn, proxy, tor, relay },
      location: { country_code: countryCode },
    } = ipInfo;

    const blocked = vpn || proxy || tor || relay || BLOCKED_COUNTRIES.includes(countryCode);

    await client.set(ip, blocked ? 1 : 0);
    await client.disconnect();

    return res.status(200).json({ blocked, ip });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
