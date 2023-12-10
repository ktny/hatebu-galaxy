import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";
import { BookmarkStarGatherer } from "@/app/lib/gather";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET以外のリクエストを許可しない
  if (req.method?.toLocaleLowerCase() !== "get") {
    return res.status(405).end();
  }

  const username = req.query["username"] as string;
  const filepath = `/tmp/${username}.json`;

  try {
    const jsonString = fs.readFileSync(filepath, "utf-8");
    const jsonData = JSON.parse(jsonString);
    res.status(200).json(jsonData);
  } catch (error) {
    console.error("ファイルの読み込みエラー:", error);
  }

  const gatherer = new BookmarkStarGatherer(username);

  try {
    // 取得中はローディングをtrueにする
    // loadingGatheres.add(username);
    const bookmarkerData = await gatherer.main();

    // 取得したデータはファイルに保存してキャッシュする
    const jsonString = JSON.stringify(bookmarkerData, null, 2);
    fs.writeFileSync(filepath, jsonString, "utf-8");

    res.status(200).json(bookmarkerData);
  } finally {
    // loadingGatheres.delete(username);
  }
}
