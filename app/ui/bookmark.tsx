import Link from "next/link";
import Image from "next/image";
import StarList from "@/app/ui/starList";
import { IBookmark } from "@/app/lib/models";
import { formatDateString } from "@/app/lib/util";

export default function Bookmark({
  username,
  bookmark,
  rank,
}: {
  username: string;
  bookmark: IBookmark;
  rank: number;
}) {
  return (
    <div className="card card-compact bg-neutral w-full shadow-xl mt-8" style={{ overflowWrap: "anywhere" }}>
      <div className="indicator-item badge badge-secondary absolute top-2 left-2">{rank}</div>
      <div className="flex items-center">
        {bookmark.image && (
          <Link href={bookmark.entryURL} target="_blank" className="hover:opacity-50">
            <figure className="shrink-0 w-24 md:w-52">
              <Image src={bookmark.image} width={256} height={144} alt={bookmark.title} />
            </figure>
          </Link>
        )}
        <h2 className="card-title block p-4">
          <Link href={bookmark.entryURL} target="_blank" className="line-clamp-3 hover:opacity-50">
            {bookmark.title}
          </Link>
          <Link
            href={bookmark.entryBookmarkURL}
            target="_blank"
            className="badge badge-accent shrink-0 hover:opacity-50"
          >
            {bookmark.bookmarkCount} user
          </Link>
        </h2>
      </div>
      <Link
        className="card-body hover:opacity-50"
        href={`https://b.hatena.ne.jp/entry/${bookmark.eid}/comment/${username}`}
        target="_blank"
      >
        <p className="text-lg">{bookmark.comment}</p>
        <div className="flex justify-between">
          <StarList allColorStarCount={bookmark.star} forceCountDisplay={false}></StarList>
          <span className="shrink-0">{formatDateString(new Date(bookmark.created))}</span>
        </div>
      </Link>
    </div>
  );
}
