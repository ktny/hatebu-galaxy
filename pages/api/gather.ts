import type { NextApiRequest, NextApiResponse } from "next";
import { BookmarkStarGatherer } from "@/app/lib/gather";

/**
 * はてなからユーザーのブックマークを取得する
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
  const startPage = Number(req.query["startPage"]);
  const pageChunk = Number(req.query["pageChunk"]);

  // ブックマーク取得を行う
  const gatherer = new BookmarkStarGatherer(username);
  const data = await gatherer.gather(startPage, pageChunk);

  if (data.bookmarks.length === 0) {
    res.status(404).json({});
  }

  res.status(200).json(data);
}
