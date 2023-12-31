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
  // TODO: リトライ対応
  try {
    const response = await fetch(`/api/gather?username=${username}&startPage=${startPage}&pageChunk=${pageChunk}`, {
      cache,
    });

    if (response.ok) {
      return await response.json();
    }
    return { bookmarks: [], hasNextPage: false };
  } catch (error) {
    console.error(error);

    // エラーのときは次ページがあるとして返す
    return { bookmarks: [], hasNextPage: true };
  }
}

/**
 * ファイルからユーザーのブックマークを取得する
 * @param fileName
 * @returns
 */
export async function fetchBookmarksFromFile(fileNames: string[]): Promise<IBookmark[]> {
  let result: IBookmark[] = [];

  // 最初のブックマークの日付を元に推測したキャッシュファイル名でしかないのでallでなく1ファイルずつ取得する
  // 取得できなかったファイルはない可能性もあるのでそのまま取得しない
  for (const fileName of fileNames) {
    const response = await fetch(`${CLOUDFRONT_DOMAIN}/${fileName}`);
    if (response.ok) {
      const bookmarks: IBookmark[] = await response.json();
      result = result.concat(bookmarks);
    }
  }

  return result;
}

/**
 * ユーザーの最初のブックマークのUnixTimeを取得する
 * @param username
 * @returns
 */
export async function fetchFirstBookmarkCreated(username: string): Promise<number> {
  const response = await fetch(`/api/firstBookmarkCreated?username=${username}`, {
    // cache: "no-store",
    // headers: new Headers({
    //   "Cache-Control": "max-age=86400",
    // }),
  });

  if (response.ok) {
    const data = await response.json();
    return data.firstBookmarkCreated;
  }

  return 0;
}
