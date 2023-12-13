import Link from "next/link";
import Image from "next/image";
import StarList from "@/app/ui/starList";
import { IBookmark } from "@/app/lib/models";

export default function Bookmark({ username, bookmark }: { username: string; bookmark: IBookmark }) {
  return (
    <div className="card card-compact w-full shadow-xl mt-8">
      <div className="flex items-center gap-2">
        <figure className="shrink-0 w-24 md:w-52">
          {bookmark.image && <Image src={bookmark.image} width={256} height={144} alt={bookmark.title} />}
        </figure>
        <h2 className="card-title block p-2">
          <Link href={bookmark.entryURL} target="_blank" className="mr-2">
            {bookmark.title}
          </Link>
          <Link href={bookmark.bookmarksURL} target="_blank" className="badge badge-accent shrink-0">
            {bookmark.bookmarkCount} user
          </Link>
        </h2>
      </div>
      <Link
        className="card-body"
        href={`https://b.hatena.ne.jp/entry/${bookmark.eid}/comment/${username}`}
        target="_blank"
      >
        <p className="text-lg">{bookmark.comment}</p>
        <div className="flex justify-between">
          <StarList allColorStarCount={bookmark.star} forceCountDisplay={false}></StarList>
          <span className="shrink-0">{bookmark.bookmarkDate}</span>
        </div>
      </Link>
    </div>
  );
}
