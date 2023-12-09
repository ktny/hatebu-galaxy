import Link from "next/link";
import Image from "next/image";
import { ColorTypes, IBookmark } from "../lib/models";

export default function Bookmark({ bookmark }: { bookmark: IBookmark }) {
  return (
    <div className="card w-full shadow-xl mb-8">
      <figure>{bookmark.image && <Image src={bookmark?.image} width={511} height={288} alt={bookmark?.title} />}</figure>
      <div className="card-body">
        <h2 className="card-title">
          <Link href={bookmark?.entryURL} target="_blank">
            {bookmark?.title}
          </Link>
          <Link href={bookmark?.bookmarksURL} target="_blank" className="badge badge-accent">
            {bookmark?.bookmarkCount} user
          </Link>
        </h2>
        <p>
          <Link href="https://b.hatena.ne.jp/entry/{bookmark?.eid}/comment/{username}" target="_blank">
            {bookmark?.comment}
          </Link>
        </p>
        <div className="flex">
          {ColorTypes.map((colorType) => {
            const starCount = bookmark?.star[colorType];
            if (starCount === undefined) return;

            if (starCount > 5) {
              return (
                <>
                  <span key={`${bookmark.eid}_${colorType}_more`} className={`i-solar-star-bold w-6 h-6 bg-${colorType}-500`}></span>
                  <span>{starCount}</span>
                </>
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
