import Link from "next/link";
import Image from "next/image";
import StarList from "@/app/ui/starList";
import { IBookmark } from "../lib/models";

export default function Bookmark({ username, bookmark }: { username: string; bookmark: IBookmark }) {
  return (
    <div className="card card-compact w-full shadow-xl mt-8">
      <div className="flex items-center gap-2">
        <figure className="shrink-0 w-24 md:w-52">{bookmark.image && <Image src={bookmark.image} width={200} height={112} alt={bookmark.title} />}</figure>
        <h2 className="card-title block p-2">
          <Link href={bookmark.entryURL} target="_blank" className="mr-2">
            {bookmark.title}
          </Link>
          <Link href={bookmark.bookmarksURL} target="_blank" className="badge badge-accent shrink-0">
            {bookmark.bookmarkCount} user
          </Link>
        </h2>
      </div>
      <div className="card-body">
        <p className="text-lg">
          <Link href={`https://b.hatena.ne.jp/entry/${bookmark.eid}/comment/${username}`} target="_blank">
            {bookmark.comment}
          </Link>
        </p>
        <StarList starsCount={bookmark.star} displayIfZero={false}></StarList>
      </div>
    </div>
  );
}
