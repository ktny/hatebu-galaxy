import type { NextApiRequest, NextApiResponse } from "next";
import { CLOUDFRONT_DOMAIN } from "@/app/config";

// vercel serverless function のtimeoutを30sに設定する
export const maxDuration = 30;

/**
 * CloudFrontから指定のオブジェクトを取得する
 * @param req
 * @param res
 * @returns
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET以外のリクエストを許可しない
  if (req.method?.toLocaleLowerCase() !== "get") {
    return res.status(405).end();
  }

  const key = req.query["key"] as string;

  const filepath = `${CLOUDFRONT_DOMAIN}/${key}`;

  const response = await fetch(filepath);
  if (response.status === 200) {
    const data = await response.json();
    res.status(200).json(data);
    return;
  }
}
