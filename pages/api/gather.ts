import type { NextApiRequest, NextApiResponse } from "next";
import { BookmarkStarGatherer } from "@/app/lib/gather";
import { invalidation, uploadS3 } from "@/app/lib/aws";
import { CLOUDFRONT_DOMAIN } from "@/app/config";
import { padNumber } from "@/app/lib/util";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET以外のリクエストを許可しない
  if (req.method?.toLocaleLowerCase() !== "get") {
    return res.status(405).end();
  }

  const username = req.query["username"] as string;
  const startPage = Number(req.query["startPage"]);
  const pageChunk = Number(req.query["pageChunk"]);
  const cache = req.headers["X-CACHE-GALAXY"] as string;

  const start = padNumber(startPage, 5);
  const end = padNumber(startPage + pageChunk - 1, 5);
  const key = `${username}/${start}-${end}.json`;
  const filepath = `${CLOUDFRONT_DOMAIN}/${key}`;

  // 再取得時はCloudFrontのキャッシュ削除とS3ファイルの削除を行う
  if (cache === "reload" && startPage === 1) {
    console.log(`invalidate cloudfront cache: ${username}`);
    invalidation([`/${username}/*`]);
  }

  // CloudFrontに取得済みのキャッシュがあればそれを利用する
  if (cache === "force-cache") {
    const response = await fetch(filepath);
    if (response.status === 200) {
      const data = await response.json();
      console.log("use cloudfront cache");
      res.status(200).json(data);
      return;
    }
  }

  // キャッシュがなければブックマーク取得を行う
  const gatherer = new BookmarkStarGatherer(username);
  const data = await gatherer.gather(startPage, pageChunk);
  res.status(200).json(data);

  // 取得したデータはファイルに保存してキャッシュする
  uploadS3(key, data);
}
