import { BookmarkerInfoResponse } from "./models";

export async function fetchUserInfo(username: string): Promise<BookmarkerInfoResponse> {
  const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${username}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.user;
}
