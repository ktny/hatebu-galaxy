import Link from "next/link";
import Image from "next/image";
import Bookmarks from "@/app/ui/bookmarks";
import { BookmarkerInfoResponse } from "@/app/lib/models";

async function fetchUserInfo(username: string): Promise<BookmarkerInfoResponse> {
  const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${username}`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  const data = await response.json();
  return data.user;
}

export default async function Page({ params }: { params: { username: string } }) {
  const username = params.username;
  const userPage = `https://b.hatena.ne.jp/${username}/bookmark`;
  const user = await fetchUserInfo(username);

  return (
    <main className="flex justify-center">
      <section className="max-w-prose px-8">
        <h1>{username}</h1>
        {/* <h2>total ★: {user.totalStars}</h2> */}
        <Link href={userPage} target="_blank">
          <Image src={user.profile_image_url} width={64} height={64} alt={username} />
        </Link>

        <Bookmarks username={username} totalBookmarks={user.total_bookmarks}></Bookmarks>
      </section>
    </main>
  );
}
