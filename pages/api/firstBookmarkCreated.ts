import type { NextApiRequest, NextApiResponse } from "next";
import { getItemFromDynamo } from "@/app/lib/aws";

/**
 *
 * @param req
 * @param res
 * @returns
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET以外のリクエストを許可しない
  if (req.method?.toLocaleLowerCase() !== "get") {
    return res.status(405).end();
  }

  const username = req.query["username"] as string;
  const data = await getItemFromDynamo(username);
  res.status(200).json(data.Item);
  return;
}
