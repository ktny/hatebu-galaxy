import type { NextApiRequest, NextApiResponse } from "next";

/**
 * はてなからユーザー情報を取得する
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
  const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${username}`;
  const response = await fetch(url, { next: { revalidate: 86400 } });

  console.log(response.status);

  if (response.status < 400) {
    const data = await response.json();
    res.status(200).json(data);
    return;
  }

  console.log("aeerere");
  res.status(404).json({});
  return;
}
