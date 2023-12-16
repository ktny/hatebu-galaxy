import Link from "next/link";
import Image from "next/image";
import Bookmarks from "@/app/ui/bookmarks";
import ScrollTop from "@/app/ui/scrollTop";
import { BookmarkerInfoResponse } from "@/app/lib/models";
import { notFound } from "next/navigation";

async function fetchUserInfo(username: string): Promise<BookmarkerInfoResponse | undefined> {
  const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${username}`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (response.status === 200) {
    const data = await response.json();
    return data.user;
  } else if (response.status === 404) {
    return notFound();
  }
}

export default async function Page({ params }: { params: { username: string } }) {
  const username = params.username;
  const userPage = `https://b.hatena.ne.jp/${username}/bookmark`;
  const user = await fetchUserInfo(username);

  if (user !== undefined) {
    return (
      <main className="flex md:justify-center">
        <article className="w-full md:max-w-screen-md p-4">
          <div className="flex items-center gap-4">
            <div className="avatar w-16 h-16 shrink-0">
              <div className="rounded-xl">
                <Link href={userPage} target="_blank">
                  <Image src={user.profile_image_url} width={64} height={64} alt={username} priority />
                </Link>
              </div>
            </div>
            <h1 className="font-mono text-2xl" style={{ overflowWrap: "anywhere" }}>
              {username}
            </h1>
          </div>

          <Bookmarks username={username} totalBookmarks={user.total_bookmarks}></Bookmarks>
        </article>

        <ScrollTop />
      </main>
    );
  }
}
