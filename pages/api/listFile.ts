import type { NextApiRequest, NextApiResponse } from "next";
import { listS3Objects } from "@/app/lib/aws";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET以外のリクエストを許可しない
  if (req.method?.toLocaleLowerCase() !== "get") {
    return res.status(405).end();
  }

  const username = req.query["username"] as string;

  const files = await listS3Objects(username);
  if (files !== undefined) {
    const data = files.map(file => file.Key);
    res.status(200).json(data);
    return;
  } else {
    res.status(404);
    return;
  }
}
