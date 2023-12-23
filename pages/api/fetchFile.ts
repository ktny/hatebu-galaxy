import type { NextApiRequest, NextApiResponse } from "next";
import { BookmarkStarGatherer } from "@/app/lib/gather";
import { invalidation, uploadS3 } from "@/app/lib/aws";
import { CLOUDFRONT_DOMAIN } from "@/app/config";

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
  // const cache = req.headers["X-CACHE-GALAXY"] as string;

  const filepath = `${CLOUDFRONT_DOMAIN}/${key}`;

  // 再取得時はCloudFrontのキャッシュ削除とS3ファイルの削除を行う
  // if (cache === "reload" && startPage === 1) {
  //   console.log(`invalidate cloudfront cache: ${username}`);
  //   invalidation([`/${username}/*`]);
  // }

  // CloudFrontに取得済みのキャッシュがあればそれを利用する
  // if (cache === "force-cache") {
  const response = await fetch(filepath);
  if (response.status === 200) {
    const data = await response.json();
    console.log("use cloudfront cache");
    res.status(200).json(data);
    return;
  }
  // }

  // キャッシュがなければブックマーク取得を行う
  // const gatherer = new BookmarkStarGatherer(username);
  // const data = await gatherer.gather(startPage, pageChunk);
  // res.status(200).json(data);

  // 取得したデータはファイルに保存してキャッシュする
  // uploadS3(key, data);
}
