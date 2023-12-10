import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";
import { BookmarkStarGatherer } from "@/app/lib/gather";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET以外のリクエストを許可しない
  if (req.method?.toLocaleLowerCase() !== "get") {
    return res.status(405).end();
  }

  const username = req.query["username"] as string;
  const page = Number(req.query["page"]);
  const pageChunk = Number(req.query["pageChunk"]);

  const filepath = `/tmp/${username}/${page}.json`;

  // try {
  //   const jsonString = fs.readFileSync(filepath, "utf-8");
  //   const jsonData = JSON.parse(jsonString);
  //   res.status(200).json(jsonData);
  // } catch (error) {
  //   console.error("ファイルの読み込みエラー:", error);
  // }

  const gatherer = new BookmarkStarGatherer(username);

  try {
    // 取得中はローディングをtrueにする
    // loadingGatheres.add(username);
    const data = await gatherer.gather(page, pageChunk);
    res.status(200).json(data);

    // 取得したデータはファイルに保存してキャッシュする
    // const jsonString = JSON.stringify(data, null, 2);
    // fs.writeFileSync(filepath, jsonString, "utf-8");
  } finally {
    // loadingGatheres.delete(username);
  }
}
