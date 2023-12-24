import { notFound } from "next/navigation";
import { IBookmark, UserInfoResponse } from "@/app/lib/models";

/**
 * はてなからユーザー情報を取得する
 * @param username
 * @returns
 */
export async function fetchUserInfo(username: string): Promise<UserInfoResponse | undefined> {
  const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${username}`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (response.status === 200) {
    const data = await response.json();
    return data.user;
  } else if (response.status === 404) {
    return notFound();
  }
}

/**
 * はてなからユーザーの月ごとのブックマークを取得する
 * @param username
 * @param startPage
 * @param pageChunk
 * @param cache
 * @returns
 */
export async function fetchBookmarksFromHatena(
  username: string,
  startPage: number,
  pageChunk: number
): Promise<IBookmark[]> {
  const res = await fetch(`/api/gather?username=${username}&startPage=${startPage}&pageChunk=${pageChunk}`, {
    cache: "no-store",
  });

  if (res.status < 400) {
    return await res.json();
  }
  return [];
}

/**
 * ブックマーク結果ファイル一覧を取得する
 * @param username
 * @returns
 */
export async function listBookmarkFileName(username: string): Promise<string[]> {
  const res = await fetch(`/api/listFile?username=${username}`);

  if (res.status < 400) {
    return await res.json();
  }
  return [];
}

/**
 * ファイルからユーザーの月ごとのブックマークを取得する
 * @param fileName
 * @returns
 */
export async function fetchBookmarksFromFile(fileNames: string[]): Promise<IBookmark[]> {
  const promises: Promise<Response>[] = [];

  // Promise.all用の配列にブックマーク取得用のリクエストを追加;
  for (const fileName of fileNames) {
    try {
      promises.push(fetch(`/api/fetchFile?key=${fileName}`, { cache: "no-store" }));
    } catch (e) {
      console.error(`/api/fetchFile?key=${fileName}`);
      console.error(e);
    }
  }

  // ブックマークページAPIのレスポンスを取得する
  const responses = await Promise.all(promises);

  let result: IBookmark[] = [];
  for (const response of responses) {
    const bookmarks: IBookmark[] = await response.json();
    result = result.concat(bookmarks);
  }

  return result;
}
