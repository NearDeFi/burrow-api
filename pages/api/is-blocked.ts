import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Error>) {
  await runMiddleware(req, res, cors);
  // return res.status(200).json({ blocked: false });

  try {
    const ip = req.headers["x-forwarded-for"];

    if (!ip) return res.status(200).json({ blocked: false });

    const ipInfo = await fetch(`https://vpnapi.io/api/${ip}?key=${process.env.VPNAPI_KEY}`).then(
      (r) => r.json(),
    );

    const {
      security: { vpn, proxy, tor, relay },
      location: { country_code: countryCode },
    } = ipInfo;

    const isBocked = vpn || proxy || tor || relay || BLOCKED_COUNTRIES.includes(countryCode);

    return res.status(200).json({ blocked: isBocked, ip });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
