import type { NextApiRequest, NextApiResponse } from "next";
import { BookmarkStarGatherer } from "@/app/lib/gather";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET以外のリクエストを許可しない
  if (req.method?.toLocaleLowerCase() !== "get") {
    return res.status(405).end();
  }

  const username = req.query["username"] as string;
  const page = Number(req.query["page"]);
  const pageChunk = Number(req.query["pageChunk"]);

  const gatherer = new BookmarkStarGatherer(username);

  const data = await gatherer.gather(page, pageChunk);
  res.status(200).json(data);
}
