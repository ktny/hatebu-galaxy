// import Bookmark from "@/app/ui/bookmark";
import Bookmarks from "@/app/ui/bookmarks";
import Link from "next/link";
import Image from "next/image";

async function fetchUserIcon(username: string) {
  const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${username}`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  const data = await response.json();
  return data.user.profile_image_url;
}

export default async function Page({ params }: { params: { username: string } }) {
  const username = params.username;
  const userPage = `https://b.hatena.ne.jp/${username}/bookmark`;
  const icon = await fetchUserIcon(username);

  return (
    <main className="flex justify-center">
      <section className="max-w-prose px-8">
        <h1>{username}</h1>
        {/* <h2>total ★: {user.totalStars}</h2> */}
        <Link href={userPage} target="_blank">
          <Image src={icon} width={64} height={64} alt={username} />
        </Link>

        <Bookmarks username={username}></Bookmarks>
        {/* <div>
          {user.bookmarks.map((bookmark) => (
            <Bookmark bookmark={bookmark} key={bookmark.eid}></Bookmark>
          ))}
        </div> */}
      </section>
    </main>
  );
}
