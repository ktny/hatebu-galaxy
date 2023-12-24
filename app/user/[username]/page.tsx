import Link from "next/link";
import Image from "next/image";
import Bookmarks from "@/app/ui/bookmarks";
import ScrollTop from "@/app/ui/scrollTop";
import { fetchUserInfo } from "@/app/api/api";

export default async function Page({ params }: { params: { username: string } }) {
  const username = params.username;
  const userPage = `https://b.hatena.ne.jp/${username}/bookmark`;
  const user = await fetchUserInfo(username);

  if (user !== undefined) {
    return (
      <>
        <article className="w-full md:max-w-screen-md">
          <Link href={userPage} target="_blank" className="hover:opacity-50">
            <div className="flex items-center gap-4">
              <div className="avatar w-16 h-16 shrink-0">
                <div className="rounded-xl">
                  <Image src={user.profile_image_url} width={64} height={64} alt={username} priority />
                </div>
              </div>
              <h1 className="font-mono text-2xl" style={{ overflowWrap: "anywhere" }}>
                {username}
              </h1>
            </div>
          </Link>

          <Bookmarks username={username} totalBookmarks={user.total_bookmarks}></Bookmarks>
        </article>

        <ScrollTop />
      </>
    );
  }
}
