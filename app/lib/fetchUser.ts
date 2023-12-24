import { notFound } from "next/navigation";
import { UserInfoResponse } from "@/app/lib/models";

export default async function fetchUserInfo(username: string): Promise<UserInfoResponse | undefined> {
  const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${username}`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (response.status === 200) {
    const data = await response.json();
    return data.user;
  } else if (response.status === 404) {
    return notFound();
  }
}
