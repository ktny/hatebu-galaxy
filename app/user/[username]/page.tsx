import Bookmark from "@/app/ui/bookmark";
import Link from "next/link";
import Image from "next/image";
import { fetchUserInfo } from "@/app/lib/hatebu";
import { BookmarkStarGatherer } from "@/app/lib/gather";

export default async function Page({ params }: { params: { username: string } }) {
  const username = params.username;
  const userPage = `https://b.hatena.ne.jp/${username}/bookmark`;

  const userInfo = await fetchUserInfo(username);

  const gatherer = new BookmarkStarGatherer(username);
  const bookmarkerData = await gatherer.main();

  return (
    <main className="flex justify-center">
      <section className="max-w-prose px-8">
        <h1>{username}</h1>
        <h2>total ★: {bookmarkerData.totalStars}</h2>
        <Link href={userPage} target="_blank">
          <Image src={userInfo.profile_image_url} width={64} height={64} alt={username} />
        </Link>

        <div>
          {bookmarkerData.bookmarks.map((bookmark) => (
            <Bookmark bookmark={bookmark} key={bookmark.eid}></Bookmark>
          ))}
        </div>

        {/* <button className="btn btn-primary" onClick={reloadBookmarkerPage} disabled={isLoading}>
        再取得
      </button> */}

        {/* {#if isLoading}
        <div>{progress} / 1</div>
    {/if}    
    */}
      </section>
    </main>
  );
}
