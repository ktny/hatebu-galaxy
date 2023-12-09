import Bookmarks from "@/app/ui/bookmarks";
import Link from "next/link";
import Image from "next/image";
import { fetchUserInfo } from "@/app/lib/hatebu";

export default async function Page({ params }: { params: { username: string } }) {
  const username = params.username;
  const userPage = `https://b.hatena.ne.jp/${username}/bookmark`;

  const userInfo = await fetchUserInfo(username);

  return (
    <section>
      <h1>{username}</h1>
      <Link href={userPage} target="_blank">
        <Image src={userInfo.profile_image_url} width={64} height={64} alt={username} />
      </Link>
      <Bookmarks username={username}></Bookmarks>

      {/* <h2>total ★: {bookmarker.totalStars}</h2> */}

      {/* <a href={bookmarkListURL} target="_blank">
        <img src={data.profile_image_url} alt={username} />
      </a>

      <button className="btn btn-primary" onClick={reloadBookmarkerPage} disabled={isLoading}>
        再取得
      </button> */}

      {/* {#if isLoading}
        <div>{progress} / 1</div>
    {/if}

    {#each bookmarker?.bookmarks as bookmark, i (bookmark.eid)}
        {#if i < displayBookmarksCount}
            <Bookmark {username} {bookmark} />
        {/if}
    {/each} */}
    </section>
  );
}
