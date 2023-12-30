import { IBookmark, UserInfoResponse, fetchBookmarksFromHatenaResponse } from "@/app/lib/models";
import { CLOUDFRONT_DOMAIN } from "../config";

/**
 * はてなからユーザー情報を取得する
 * @param username
 * @returns
 */
export async function fetchUserInfo(username: string): Promise<UserInfoResponse | null> {
  const response = await fetch(`/api/fetchUserInfo?username=${username}`, { cache: "force-cache" });

  if (response.ok) {
    const data = await response.json();
    return data.user;
  } else {
    return null;
  }
}

/**
 * はてなからユーザーのブックマークを取得する
 * @param username
 * @param startPage
 * @param pageChunk
 * @param cache
 * @returns
 */
export async function fetchBookmarksFromHatena(
  username: string,
  startPage: number,
  pageChunk: number,
  cache: RequestCache
): Promise<fetchBookmarksFromHatenaResponse> {
  const response = await fetch(`/api/gather?username=${username}&startPage=${startPage}&pageChunk=${pageChunk}`, {
    cache,
  });

  if (response.ok) {
    return await response.json();
  }
  return { bookmarks: [], hasNextPage: false };
}

/**
 * ファイルからユーザーのブックマークを取得する
 * @param fileName
 * @returns
 */
export async function fetchBookmarksFromFile(fileNames: string[]): Promise<IBookmark[]> {
  const promises: Promise<Response>[] = [];

  // Promise.all用の配列にブックマーク取得用のリクエストを追加;
  for (const fileName of fileNames) {
    try {
      promises.push(fetch(`${CLOUDFRONT_DOMAIN}/${fileName}`));
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

/**
 * ユーザーの最初のブックマークのUnixTimeを取得する
 * @param username
 * @returns
 */
export async function fetchFirstBookmarkCreated(username: string): Promise<number> {
  const response = await fetch(`/api/firstBookmarkCreated?username=${username}`, { cache: "no-store" });

  if (response.ok) {
    const data = await response.json();
    return data.firstBookmarkCreated;
  }

  return 0;
}
