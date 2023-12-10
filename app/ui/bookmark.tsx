import Link from "next/link";
import Image from "next/image";
import { ColorTypes, IBookmark } from "../lib/models";

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
        <div className="flex flex-wrap">
          {ColorTypes.map((colorType) => {
            const starCount = bookmark.star[colorType];
            if (starCount === undefined) return;

            if (starCount > 5) {
              return (
                <span key={`${bookmark.eid}_${colorType}_more`} className="flex items-center">
                  <span className={`i-solar-star-bold w-6 h-6 bg-${colorType}-500`}></span>
                  <span>{starCount}</span>
                </span>
              );
            } else {
              return [...Array(starCount)].map((_, i) => (
                <span key={`${bookmark.eid}_${colorType}_${i}`} className={`i-solar-star-bold w-6 h-6 bg-${colorType}-500`}></span>
              ));
            }
          })}
        </div>
      </div>
    </div>
  );
}
