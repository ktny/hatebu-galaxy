import Bookmark from "./bookmark";
import { BookmarkStarGatherer } from "../lib/gather";

export default async function Bookmarks({ username }: { username: string }) {
  const gatherer = new BookmarkStarGatherer(username);

  const bookmarkerData = await gatherer.main();
  const bookmarks = bookmarkerData.bookmarks;

  return (
    <div>
      {bookmarks.map((bookmark) => (
        <Bookmark bookmark={bookmark} key={bookmark.eid}></Bookmark>
      ))}
    </div>
  );
}
